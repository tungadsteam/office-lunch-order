const pool = require('../config/database');
const TransactionService = require('../services/TransactionService');

class AdminController {
  /**
   * GET /admin/stats
   * Get system statistics (Admin only)
   */
  async getStats(req, res) {
    try {
      // Total users
      const usersResult = await pool.query(
        'SELECT COUNT(*) as total, SUM(balance) as total_balance FROM users WHERE is_active = true'
      );
      
      // Total sessions
      const sessionsResult = await pool.query(
        'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'settled\') as settled FROM lunch_sessions'
      );
      
      // Pending deposits
      const pendingResult = await pool.query(
        'SELECT COUNT(*) as count, SUM(amount) as total FROM transactions WHERE type = \'deposit\' AND status = \'pending\''
      );
      
      // Today's session
      const todayResult = await pool.query(`
        SELECT ls.*, 
          (SELECT COUNT(*) FROM lunch_orders WHERE session_id = ls.id AND status = 'confirmed') as participant_count
        FROM lunch_sessions ls 
        WHERE session_date = CURRENT_DATE
      `);
      
      const today = todayResult.rows[0] || null;
      
      res.json({
        success: true,
        data: {
          users: {
            total: parseInt(usersResult.rows[0].total),
            total_balance: parseFloat(usersResult.rows[0].total_balance || 0)
          },
          sessions: {
            total: parseInt(sessionsResult.rows[0].total),
            settled: parseInt(sessionsResult.rows[0].settled)
          },
          pending_deposits: {
            count: parseInt(pendingResult.rows[0].count || 0),
            total_amount: parseFloat(pendingResult.rows[0].total || 0)
          },
          today: today ? {
            id: today.id,
            status: today.status,
            participants: today.participant_count,
            total_bill: today.total_bill ? parseFloat(today.total_bill) : null
          } : null
        }
      });
      
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get statistics'
      });
    }
  }
  
  /**
   * GET /admin/bank-info
   * Get bank account information
   */
  async getBankInfo(req, res) {
    try {
      const result = await pool.query(`
        SELECT key, value FROM admin_settings 
        WHERE key IN ('bank_account_number', 'bank_account_name', 'bank_name')
      `);
      
      const bankInfo = {};
      result.rows.forEach(row => {
        bankInfo[row.key] = row.value;
      });
      
      res.json({
        success: true,
        data: bankInfo
      });
      
    } catch (error) {
      console.error('Get bank info error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get bank info'
      });
    }
  }
  
  /**
   * PUT /admin/bank-info
   * Update bank account information (Admin only)
   */
  async updateBankInfo(req, res) {
    try {
      const { bank_account_number, bank_account_name, bank_name } = req.body;
      
      const updates = [
        ['bank_account_number', bank_account_number],
        ['bank_account_name', bank_account_name],
        ['bank_name', bank_name]
      ].filter(([_, value]) => value !== undefined);
      
      for (const [key, value] of updates) {
        await pool.query(
          'UPDATE admin_settings SET value = $1, updated_at = NOW() WHERE key = $2',
          [value, key]
        );
      }
      
      res.json({
        success: true,
        message: 'Bank info updated'
      });
      
    } catch (error) {
      console.error('Update bank info error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update bank info'
      });
    }
  }
  
  /**
   * GET /admin/users
   * Get all users (Admin only)
   */
  async getUsers(req, res) {
    try {
      const result = await pool.query(`
        SELECT id, email, name, phone, role, balance, 
               rotation_index, total_bought_times, last_bought_date,
               is_active, created_at
        FROM users
        ORDER BY created_at DESC
      `);
      
      res.json({
        success: true,
        data: result.rows.map(user => ({
          ...user,
          balance: parseFloat(user.balance)
        }))
      });
      
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get users'
      });
    }
  }
  
  /**
   * PUT /admin/users/:id/balance
   * Adjust user balance manually (Admin only)
   */
  async adjustBalance(req, res) {
    try {
      const userId = req.params.id;
      const { amount, note } = req.body;
      const adminId = req.user.id;
      
      if (!amount || amount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount is required and must not be zero'
        });
      }
      
      if (!note) {
        return res.status(400).json({
          success: false,
          message: 'Note is required'
        });
      }
      
      await TransactionService.adjustBalance(userId, amount, adminId, note);
      
      res.json({
        success: true,
        message: 'Balance adjusted successfully'
      });
      
    } catch (error) {
      console.error('Adjust balance error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to adjust balance'
      });
    }
  }
}

module.exports = new AdminController();
