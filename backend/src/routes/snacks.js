const express = require('express');
const { body } = require('express-validator');
const SnackController = require('../controllers/SnackController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// All snack routes require authentication (any user, not admin-only)
router.use(authenticate);

/**
 * GET /snacks
 * Danh sách menu đồ ăn vặt
 */
router.get('/', asyncHandler(SnackController.getMenus.bind(SnackController)));

/**
 * POST /snacks
 * Tạo menu mới (bất kỳ user nào)
 */
router.post('/',
  [body('title').notEmpty().trim().withMessage('Tên menu không được trống')],
  validate,
  asyncHandler(SnackController.createMenu.bind(SnackController))
);

/**
 * GET /snacks/:id
 * Chi tiết menu
 */
router.get('/:id', asyncHandler(SnackController.getMenu.bind(SnackController)));

/**
 * POST /snacks/:id/items
 * Thêm món vào menu
 */
router.post('/:id/items',
  [
    body('item_name').notEmpty().trim().withMessage('Tên món không được trống'),
    body('price').isNumeric().withMessage('Giá phải là số'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Số lượng phải >= 1')
  ],
  validate,
  asyncHandler(SnackController.addItem.bind(SnackController))
);

/**
 * DELETE /snacks/:id/items/:itemId
 * Xóa món (chỉ chủ sở hữu)
 */
router.delete('/:id/items/:itemId', asyncHandler(SnackController.removeItem.bind(SnackController)));

/**
 * POST /snacks/:id/settle
 * Chốt đơn & Trừ tiền (chỉ người tạo menu)
 */
router.post('/:id/settle', asyncHandler(SnackController.settle.bind(SnackController)));

module.exports = router;
