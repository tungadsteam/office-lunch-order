const pool = require('../config/database');
const NotificationService = require('./NotificationService');

/**
 * SettlementService
 * Implements Algorithm 2: Atomic invoice settlement (updated flow)
 *
 * NEW FLOW (v2):
 * - Người đi mua cơm điền số tiền thực tế
 * - Hệ thống chia đều và trừ đều mỗi người tham gia
 * - KHÔNG auto-credit payer (khác v1)
 * - Tạo reimbursement_request để admin chuyển khoản cho người mua
 * - Admin bấm "Đã chuyển tiền" → user xác nhận "Đã nhận / Chưa nhận"
 */
class SettlementService {
  /**
   * Settle invoice for a lunch session
   * @param {number} sessionId - Lunch session ID
   * @param {number} payerId - User who paid the bill (một trong các buyer)
   * @param {number} totalBill - Total bill amount (số tiền thực tế)
   * @param {string} billImageUrl - Optional bill image URL
   */
  async settleInvoice(sessionId, payerId, totalBill, billImageUrl = null) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Lock session row (pessimistic locking)
      const sessionResult = await client.query(
        'SELECT * FROM lunch_sessions WHERE id = $1 FOR UPDATE',
        [sessionId]
      );

      if (sessionResult.rows.length === 0) {
        throw new Error('Session not found');
      }

      const session = sessionResult.rows[0];

      if (session.status === 'settled') {
        throw new Error('Invoice already settled');
      }

      if (session.status !== 'buyers_selected' && session.status !== 'buying') {
        throw new Error(`Cannot settle invoice for session with status: ${session.status}`);
      }

      // Validate payer is one of the selected buyers
      if (!session.buyer_ids || !session.buyer_ids.includes(payerId)) {
        throw new Error('Only selected buyers can submit payment');
      }

      // 2. Get all participants (confirmed orders)
      const participantsResult = await client.query(`
        SELECT lo.*, u.id AS user_id, u.name, u.email, u.balance, u.fcm_token
        FROM lunch_orders lo
        JOIN users u ON lo.user_id = u.id
        WHERE lo.session_id = $1 AND lo.status = 'confirmed'
      `, [sessionId]);

      const participants = participantsResult.rows;

      if (participants.length === 0) {
        throw new Error('No participants found');
      }

      const numPeople = participants.length;

      // 3. Calculate amount per person (round to nearest dong)
      const amountPerPerson = Math.round(totalBill / numPeople);

      console.log(`💰 Settlement v2: ${totalBill} VND / ${numPeople} people = ${amountPerPerson} VND each`);

      // 4. Deduct amountPerPerson from ALL participants (including payer)
      // NOTE: Payer does NOT get auto-credited anymore.
      // Admin will manually transfer totalBill to payer via bank.
      for (const participant of participants) {
        await client.query(
          'UPDATE users SET balance = balance - $1 WHERE id = $2',
          [amountPerPerson, participant.user_id]
        );

        await client.query(`
          INSERT INTO transactions (user_id, type, amount, status, order_id, note, metadata)
          VALUES ($1, 'expense', $2, 'completed', $3, $4, $5)
        `, [
          participant.user_id,
          -amountPerPerson,
          sessionId,
          `Cơm ${session.session_date} - ${numPeople} người`,
          JSON.stringify({ amount_per_person: amountPerPerson })
        ]);
      }

      // 6. Update session to settled
      await client.query(`
        UPDATE lunch_sessions
        SET status = 'settled',
            payer_id = $1,
            total_bill = $2,
            amount_per_person = $3,
            bill_image_url = $4,
            paid_at = NOW()
        WHERE id = $5
      `, [payerId, totalBill, amountPerPerson, billImageUrl, sessionId]);

      // 7. Create reimbursement request: admin cần chuyển totalBill cho payer
      const reimbResult = await client.query(`
        INSERT INTO reimbursement_requests
          (type, reference_id, settler_id, total_amount, status)
        VALUES ('lunch', $1, $2, $3, 'pending')
        RETURNING id
      `, [sessionId, payerId, totalBill]);

      await client.query('COMMIT');

      console.log(`✅ Settlement v2 completed for session ${sessionId}, reimbursement #${reimbResult.rows[0].id} created`);

      // 8. Send notifications (after commit)
      try {
        await NotificationService.notifySettlementComplete(
          participants,
          session.session_date,
          amountPerPerson,
          totalBill,
          payerId
        );
      } catch (notifError) {
        console.error('⚠️  Notification error:', notifError.message);
      }

      return {
        success: true,
        session_id: sessionId,
        total_bill: totalBill,
        participants: numPeople,
        amount_per_person: amountPerPerson,
        payer_id: payerId,
        reimbursement_id: reimbResult.rows[0].id,
        message: `Đã trừ tiền ${numPeople} người. Admin sẽ chuyển khoản ${totalBill.toLocaleString('vi-VN')}đ cho bạn.`
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ SettlementService v2 error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get payer info for a session
   */
  async getPayerInfo(sessionId) {
    const result = await pool.query(`
      SELECT ls.payer_id, u.name, u.email, ls.total_bill, ls.amount_per_person, ls.paid_at
      FROM lunch_sessions ls
      LEFT JOIN users u ON ls.payer_id = u.id
      WHERE ls.id = $1
    `, [sessionId]);

    return result.rows[0] || null;
  }

  calculatePayerNetGain(totalBill, numPeople) {
    const amountPerPerson = Math.round(totalBill / numPeople);
    return totalBill - amountPerPerson;
  }
}

module.exports = new SettlementService();
