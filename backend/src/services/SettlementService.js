const pool = require('../config/database');
const NotificationService = require('./NotificationService');

/**
 * SettlementService
 * Implements Algorithm 2: Atomic invoice settlement
 * 
 * Goal:
 * - +money to payer (who paid cash)
 * - -money from all participants (including payer)
 * - Atomic transaction (all or nothing)
 * - Handle race conditions
 */
class SettlementService {
  /**
   * Settle invoice for a lunch session
   * @param {number} sessionId - Lunch session ID
   * @param {number} payerId - User who paid the bill
   * @param {number} totalBill - Total bill amount
   * @param {string} billImageUrl - Optional bill image URL
   * @returns {Promise<Object>} Settlement result
   */
  async settleInvoice(sessionId, payerId, totalBill, billImageUrl = null) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Get session with row-level lock (pessimistic locking to prevent race condition)
      const sessionResult = await client.query(
        'SELECT * FROM lunch_sessions WHERE id = $1 FOR UPDATE',
        [sessionId]
      );
      
      if (sessionResult.rows.length === 0) {
        throw new Error('Session not found');
      }
      
      const session = sessionResult.rows[0];
      
      // Validate session status
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
        SELECT lo.*, u.id as user_id, u.name, u.email, u.balance, u.fcm_token
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
      
      console.log(`💰 Settlement: ${totalBill} VND / ${numPeople} people = ${amountPerPerson} VND each`);
      
      // 4. Check if all participants have enough balance
      const insufficientBalanceUsers = participants.filter(p => p.balance < amountPerPerson);
      
      if (insufficientBalanceUsers.length > 0) {
        const names = insufficientBalanceUsers.map(u => u.name).join(', ');
        throw new Error(`Insufficient balance for users: ${names}`);
      }
      
      // 5. ATOMIC TRANSACTION START
      
      // 5.1. +money to payer (they paid cash, so we reimburse them)
      await client.query(`
        UPDATE users 
        SET balance = balance + $1 
        WHERE id = $2
      `, [totalBill, payerId]);
      
      await client.query(`
        INSERT INTO transactions (user_id, type, amount, status, order_id, note, metadata)
        VALUES ($1, 'income', $2, 'completed', $3, $4, $5)
      `, [
        payerId,
        totalBill, // Positive (reimbursement)
        sessionId,
        `Trả tiền cơm ${session.session_date} - ${numPeople} người`,
        JSON.stringify({ role: 'payer', bill_image_url: billImageUrl })
      ]);
      
      // 5.2. -money from ALL participants (including payer)
      for (const participant of participants) {
        // Deduct balance
        await client.query(`
          UPDATE users 
          SET balance = balance - $1 
          WHERE id = $2
        `, [amountPerPerson, participant.user_id]);
        
        // Record transaction
        await client.query(`
          INSERT INTO transactions (user_id, type, amount, status, order_id, note, metadata)
          VALUES ($1, 'expense', $2, 'completed', $3, $4, $5)
        `, [
          participant.user_id,
          -amountPerPerson, // Negative (expense)
          sessionId,
          `Cơm ${session.session_date} - ${numPeople} người`,
          JSON.stringify({ amount_per_person: amountPerPerson })
        ]);
      }
      
      // 5.3. Update session status to 'settled'
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
      
      // COMMIT TRANSACTION
      await client.query('COMMIT');
      
      console.log(`✅ Settlement completed for session ${sessionId}`);
      
      // 6. Send notifications (after commit)
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
        // Don't fail if notification fails
      }
      
      return {
        success: true,
        session_id: sessionId,
        total_bill: totalBill,
        participants: numPeople,
        amount_per_person: amountPerPerson,
        payer_id: payerId
      };
      
    } catch (error) {
      // ROLLBACK on any error
      await client.query('ROLLBACK');
      console.error('❌ SettlementService error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get payer info for a session
   * @param {number} sessionId - Lunch session ID
   * @returns {Promise<Object>} Payer info
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
  
  /**
   * Calculate net balance change for payer
   * (They pay totalBill cash, get +totalBill virtual, then -amountPerPerson virtual)
   * Net: +totalBill - amountPerPerson
   * 
   * @param {number} totalBill
   * @param {number} numPeople
   * @returns {number} Net gain for payer
   */
  calculatePayerNetGain(totalBill, numPeople) {
    const amountPerPerson = Math.round(totalBill / numPeople);
    return totalBill - amountPerPerson;
  }
}

module.exports = new SettlementService();
