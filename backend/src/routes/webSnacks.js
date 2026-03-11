const express = require('express');
const multer = require('multer');
const { body } = require('express-validator');
const WebSnackController = require('../controllers/WebSnackController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

// Store files in memory as Buffer (no disk write needed — just base64 for AI API)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = express.Router();
router.use(authenticate);

// ─── MENU MANAGEMENT ─────────────────────────────────────────

/** GET /snacks/menus - List all menus */
router.get('/menus', asyncHandler(WebSnackController.getMenus.bind(WebSnackController)));

/** GET /snacks/menus/active - Get active menu */
router.get('/menus/active', asyncHandler(WebSnackController.getActiveMenu.bind(WebSnackController)));

/** POST /snacks/menus - Create menu (any user) */
router.post('/menus',
  [
    body('title').notEmpty().trim().withMessage('Tên menu không được trống'),
    body('items').isArray({ min: 0 }).withMessage('items phải là array'),
  ],
  validate,
  asyncHandler(WebSnackController.createMenu.bind(WebSnackController))
);

/** GET /snacks/menus/:id - Get specific menu */
router.get('/menus/:id', asyncHandler(WebSnackController.getMenu.bind(WebSnackController)));

/** POST /snacks/menus/:id/activate - Activate menu (creator or admin) */
router.post('/menus/:id/activate', asyncHandler(WebSnackController.activateMenu.bind(WebSnackController)));

/** GET /snacks/menus/:id/orders - View orders (creator or admin) */
router.get('/menus/:id/orders', asyncHandler(WebSnackController.getMenuOrders.bind(WebSnackController)));

/** POST /snacks/menus/:id/finalize - Chốt đơn (creator or admin) */
router.post('/menus/:id/finalize', asyncHandler(WebSnackController.finalizeMenu.bind(WebSnackController)));

/** POST /snacks/menus/:id/cancel - Cancel menu (creator or admin) */
router.post('/menus/:id/cancel', asyncHandler(WebSnackController.cancelMenu.bind(WebSnackController)));

// ─── USER ORDERS ─────────────────────────────────────────────

/** POST /snacks/orders - Place order */
router.post('/orders',
  [
    body('menuId').isInt().withMessage('menuId phải là số'),
    body('items').isArray({ min: 1 }).withMessage('Giỏ hàng trống'),
  ],
  validate,
  asyncHandler(WebSnackController.placeOrder.bind(WebSnackController))
);

/** GET /snacks/orders/my - My orders */
router.get('/orders/my', asyncHandler(WebSnackController.getMyOrders.bind(WebSnackController)));

/** PUT /snacks/orders/:id - Update order quantity */
router.put('/orders/:id',
  [body('quantity').isInt({ min: 1 }).withMessage('Số lượng phải >= 1')],
  validate,
  asyncHandler(WebSnackController.updateOrder.bind(WebSnackController))
);

/** DELETE /snacks/orders/:id - Cancel order line */
router.delete('/orders/:id', asyncHandler(WebSnackController.cancelOrder.bind(WebSnackController)));

// ─── AI EXTRACTION ───────────────────────────────────────────

/** POST /snacks/upload - AI extract menu items from image (multipart file or JSON imageUrl) */
router.post('/upload',
  upload.array('image', 5), // up to 5 images per request
  asyncHandler(WebSnackController.extractFromImage.bind(WebSnackController))
);

module.exports = router;
