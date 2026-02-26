const express = require('express');
const { body } = require('express-validator');
const OrderController = require('../controllers/OrderController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /orders/today
 * Get today's lunch session
 */
router.get('/today',
  authenticate,
  asyncHandler(OrderController.getToday.bind(OrderController))
);

/**
 * POST /orders/today/join
 * Join today's lunch order
 */
router.post('/today/join',
  authenticate,
  asyncHandler(OrderController.joinToday.bind(OrderController))
);

/**
 * DELETE /orders/today/leave
 * Leave today's lunch order
 */
router.delete('/today/leave',
  authenticate,
  asyncHandler(OrderController.leaveToday.bind(OrderController))
);

/**
 * POST /orders/today/select-buyers
 * Select 4 buyers (Admin only or Cron job)
 */
router.post('/today/select-buyers',
  authenticate,
  requireAdmin,
  asyncHandler(OrderController.selectBuyers.bind(OrderController))
);

/**
 * POST /orders/today/payment
 * Submit payment (Buyer only)
 */
router.post('/today/payment',
  authenticate,
  [
    body('total_bill').isNumeric().withMessage('Total bill must be a number'),
    body('bill_image_url').optional().trim()
  ],
  validate,
  asyncHandler(OrderController.submitPayment.bind(OrderController))
);

/**
 * GET /orders/history
 * Get order history
 */
router.get('/history',
  authenticate,
  asyncHandler(OrderController.getHistory.bind(OrderController))
);

/**
 * GET /orders/:id
 * Get order details by ID
 */
router.get('/:id',
  authenticate,
  asyncHandler(OrderController.getById.bind(OrderController))
);

/**
 * POST /orders/today/submit-payment
 * Buyer submits actual cost → deducts from participants → creates reimbursement
 */
router.post('/today/submit-payment',
  authenticate,
  async (req, res) => {
    const client = await require('../config/database').connect();
    try {
      await client.query('BEGIN');
      const { actualCost } = req.body;
      const userId = req.user.id;

      if (!actualCost || actualCost <= 0) {
        return res.status(400).json({ success: false, message: 'actualCost must be positive' });
      }

      // Get today's session
      const sessionResult = await client.query(`
        SELECT s.*, COUNT(o.id)::int as participant_count
        FROM lunch_sessions s
        LEFT JOIN lunch_orders o ON o.session_id = s.id AND o.status != 'cancelled'
        WHERE s.date = CURRENT_DATE AND s.status IN ('closed', 'ordering')
        GROUP BY s.id
      `);
      if (!sessionResult.rows.length) {
        return res.status(400).json({ success: false, message: 'No session found for today' });
      }

      const session = sessionResult.rows[0];
      if (session.participant_count === 0) {
        return res.status(400).json({ success: false, message: 'No participants' });
      }

      const costPerPerson = Math.round(actualCost / session.participant_count);

      // Deduct from each participant
      const participants = await client.query(
        `SELECT DISTINCT user_id FROM lunch_orders 
         WHERE session_id = $1 AND status != 'cancelled'`, [session.id]
      );

      for (const p of participants.rows) {
        await client.query(
          'UPDATE users SET balance = balance - $1 WHERE id = $2',
          [costPerPerson, p.user_id]
        );
        await client.query(
          `INSERT INTO transactions (user_id, amount, type, description)
           VALUES ($1, $2, 'expense', $3)`,
          [p.user_id, -costPerPerson, `Cơm trưa ${session.date}`]
        );
      }

      // Update session
      await client.query(
        `UPDATE lunch_sessions 
         SET actual_cost = $1, cost_per_person = $2, buyer_id = $3, 
             payment_submitted_at = NOW(), status = 'settled'
         WHERE id = $4`,
        [actualCost, costPerPerson, userId, session.id]
      );

      // Create reimbursement for buyer
      const reimb = await client.query(
        `INSERT INTO reimbursements (user_id, amount, type, related_id, status)
         VALUES ($1, $2, 'lunch_buyer', $3, 'pending') RETURNING *`,
        [userId, actualCost, session.id]
      );

      // Notify admins
      const admins = await client.query("SELECT id FROM users WHERE role = 'admin'");
      for (const admin of admins.rows) {
        await client.query(
          `INSERT INTO notifications (user_id, type, title, message, related_type, related_id)
           VALUES ($1, 'reimbursement_created', 'Yêu cầu hoàn tiền', $2, 'reimbursement', $3)`,
          [admin.id, `Người mua đã trả ${actualCost}đ cho cơm trưa. Cần chuyển tiền hoàn.`, reimb.rows[0].id]
        );
      }

      await client.query('COMMIT');
      res.json({
        success: true,
        message: 'Payment submitted',
        data: { costPerPerson, participants: participants.rows.length, reimbursementId: reimb.rows[0].id }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Submit payment error:', error);
      res.status(500).json({ success: false, message: error.message });
    } finally {
      client.release();
    }
  }
);

module.exports = router;
