const pool = require('../config/database');
const BuyerSelectionService = require('../services/BuyerSelectionService');
const SettlementService = require('../services/SettlementService');
const moment = require('moment');

class OrderController {
  /**
   * GET /orders/today
   * Get today's lunch session with orders
   */
  async getToday(req, res) {
    try {
      const today = moment().format('YYYY-MM-DD');
      
      // Get or create today's session
      let session = await this._getOrCreateSession(today);
      
      // Get today's orders with user info
      const ordersResult = await pool.query(`
        SELECT lo.*, u.id as user_id, u.name, u.email
        FROM lunch_orders lo
        JOIN users u ON lo.user_id = u.id
        WHERE lo.session_id = $1 AND lo.status = 'confirmed'
        ORDER BY lo.created_at ASC
      `, [session.id]);
      
      // Get buyer info if selected
      let buyers = [];
      if (session.buyer_ids && session.buyer_ids.length > 0) {
        const buyersResult = await pool.query(`
          SELECT id, name, email FROM users WHERE id = ANY($1)
        `, [session.buyer_ids]);
        buyers = buyersResult.rows;
      }
      
      res.json({
        success: true,
        data: {
          session: {
            id: session.id,
            date: session.session_date,
            status: session.status,
            total_participants: ordersResult.rows.length,
            buyer_ids: session.buyer_ids,
            buyers: buyers,
            payer_id: session.payer_id,
            total_bill: session.total_bill ? parseFloat(session.total_bill) : null,
            amount_per_person: session.amount_per_person ? parseFloat(session.amount_per_person) : null
          },
          orders: ordersResult.rows,
          is_joined: ordersResult.rows.some(o => o.user_id === req.user?.id)
        }
      });
      
    } catch (error) {
      console.error('Get today error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get today\'s orders'
      });
    }
  }
  
  /**
   * POST /orders/today/join
   * Join today's lunch order
   */
  async joinToday(req, res) {
    try {
      const today = moment().format('YYYY-MM-DD');
      const userId = req.user.id;
      
      // Get or create session
      const session = await this._getOrCreateSession(today);
      
      // Check if already joined
      const existing = await pool.query(
        'SELECT id FROM lunch_orders WHERE session_id = $1 AND user_id = $2',
        [session.id, userId]
      );
      
      if (existing.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Already joined today'
        });
      }
      
      // Create order
      const result = await pool.query(`
        INSERT INTO lunch_orders (session_id, user_id, status)
        VALUES ($1, $2, 'confirmed')
        RETURNING *
      `, [session.id, userId]);
      
      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Successfully joined lunch order'
      });
      
    } catch (error) {
      console.error('Join today error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to join lunch order'
      });
    }
  }
  
  /**
   * DELETE /orders/today/leave
   * Leave today's lunch order
   */
  async leaveToday(req, res) {
    try {
      const today = moment().format('YYYY-MM-DD');
      const userId = req.user.id;
      
      const sessionResult = await pool.query(
        'SELECT id, status FROM lunch_sessions WHERE session_date = $1',
        [today]
      );
      
      if (sessionResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No session for today'
        });
      }
      
      const session = sessionResult.rows[0];
      
      // Check if buyers already selected
      if (session.status !== 'ordering') {
        return res.status(400).json({
          success: false,
          message: 'Cannot leave after buyers are selected'
        });
      }
      
      // Delete order
      const result = await pool.query(`
        DELETE FROM lunch_orders 
        WHERE session_id = $1 AND user_id = $2
        RETURNING *
      `, [session.id, userId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'You have not joined today'
        });
      }
      
      res.json({
        success: true,
        message: 'Successfully left lunch order'
      });
      
    } catch (error) {
      console.error('Leave today error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to leave lunch order'
      });
    }
  }
  
  /**
   * POST /orders/today/select-buyers
   * Select 4 buyers for today (System/Admin only)
   */
  async selectBuyers(req, res) {
    try {
      const today = moment().format('YYYY-MM-DD');
      
      const sessionResult = await pool.query(
        'SELECT id FROM lunch_sessions WHERE session_date = $1',
        [today]
      );
      
      if (sessionResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No session for today'
        });
      }
      
      const session = sessionResult.rows[0];
      
      // Run buyer selection algorithm
      const selectedBuyers = await BuyerSelectionService.selectFourBuyers(session.id);
      
      res.json({
        success: true,
        data: {
          buyers: selectedBuyers.map(b => ({
            id: b.user_id,
            name: b.name,
            email: b.email
          }))
        },
        message: `Selected ${selectedBuyers.length} buyers`
      });
      
    } catch (error) {
      console.error('Select buyers error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to select buyers'
      });
    }
  }
  
  /**
   * POST /orders/today/payment
   * Submit payment and settle invoice (Buyer only)
   */
  async submitPayment(req, res) {
    try {
      const { total_bill, bill_image_url } = req.body;
      const payerId = req.user.id;
      const today = moment().format('YYYY-MM-DD');
      
      const sessionResult = await pool.query(
        'SELECT * FROM lunch_sessions WHERE session_date = $1',
        [today]
      );
      
      if (sessionResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No session for today'
        });
      }
      
      const session = sessionResult.rows[0];
      
      // Run settlement algorithm
      const result = await SettlementService.settleInvoice(
        session.id,
        payerId,
        total_bill,
        bill_image_url
      );
      
      res.json({
        success: true,
        data: result,
        message: 'Payment submitted and settled successfully'
      });
      
    } catch (error) {
      console.error('Submit payment error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to submit payment'
      });
    }
  }
  
  /**
   * GET /orders/history
   * Get order history for current user
   */
  async getHistory(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 30;
      
      const result = await pool.query(`
        SELECT 
          ls.id as session_id,
          ls.session_date,
          ls.status,
          ls.total_participants,
          ls.payer_id,
          ls.total_bill,
          ls.amount_per_person,
          lo.created_at as joined_at,
          CASE WHEN ls.buyer_ids @> ARRAY[$1] THEN true ELSE false END as was_buyer,
          CASE WHEN ls.payer_id = $1 THEN true ELSE false END as was_payer
        FROM lunch_orders lo
        JOIN lunch_sessions ls ON lo.session_id = ls.id
        WHERE lo.user_id = $1 AND lo.status = 'confirmed'
        ORDER BY ls.session_date DESC
        LIMIT $2
      `, [userId, limit]);
      
      res.json({
        success: true,
        data: result.rows.map(row => ({
          ...row,
          total_bill: row.total_bill ? parseFloat(row.total_bill) : null,
          amount_per_person: row.amount_per_person ? parseFloat(row.amount_per_person) : null
        }))
      });
      
    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get order history'
      });
    }
  }
  
  /**
   * GET /orders/:id
   * Get detailed info of a specific order session
   */
  async getById(req, res) {
    try {
      const sessionId = req.params.id;
      
      const sessionResult = await pool.query(
        'SELECT * FROM lunch_sessions WHERE id = $1',
        [sessionId]
      );
      
      if (sessionResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }
      
      const session = sessionResult.rows[0];
      
      // Get orders
      const ordersResult = await pool.query(`
        SELECT lo.*, u.name, u.email
        FROM lunch_orders lo
        JOIN users u ON lo.user_id = u.id
        WHERE lo.session_id = $1 AND lo.status = 'confirmed'
      `, [sessionId]);
      
      // Get buyers
      let buyers = [];
      if (session.buyer_ids && session.buyer_ids.length > 0) {
        const buyersResult = await pool.query(
          'SELECT id, name, email FROM users WHERE id = ANY($1)',
          [session.buyer_ids]
        );
        buyers = buyersResult.rows;
      }
      
      // Get payer
      let payer = null;
      if (session.payer_id) {
        const payerResult = await pool.query(
          'SELECT id, name, email FROM users WHERE id = $1',
          [session.payer_id]
        );
        payer = payerResult.rows[0] || null;
      }
      
      res.json({
        success: true,
        data: {
          session: {
            ...session,
            total_bill: session.total_bill ? parseFloat(session.total_bill) : null,
            amount_per_person: session.amount_per_person ? parseFloat(session.amount_per_person) : null
          },
          orders: ordersResult.rows,
          buyers,
          payer
        }
      });
      
    } catch (error) {
      console.error('Get by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get session'
      });
    }
  }
  
  /**
   * Helper: Get or create today's session
   * @private
   */
  async _getOrCreateSession(date) {
    let result = await pool.query(
      'SELECT * FROM lunch_sessions WHERE session_date = $1',
      [date]
    );
    
    if (result.rows.length === 0) {
      result = await pool.query(
        'INSERT INTO lunch_sessions (session_date, status) VALUES ($1, \'ordering\') RETURNING *',
        [date]
      );
    }
    
    return result.rows[0];
  }
}

module.exports = new OrderController();
