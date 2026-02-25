const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/AuthController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * POST /auth/register
 * Register new user
 */
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phone').optional().trim()
  ],
  validate,
  asyncHandler(AuthController.register.bind(AuthController))
);

/**
 * POST /auth/login
 * Login user
 */
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    body('fcm_token').optional().trim()
  ],
  validate,
  asyncHandler(AuthController.login.bind(AuthController))
);

/**
 * GET /auth/me
 * Get current user info
 */
router.get('/me',
  authenticate,
  asyncHandler(AuthController.getMe.bind(AuthController))
);

module.exports = router;
