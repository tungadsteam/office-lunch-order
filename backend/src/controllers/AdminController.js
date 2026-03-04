// backend/src/controllers/AdminController.js
const pool = require('../config/database');
const TransactionService = require('../services/TransactionService');
const { sendBroadcastNotification } = require('../services/NotificationService');

class AdminController {
  /** GET /admin/stats */
  async getStats(req, res) {
    try {
      const [usersResult, sessionsResult, balanceResult] = await Promise.all([
        pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active) as active FROM users'),
        pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'ordering') as active FROM lunch_sessions"),
        pool.query('SELECT COALESCE(SUM(balance), 0) as total_balance FROM users WHERE is_active = true'),
      ]);

      res.json({
        success: true,
        data: {
          users: {
            total: parseInt(usersResult.rows[0].total),
            active: parseInt(usersResult.rows[0].active),
          },
          sessions: {
            total: parseInt(sessionsResult.rows[0].total),
            active: parseInt(sessionsResult.rows[0].active),
          },
          total_balance: parseFloat(balanceResult.rows[0].total_balance),
        },
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ success: false, message: 'Failed to get stats' });
    }
  }

  /** GET /admin/bank-info */
  async getBankInfo(req, res) {
    try {
      const result = await pool.query(
        "SELECT key, value FROM admin_settings WHERE key IN ('bank_account_number', 'bank_account_name', 'bank_name')"
      );
      const bankInfo = {};
      result.rows.forEach((r) => { bankInfo[r.key] = r.value; });

      res.json({ success: true, data: bankInfo });
    } catch (error) {
      console.error('Get bank info error:', error);
      res.status(500).json({ success: false, message: 'Failed to get bank info' });
    }
  }

  /** PUT /admin/bank-info */
  async updateBankInfo(req, res) {
    try {
      const { bank_account_number, bank_account_name, bank_name } = req.body;
      const updates = { bank_account_number, bank_account_name, bank_name };

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          await pool.query(
            'UPDATE admin_settings SET value = $1, updated_at = NOW() WHERE key = $2',
            [value, key]
          );
        }
      }

      res.json({ success: true, message: 'Bank info updated' });
    } catch (error) {
      console.error('Update bank info error:', error);
      res.status(500).json({ success: false, message: 'Failed to update bank info' });
    }
  }

  /** GET /admin/settings */
  async getSettings(req, res) {
    try {
      const result = await pool.query('SELECT key, value, description FROM admin_settings ORDER BY key');
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ success: false, message: 'Failed to get settings' });
    }
  }

  /** PUT /admin/settings/:key */
  async updateSetting(req, res) {
    try {
      const { key } = req.params;
      const { value } = req.body;

      const result = await pool.query(
        'UPDATE admin_settings SET value = $1, updated_at = NOW() WHERE key = $2 RETURNING *',
        [value, key]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Setting not found' });
      }

      res.json({ success: true, data: result.rows[0], message: 'Setting updated' });
    } catch (error) {
      console.error('Update setting error:', error);
      res.status(500).json({ success: false, message: 'Failed to update setting' });
    }
  }

  /** GET /admin/users */
  async getUsers(req, res) {
    try {
      const result = await pool.query(
        `SELECT id, email, name, phone, role, balance, is_active,
                rotation_index, total_bought_times, last_bought_date, created_at
         FROM users ORDER BY name`
      );

      res.json({
        success: true,
        data: result.rows.map((u) => ({ ...u, balance: parseFloat(u.balance) })),
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ success: false, message: 'Failed to get users' });
    }
  }

  /** PUT /admin/users/:id/balance */
  async adjustBalance(req, res) {
    try {
      const userId = req.params.id;
      const adminId = req.user.id;
      const { amount, note } = req.body;

      const transaction = await TransactionService.adjustBalance(userId, parseFloat(amount), adminId, note);

      res.json({
        success: true,
        data: { ...transaction, amount: parseFloat(transaction.amount) },
        message: 'Balance adjusted successfully',
      });
    } catch (error) {
      console.error('Adjust balance error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to adjust balance' });
    }
  }

  /** POST /admin/broadcast */
  async broadcastMessage(req, res) {
    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body are required' });
    }
    try {
      await sendBroadcastNotification({ title, body });
      res.json({ success: true, message: 'Broadcast sent successfully' });
    } catch (error) {
      console.error('Broadcast error:', error);
      res.status(500).json({ success: false, message: 'Failed to send broadcast' });
    }
  }
}

module.exports = new AdminController();
