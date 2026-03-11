const express = require('express');
const { body } = require('express-validator');
const AdminController = require('../controllers/AdminController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// All routes require authentication + admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /admin/stats
 * Get system statistics
 */
router.get('/stats',
  asyncHandler(AdminController.getStats.bind(AdminController))
);

/**
 * GET /admin/bank-info
 * Get bank account info
 */
router.get('/bank-info',
  asyncHandler(AdminController.getBankInfo.bind(AdminController))
);

/**
 * PUT /admin/bank-info
 * Update bank account info
 */
router.put('/bank-info',
  [
    body('bank_account_number').optional().trim(),
    body('bank_account_name').optional().trim(),
    body('bank_name').optional().trim()
  ],
  validate,
  asyncHandler(AdminController.updateBankInfo.bind(AdminController))
);

/**
 * GET /admin/settings
 * Get all admin settings
 */
router.get('/settings',
  asyncHandler(AdminController.getSettings.bind(AdminController))
);

/**
 * PUT /admin/settings/:key
 * Update a single setting by key
 */
router.put('/settings/:key',
  [body('value').notEmpty().withMessage('Value is required')],
  validate,
  asyncHandler(AdminController.updateSetting.bind(AdminController))
);

/**
 * GET /admin/users
 * Get all users
 */
router.get('/users',
  asyncHandler(AdminController.getUsers.bind(AdminController))
);

/**
 * PUT /admin/users/:id/balance
 * Adjust user balance
 */
router.put('/users/:id/balance',
  [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('note').notEmpty().withMessage('Note is required')
  ],
  validate,
  asyncHandler(AdminController.adjustBalance.bind(AdminController))
);

module.exports = router;
