const express = require('express');
const { body } = require('express-validator');
const TransactionController = require('../controllers/TransactionController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * POST /transactions/deposit
 * Create deposit request
 */
router.post('/deposit',
  authenticate,
  [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('note').optional().trim(),
    body('bank_reference').optional().trim()
  ],
  validate,
  asyncHandler(TransactionController.createDeposit.bind(TransactionController))
);

/**
 * GET /transactions/pending
 * Get pending deposits (Admin only)
 */
router.get('/pending',
  authenticate,
  requireAdmin,
  asyncHandler(TransactionController.getPendingDeposits.bind(TransactionController))
);

/**
 * PUT /transactions/:id/approve
 * Approve deposit (Admin only)
 */
router.put('/:id/approve',
  authenticate,
  requireAdmin,
  asyncHandler(TransactionController.approveDeposit.bind(TransactionController))
);

/**
 * PUT /transactions/:id/reject
 * Reject deposit (Admin only)
 */
router.put('/:id/reject',
  authenticate,
  requireAdmin,
  [
    body('reason').optional().trim()
  ],
  validate,
  asyncHandler(TransactionController.rejectDeposit.bind(TransactionController))
);

/**
 * GET /transactions/history
 * Get transaction history
 */
router.get('/history',
  authenticate,
  asyncHandler(TransactionController.getHistory.bind(TransactionController))
);

module.exports = router;
