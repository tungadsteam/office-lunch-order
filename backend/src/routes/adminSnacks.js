const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const aiService = require('../services/aiService');
const pool = require('../config/database');

// Upload image & extract menu with fake AI
router.post("/upload", authenticate, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'imageUrl is required' });
    }

    const extracted = await aiService.extractMenuFromImage(imageUrl);
    res.json({ success: true, data: extracted });
  } catch (error) {
    console.error('Extract menu error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create menu with items
router.post('/menus', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { title, imageUrl, description, items } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'items are required' });
    }

    const menuResult = await client.query(
      `INSERT INTO snack_menus (title, image_url, description, created_by, status)
       VALUES ($1, $2, $3, $4, 'draft') RETURNING *`,
      [title || 'Menu đồ ăn vặt', imageUrl || null, description || null, req.user.id]
    );
    const menu = menuResult.rows[0];

    const insertedItems = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const r = await client.query(
        `INSERT INTO snack_items (menu_id, name, price, display_order)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [menu.id, item.name, item.price, item.display_order || i]
      );
      insertedItems.push(r.rows[0]);
    }

    await client.query('COMMIT');
    res.json({ success: true, data: { ...menu, items: insertedItems } });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create menu error:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// List all menus
router.get('/menus', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*,
        u.name as created_by_name,
        COUNT(DISTINCT si.id)::int as item_count,
        COUNT(DISTINCT so.user_id) FILTER (WHERE so.status = 'pending')::int as order_count
      FROM snack_menus m
      LEFT JOIN users u ON m.created_by = u.id
      LEFT JOIN snack_items si ON si.menu_id = m.id
      LEFT JOIN snack_orders so ON so.menu_id = m.id
      GROUP BY m.id, u.name
      ORDER BY m.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('List menus error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single menu with items
router.get('/menus/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const menuResult = await pool.query('SELECT * FROM snack_menus WHERE id = $1', [id]);
    if (!menuResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Menu not found' });
    }
    const itemsResult = await pool.query(
      'SELECT * FROM snack_items WHERE menu_id = $1 ORDER BY display_order, name', [id]
    );
    res.json({ success: true, data: { ...menuResult.rows[0], items: itemsResult.rows } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Activate menu
router.post('/menus/:id/activate', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE snack_menus SET status = 'active', activated_at = NOW() 
       WHERE id = $1 AND status = 'draft' RETURNING *`,
      [id]
    );
    if (!result.rows.length) {
      return res.status(400).json({ success: false, message: 'Menu not found or not in draft status' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Menu activated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get orders for menu (grouped by user)
router.get('/menus/:id/orders', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        u.id as user_id, u.name as user_name, u.balance,
        json_agg(json_build_object(
          'order_id', so.id,
          'item_id', si.id,
          'item_name', si.name,
          'quantity', so.quantity,
          'price', so.price,
          'subtotal', so.quantity * so.price
        ) ORDER BY si.name) as items,
        SUM(so.quantity * so.price) as total_cost
      FROM snack_orders so
      JOIN users u ON so.user_id = u.id
      JOIN snack_items si ON so.item_id = si.id
      WHERE so.menu_id = $1 AND so.status = 'pending'
      GROUP BY u.id, u.name, u.balance
      ORDER BY u.name
    `, [id]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Finalize orders — deduct balances
router.post('/menus/:id/finalize', authenticate, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;

    // Verify menu is active
    const menuCheck = await client.query(
      'SELECT * FROM snack_menus WHERE id = $1 AND status = $2', [id, 'active']
    );
    if (!menuCheck.rows.length) {
      return res.status(400).json({ success: false, message: 'Menu is not active' });
    }

    // Get pending orders grouped by user
    const orders = await client.query(`
      SELECT user_id, SUM(quantity * price) as total_cost
      FROM snack_orders WHERE menu_id = $1 AND status = 'pending'
      GROUP BY user_id
    `, [id]);

    let totalRevenue = 0;

    for (const order of orders.rows) {
      // Check balance
      const userResult = await client.query(
        'SELECT balance FROM users WHERE id = $1 FOR UPDATE', [order.user_id]
      );
      if (parseFloat(userResult.rows[0].balance) < parseFloat(order.total_cost)) {
        throw new Error(`User ${order.user_id} has insufficient balance (need ${order.total_cost}, have ${userResult.rows[0].balance})`);
      }

      // Deduct balance
      await client.query(
        'UPDATE users SET balance = balance - $1 WHERE id = $2',
        [order.total_cost, order.user_id]
      );

      // Create transaction record
      await client.query(
        `INSERT INTO transactions (user_id, amount, type, description)
         VALUES ($1, $2, 'expense', $3)`,
        [order.user_id, -Math.abs(order.total_cost), `Snack order - Menu #${id}`]
      );

      totalRevenue += parseFloat(order.total_cost);
    }

    // Update order statuses
    await client.query(
      `UPDATE snack_orders SET status = 'confirmed', confirmed_at = NOW()
       WHERE menu_id = $1 AND status = 'pending'`, [id]
    );

    // Close menu
    await client.query(
      `UPDATE snack_menus SET status = 'closed', closed_at = NOW(),
       total_orders = $1, total_revenue = $2 WHERE id = $3`,
      [orders.rows.length, totalRevenue, id]
    );

    await client.query('COMMIT');
    res.json({
      success: true,
      message: 'Orders finalized',
      data: { usersCharged: orders.rows.length, totalRevenue }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Finalize error:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// Cancel menu (no balance deduction)
router.post('/menus/:id/cancel', authenticate, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;

    const menuCheck = await client.query(
      'SELECT * FROM snack_menus WHERE id = $1 AND status IN ($2, $3)', [id, 'active', 'draft']
    );
    if (!menuCheck.rows.length) {
      return res.status(400).json({ success: false, message: 'Menu not found or already closed' });
    }

    // Cancel all pending orders
    await client.query(
      `UPDATE snack_orders SET status = 'cancelled', cancelled_at = NOW()
       WHERE menu_id = $1 AND status = 'pending'`, [id]
    );

    // Update menu status
    await client.query(
      `UPDATE snack_menus SET status = 'closed', closed_at = NOW() WHERE id = $1`, [id]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Menu cancelled, no charges applied' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
