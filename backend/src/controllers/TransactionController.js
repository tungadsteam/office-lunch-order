const TransactionService = require('../services/TransactionService');

class TransactionController {
  /**
   * POST /transactions/deposit
   * Create deposit request
   */
  async createDeposit(req, res) {
    try {
      const { amount, note, bank_reference } = req.body;
      const userId = req.user.id;
      
      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be greater than 0'
        });
      }
      
      const transaction = await TransactionService.createDepositRequest(
        userId,
        amount,
        note,
        bank_reference
      );
      
      res.status(201).json({
        success: true,
        data: {
          id: transaction.id,
          user_id: transaction.user_id,
          type: transaction.type,
          amount: parseFloat(transaction.amount),
          status: transaction.status,
          note: transaction.note,
          created_at: transaction.created_at
        },
        message: 'Deposit request created. Waiting for admin approval.'
      });
      
    } catch (error) {
      console.error('Create deposit error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create deposit request'
      });
    }
  }
  
  /**
   * GET /transactions/pending
   * Get pending deposit requests (Admin only)
   */
  async getPendingDeposits(req, res) {
    try {
      const transactions = await TransactionService.getPendingDeposits();
      
      res.json({
        success: true,
        data: transactions.map(t => ({
          ...t,
          amount: parseFloat(t.amount)
        }))
      });
      
    } catch (error) {
      console.error('Get pending deposits error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get pending deposits'
      });
    }
  }
  
  /**
   * PUT /transactions/:id/approve
   * Approve deposit request (Admin only)
   */
  async approveDeposit(req, res) {
    try {
      const transactionId = req.params.id;
      const adminId = req.user.id;
      
      await TransactionService.approveDeposit(transactionId, adminId);
      
      res.json({
        success: true,
        message: 'Deposit approved successfully'
      });
      
    } catch (error) {
      console.error('Approve deposit error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to approve deposit'
      });
    }
  }
  
  /**
   * PUT /transactions/:id/reject
   * Reject deposit request (Admin only)
   */
  async rejectDeposit(req, res) {
    try {
      const transactionId = req.params.id;
      const adminId = req.user.id;
      const { reason } = req.body;
      
      await TransactionService.rejectDeposit(transactionId, adminId, reason);
      
      res.json({
        success: true,
        message: 'Deposit rejected'
      });
      
    } catch (error) {
      console.error('Reject deposit error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to reject deposit'
      });
    }
  }
  
  /**
   * GET /transactions/history
   * Get transaction history for current user
   */
  async getHistory(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 50;
      
      const transactions = await TransactionService.getUserTransactions(userId, limit);
      
      res.json({
        success: true,
        data: transactions.map(t => ({
          ...t,
          amount: parseFloat(t.amount)
        }))
      });
      
    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get transaction history'
      });
    }
  }
}

module.exports = new TransactionController();
