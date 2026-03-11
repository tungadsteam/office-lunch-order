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
 * POST /orders/today/claim-payment
 * One of the 4 buyers claims they will pay the bill today
 */
router.post('/today/claim-payment',
  authenticate,
  asyncHandler(OrderController.claimPayment.bind(OrderController))
);

/**
 * POST /orders/today/payment
 * Submit actual bill amount (only the buyer who claimed)
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
 * GET /orders/sessions
 * List all recent sessions (Admin only)
 */
router.get('/sessions',
  authenticate,
  requireAdmin,
  asyncHandler(OrderController.getSessions.bind(OrderController))
);

/**
 * POST /orders/sessions/:id/select-buyers
 * Select buyers for any session by ID (Admin only)
 */
router.post('/sessions/:id/select-buyers',
  authenticate,
  requireAdmin,
  asyncHandler(OrderController.selectBuyersById.bind(OrderController))
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

module.exports = router;
