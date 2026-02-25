const pool = require('../config/database');
const NotificationService = require('./NotificationService');

/**
 * TransactionService
 * Handles deposit requests, admin approval/rejection, and balance adjustments
 */
class TransactionService {
  /**
   * Create a deposit request
   * @param {number} userId - User ID
   * @param {number} amount - Deposit amount
   * @param {string} note - Optional note
   * @param {string} bankReference - Optional bank transaction reference
   * @returns {Promise<Object>} Created transaction
   */
  async createDepositRequest(userId, amount, note = null, bankReference = null) {
    const metadata = bankReference ? { bank_reference: bankReference } : {};
    
    const result = await pool.query(`
      INSERT INTO transactions (user_id, type, amount, status, note, metadata)
      VALUES ($1, 'deposit', $2, 'pending', $3, $4)
      RETURNING *
    `, [userId, amount, note, JSON.stringify(metadata)]);
    
    console.log(`✅ Deposit request created: ${amount} VND for user ${userId}`);
    
    return result.rows[0];
  }
  
  /**
   * Get pending deposit requests (admin only)
   * @returns {Promise<Array>} Pending transactions with user info
   */
  async getPendingDeposits() {
    const result = await pool.query(`
      SELECT t.*, u.name, u.email, u.phone
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.type = 'deposit' AND t.status = 'pending'
      ORDER BY t.created_at ASC
    `);
    
    return result.rows;
  }
  
  /**
   * Approve a deposit request
   * @param {number} transactionId - Transaction ID
   * @param {number} adminId - Admin user ID
   * @returns {Promise<Object>} Updated transaction
   */
  async approveDeposit(transactionId, adminId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Get transaction
      const txResult = await client.query(
        'SELECT * FROM transactions WHERE id = $1 FOR UPDATE',
        [transactionId]
      );
      
      if (txResult.rows.length === 0) {
        throw new Error('Transaction not found');
      }
      
      const transaction = txResult.rows[0];
      
      if (transaction.type !== 'deposit') {
        throw new Error('Not a deposit transaction');
      }
      
      if (transaction.status !== 'pending') {
        throw new Error(`Transaction already ${transaction.status}`);
      }
      
      // 2. Update transaction status
      await client.query(`
        UPDATE transactions 
        SET status = 'approved', admin_id = $1, approved_at = NOW()
        WHERE id = $2
      `, [adminId, transactionId]);
      
      // 3. Add balance to user
      await client.query(`
        UPDATE users 
        SET balance = balance + $1 
        WHERE id = $2
      `, [transaction.amount, transaction.user_id]);
      
      await client.query('COMMIT');
      
      console.log(`✅ Deposit approved: ${transaction.amount} VND for user ${transaction.user_id}`);
      
      // 4. Send notification
      const userResult = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [transaction.user_id]
      );
      const user = userResult.rows[0];
      
      if (user) {
        await NotificationService.notifyDepositApproved(user, transaction.amount);
      }
      
      return transaction;
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Approve deposit error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Reject a deposit request
   * @param {number} transactionId - Transaction ID
   * @param {number} adminId - Admin user ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} Updated transaction
   */
  async rejectDeposit(transactionId, adminId, reason = null) {
    const result = await pool.query(`
      UPDATE transactions 
      SET status = 'rejected', admin_id = $1, approved_at = NOW(), note = COALESCE(note || ' | Lý do từ chối: ' || $2, $2)
      WHERE id = $3 AND type = 'deposit' AND status = 'pending'
      RETURNING *
    `, [adminId, reason, transactionId]);
    
    if (result.rows.length === 0) {
      throw new Error('Transaction not found or already processed');
    }
    
    const transaction = result.rows[0];
    
    console.log(`❌ Deposit rejected: ${transaction.amount} VND for user ${transaction.user_id}`);
    
    // Send notification
    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [transaction.user_id]
    );
    const user = userResult.rows[0];
    
    if (user) {
      await NotificationService.notifyDepositRejected(user, transaction.amount, reason);
    }
    
    return transaction;
  }
  
  /**
   * Get transaction history for a user
   * @param {number} userId - User ID
   * @param {number} limit - Maximum number of transactions
   * @returns {Promise<Array>} Transaction history
   */
  async getUserTransactions(userId, limit = 50) {
    const result = await pool.query(`
      SELECT t.*, ls.session_date
      FROM transactions t
      LEFT JOIN lunch_sessions ls ON t.order_id = ls.id
      WHERE t.user_id = $1
      ORDER BY t.created_at DESC
      LIMIT $2
    `, [userId, limit]);
    
    return result.rows;
  }
  
  /**
   * Admin: Adjust user balance manually
   * @param {number} userId - User ID
   * @param {number} amount - Amount to adjust (positive or negative)
   * @param {number} adminId - Admin user ID
   * @param {string} note - Reason for adjustment
   * @returns {Promise<Object>} Created transaction
   */
  async adjustBalance(userId, amount, adminId, note) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create adjustment transaction
      const txResult = await client.query(`
        INSERT INTO transactions (user_id, type, amount, status, admin_id, note, approved_at)
        VALUES ($1, 'adjustment', $2, 'completed', $3, $4, NOW())
        RETURNING *
      `, [userId, amount, adminId, note]);
      
      // Update user balance
      await client.query(`
        UPDATE users 
        SET balance = balance + $1 
        WHERE id = $2
      `, [amount, userId]);
      
      await client.query('COMMIT');
      
      console.log(`✅ Balance adjusted: ${amount} VND for user ${userId}`);
      
      return txResult.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Adjust balance error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new TransactionService();
