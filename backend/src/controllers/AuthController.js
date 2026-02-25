const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

class AuthController {
  /**
   * POST /auth/register
   * Register a new user
   */
  async register(req, res) {
    try {
      const { email, password, name, phone } = req.body;
      
      // Check if email exists
      const existing = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      
      if (existing.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Create user
      const result = await pool.query(`
        INSERT INTO users (email, password_hash, name, phone)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, name, role, balance, created_at
      `, [email, passwordHash, name, phone]);
      
      const user = result.rows[0];
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'default-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      
      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            balance: parseFloat(user.balance)
          },
          token
        }
      });
      
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed'
      });
    }
  }
  
  /**
   * POST /auth/login
   * Login user
   */
  async login(req, res) {
    try {
      const { email, password, fcm_token } = req.body;
      
      // Get user
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      const user = result.rows[0];
      
      // Check if account is active
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Account is disabled'
        });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      // Update FCM token if provided
      if (fcm_token) {
        await pool.query(
          'UPDATE users SET fcm_token = $1 WHERE id = $2',
          [fcm_token, user.id]
        );
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'default-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            balance: parseFloat(user.balance)
          },
          token
        }
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  }
  
  /**
   * GET /auth/me
   * Get current user info
   */
  async getMe(req, res) {
    try {
      const result = await pool.query(`
        SELECT id, email, name, phone, role, balance, 
               rotation_index, total_bought_times, last_bought_date,
               notification_enabled, is_active, created_at
        FROM users 
        WHERE id = $1
      `, [req.user.id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      const user = result.rows[0];
      
      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          balance: parseFloat(user.balance),
          rotation_index: user.rotation_index,
          total_bought_times: user.total_bought_times,
          last_bought_date: user.last_bought_date,
          notification_enabled: user.notification_enabled,
          is_active: user.is_active,
          created_at: user.created_at
        }
      });
      
    } catch (error) {
      console.error('Get me error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user info'
      });
    }
  }
}

module.exports = new AuthController();
