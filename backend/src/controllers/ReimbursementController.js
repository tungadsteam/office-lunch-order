const pool = require('../config/database');

// Normalize DB row to unified format compatible with both web and mobile clients
function normalizeRow(r) {
  const statusMap = {
    pending: 'pending',
    admin_transferred: 'transferred',   // web uses 'transferred'
    user_confirmed: 'confirmed',         // web uses 'confirmed'
    user_disputed: 'disputed'            // web uses 'disputed'
  };
  const typeMap = {
    lunch: 'lunch_buyer',   // web uses 'lunch_buyer'
    snack: 'snack_creator'  // web uses 'snack_creator'
  };
  return {
    ...r,
    amount: parseFloat(r.total_amount),          // web reads 'amount'
    total_amount: parseFloat(r.total_amount),    // mobile reads 'total_amount'
    status: statusMap[r.status] || r.status,
    type: typeMap[r.type] || r.type,
    user_name: r.settler_name,    // web reads 'user_name'
    user_email: r.settler_email,  // web reads 'user_email'
    admin_note: r.admin_note || r.notes || null,
  };
}

class ReimbursementController {
  /**
   * GET /reimbursements/pending
   * Admin xem danh sách các yêu cầu hoàn tiền đang chờ
   */
  async getPending(req, res) {
    try {
      const result = await pool.query(`
        SELECT
          rr.id, rr.type, rr.reference_id, rr.total_amount,
          rr.status, rr.created_at, rr.admin_note,
          u.id AS settler_id, u.name AS settler_name, u.email AS settler_email,
          -- Context info
          CASE
            WHEN rr.type = 'lunch' THEN (
              SELECT ls.session_date::text FROM lunch_sessions ls WHERE ls.id = rr.reference_id
            )
            WHEN rr.type = 'snack' THEN (
              SELECT sm.title FROM snack_menus sm WHERE sm.id = rr.reference_id
            )
          END AS context_label
        FROM reimbursement_requests rr
        JOIN users u ON rr.settler_id = u.id
        WHERE rr.status = 'pending'
        ORDER BY rr.created_at ASC
      `);

      res.json({
        success: true,
        data: result.rows.map(r => ({
          ...r,
          total_amount: parseFloat(r.total_amount)
        }))
      });
    } catch (error) {
      console.error('getPending reimbursements error:', error);
      res.status(500).json({ success: false, message: 'Lấy danh sách thất bại' });
    }
  }

  /**
   * GET /reimbursements/all  (admin only)
   * Admin xem tất cả reimbursements
   */
  async getAll(req, res) {
    try {
      const result = await pool.query(`
        SELECT
          rr.*,
          u.name AS settler_name, u.email AS settler_email,
          a.name AS admin_name,
          CASE
            WHEN rr.type = 'lunch' THEN (
              SELECT ls.session_date::text FROM lunch_sessions ls WHERE ls.id = rr.reference_id
            )
            WHEN rr.type = 'snack' THEN (
              SELECT sm.title FROM snack_menus sm WHERE sm.id = rr.reference_id
            )
          END AS context_label
        FROM reimbursement_requests rr
        JOIN users u ON rr.settler_id = u.id
        LEFT JOIN users a ON rr.admin_id = a.id
        ORDER BY rr.created_at DESC
        LIMIT 100
      `);

      res.json({
        success: true,
        data: result.rows.map(normalizeRow)
      });
    } catch (error) {
      console.error('getAll reimbursements error:', error);
      res.status(500).json({ success: false, message: 'Lấy danh sách thất bại' });
    }
  }

  /**
   * PUT /reimbursements/:id/transfer
   * Admin bấm "Đã chuyển tiền"
   */
  async markTransferred(req, res) {
    try {
      const reimbId = req.params.id;
      const adminId = req.user.id;
      const { note } = req.body;

      const result = await pool.query(`
        UPDATE reimbursement_requests
        SET
          status = 'admin_transferred',
          admin_id = $1,
          admin_note = $2,
          admin_transferred_at = NOW()
        WHERE id = $3 AND status = 'pending'
        RETURNING *
      `, [adminId, note || null, reimbId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy hoặc đã xử lý rồi' });
      }

      res.json({ success: true, message: 'Đã đánh dấu chuyển tiền. User sẽ được thông báo xác nhận.' });
    } catch (error) {
      console.error('markTransferred error:', error);
      res.status(500).json({ success: false, message: 'Cập nhật thất bại' });
    }
  }

  /**
   * GET /reimbursements/mine
   * User xem danh sách hoàn tiền của mình
   */
  async getMine(req, res) {
    try {
      const userId = req.user.id;

      const result = await pool.query(`
        SELECT
          rr.*,
          a.name AS admin_name,
          CASE
            WHEN rr.type = 'lunch' THEN (
              SELECT ls.session_date::text FROM lunch_sessions ls WHERE ls.id = rr.reference_id
            )
            WHEN rr.type = 'snack' THEN (
              SELECT sm.title FROM snack_menus sm WHERE sm.id = rr.reference_id
            )
          END AS context_label
        FROM reimbursement_requests rr
        LEFT JOIN users a ON rr.admin_id = a.id
        WHERE rr.settler_id = $1
        ORDER BY rr.created_at DESC
        LIMIT 50
      `, [userId]);

      res.json({
        success: true,
        data: result.rows.map(normalizeRow)
      });
    } catch (error) {
      console.error('getMine error:', error);
      res.status(500).json({ success: false, message: 'Lấy danh sách thất bại' });
    }
  }

  /**
   * PUT /reimbursements/:id/confirm
   * User bấm "Đã nhận được" hoặc "Chưa nhận"
   * body: { response: 'received' | 'not_received' }
   */
  async confirmReceipt(req, res) {
    try {
      const reimbId = req.params.id;
      const userId = req.user.id;
      const { response } = req.body;

      if (!['received', 'not_received'].includes(response)) {
        return res.status(400).json({ success: false, message: 'response phải là received hoặc not_received' });
      }

      const newStatus = response === 'received' ? 'user_confirmed' : 'user_disputed';

      const result = await pool.query(`
        UPDATE reimbursement_requests
        SET
          status = $1,
          user_response = $2,
          user_confirmed_at = NOW()
        WHERE id = $3 AND settler_id = $4 AND status = 'admin_transferred'
        RETURNING *
      `, [newStatus, response, reimbId, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy hoặc chưa đến bước xác nhận' });
      }

      const msg = response === 'received'
        ? '✅ Cảm ơn bạn đã xác nhận!'
        : '⚠️ Đã báo admin chưa nhận được tiền. Admin sẽ kiểm tra lại.';

      res.json({ success: true, message: msg });
    } catch (error) {
      console.error('confirmReceipt error:', error);
      res.status(500).json({ success: false, message: 'Xác nhận thất bại' });
    }
  }
}

module.exports = new ReimbursementController();
