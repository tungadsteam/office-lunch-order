const express = require('express');
const { body } = require('express-validator');
const ReimbursementController = require('../controllers/ReimbursementController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
router.use(authenticate);

/**
 * GET /reimbursements/pending  (Admin only)
 * Danh sách yêu cầu hoàn tiền đang chờ
 */
router.get('/pending',
  requireAdmin,
  asyncHandler(ReimbursementController.getPending.bind(ReimbursementController))
);

/**
 * GET /reimbursements/all  (Admin only)
 * Tất cả reimbursements
 */
router.get('/all',
  requireAdmin,
  asyncHandler(ReimbursementController.getAll.bind(ReimbursementController))
);

/**
 * GET /reimbursements/mine
 * User xem lịch sử hoàn tiền của mình
 */
router.get('/mine',
  asyncHandler(ReimbursementController.getMine.bind(ReimbursementController))
);

/**
 * GET /reimbursements/my  (web alias for /mine)
 */
router.get('/my',
  asyncHandler(ReimbursementController.getMine.bind(ReimbursementController))
);

/**
 * PUT /reimbursements/:id/transfer  (Admin only)
 * Admin bấm "Đã chuyển tiền"
 */
router.put('/:id/transfer',
  requireAdmin,
  [body('note').optional().trim()],
  validate,
  asyncHandler(ReimbursementController.markTransferred.bind(ReimbursementController))
);

/**
 * POST /reimbursements/:id/transfer  (web alias — same handler)
 */
router.post('/:id/transfer',
  requireAdmin,
  [body('notes').optional().trim()],
  validate,
  asyncHandler(ReimbursementController.markTransferred.bind(ReimbursementController))
);

/**
 * PUT /reimbursements/:id/confirm
 * User bấm "Đã nhận được" hoặc "Chưa nhận"
 */
router.put('/:id/confirm',
  [body('response').isIn(['received', 'not_received']).withMessage('response phải là received hoặc not_received')],
  validate,
  asyncHandler(ReimbursementController.confirmReceipt.bind(ReimbursementController))
);

/**
 * POST /reimbursements/:id/confirm  (web alias — same handler)
 * Web sends { received: true/false } instead of { response: 'received'/'not_received' }
 */
router.post('/:id/confirm',
  asyncHandler(async (req, res) => {
    // Normalize web's { received: bool } format to our format
    if (typeof req.body.received === 'boolean') {
      req.body.response = req.body.received ? 'received' : 'not_received';
    }
    return ReimbursementController.confirmReceipt(req, res);
  })
);

module.exports = router;
