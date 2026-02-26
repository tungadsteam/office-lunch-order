const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const pool = require('../config/database');

// GET /my - User's reimbursements
router.get('/my', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, u.name as admin_name
      FROM reimbursements r
      LEFT JOIN users u ON r.admin_transferred_by = u.id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
    `, [req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /all - Admin: all reimbursements
router.get('/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT r.*, u.name as user_name, u.email as user_email
      FROM reimbursements r
      JOIN users u ON r.user_id = u.id
    `;
    const params = [];
    if (status) {
      query += ' WHERE r.status = $1';
      params.push(status);
    }
    query += ' ORDER BY r.created_at DESC';
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /:id/transfer - Admin marks as transferred
router.post('/:id/transfer', authenticate, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { notes } = req.body;

    const result = await client.query(
      `UPDATE reimbursements
       SET status = 'transferred', admin_transferred_at = NOW(),
           admin_transferred_by = $1, admin_note = $2
       WHERE id = $3 AND status = 'pending'
       RETURNING *`,
      [req.user.id, notes || null, id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Not found or not pending' });
    }

    // Notify user
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, related_type, related_id)
       VALUES ($1, 'reimbursement_transferred', 'Đã chuyển tiền hoàn',
               $2, 'reimbursement', $3)`,
      [result.rows[0].user_id, `Admin đã chuyển ${result.rows[0].amount}đ. Vui lòng xác nhận.`, id]
    );

    await client.query('COMMIT');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// POST /:id/confirm - User confirms receipt
router.post('/:id/confirm', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { received, note } = req.body;

    const newStatus = received ? 'confirmed' : 'disputed';
    const confirmation = received ? 'received' : 'not_received';

    const result = await client.query(
      `UPDATE reimbursements
       SET status = $1, user_confirmed_at = NOW(), user_confirmation = $2, user_note = $3
       WHERE id = $4 AND user_id = $5 AND status = 'transferred'
       RETURNING *`,
      [newStatus, confirmation, note || null, id, req.user.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Not found or not in transferred status' });
    }

    // If disputed, notify admin
    if (!received) {
      const admins = await client.query("SELECT id FROM users WHERE role = 'admin'");
      for (const admin of admins.rows) {
        await client.query(
          `INSERT INTO notifications (user_id, type, title, message, related_type, related_id)
           VALUES ($1, 'reimbursement_disputed', '⚠️ Tranh chấp hoàn tiền',
                   $2, 'reimbursement', $3)`,
          [admin.id, `User chưa nhận được ${result.rows[0].amount}đ`, id]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
