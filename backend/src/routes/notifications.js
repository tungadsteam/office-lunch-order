const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// POST /api/notifications/subscribe — save push subscription for authenticated user
router.post('/subscribe', authenticate, asyncHandler(notificationController.subscribe));

module.exports = router;
