const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const pool = require('../config/database');

// Get active menu with items + user's orders
router.get('/menus/active', authenticate, async (req, res) => {
  try {
    const menuResult = await pool.query(
      `SELECT * FROM snack_menus WHERE status = 'active' ORDER BY activated_at DESC LIMIT 1`
    );

    if (!menuResult.rows.length) {
      return res.json({ success: true, data: null });
    }

    const menu = menuResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT * FROM snack_items WHERE menu_id = $1 AND is_available = true
       ORDER BY display_order, name`, [menu.id]
    );

    const myOrdersResult = await pool.query(
      `SELECT so.*, si.name as item_name
       FROM snack_orders so
       JOIN snack_items si ON so.item_id = si.id
       WHERE so.menu_id = $1 AND so.user_id = $2 AND so.status = 'pending'`,
      [menu.id, req.user.id]
    );

    // Order count
    const countResult = await pool.query(
      `SELECT COUNT(DISTINCT user_id)::int as user_count
       FROM snack_orders WHERE menu_id = $1 AND status = 'pending'`, [menu.id]
    );

    res.json({
      success: true,
      data: {
        menu,
        items: itemsResult.rows,
        myOrders: myOrdersResult.rows,
        orderCount: countResult.rows[0].user_count,
      }
    });
  } catch (error) {
    console.error('Get active menu error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Place order (multiple items)
router.post('/orders', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { menuId, items } = req.body;

    if (!menuId || !items?.length) {
      return res.status(400).json({ success: false, message: 'menuId and items required' });
    }

    // Check menu active
    const menuCheck = await client.query(
      'SELECT * FROM snack_menus WHERE id = $1 AND status = $2', [menuId, 'active']
    );
    if (!menuCheck.rows.length) {
      return res.status(400).json({ success: false, message: 'Menu is not active' });
    }

    // Check user balance
    const userResult = await client.query(
      'SELECT balance FROM users WHERE id = $1', [req.user.id]
    );

    let totalCost = 0;
    const createdOrders = [];

    for (const item of items) {
      if (!item.itemId || !item.quantity || item.quantity < 1) continue;

      const itemResult = await client.query(
        'SELECT * FROM snack_items WHERE id = $1 AND menu_id = $2 AND is_available = true',
        [item.itemId, menuId]
      );
      if (!itemResult.rows.length) {
        throw new Error(`Item ${item.itemId} not found or unavailable`);
      }

      const snackItem = itemResult.rows[0];
      const cost = parseFloat(snackItem.price) * item.quantity;
      totalCost += cost;

      // Upsert: if same user+item+menu pending exists, update quantity
      const existing = await client.query(
        `SELECT id FROM snack_orders 
         WHERE menu_id = $1 AND user_id = $2 AND item_id = $3 AND status = 'pending'`,
        [menuId, req.user.id, item.itemId]
      );

      let orderRow;
      if (existing.rows.length) {
        const r = await client.query(
          `UPDATE snack_orders SET quantity = $1, price = $2
           WHERE id = $3 RETURNING *`,
          [item.quantity, snackItem.price, existing.rows[0].id]
        );
        orderRow = r.rows[0];
      } else {
        const r = await client.query(
          `INSERT INTO snack_orders (menu_id, user_id, item_id, quantity, price, status)
           VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
          [menuId, req.user.id, item.itemId, item.quantity, snackItem.price]
        );
        orderRow = r.rows[0];
      }
      createdOrders.push(orderRow);
    }

    // Check balance sufficient
    if (parseFloat(userResult.rows[0].balance) < totalCost) {
      throw new Error(`Insufficient balance. Need ${totalCost}, have ${userResult.rows[0].balance}`);
    }

    await client.query('COMMIT');
    res.json({
      success: true,
      message: 'Order placed successfully',
      data: { orders: createdOrders, totalCost }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Place order error:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// Get my snack orders
router.get('/orders/my', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT so.*, si.name as item_name, sm.title as menu_title,
        sm.status as menu_status, sm.created_at as menu_date
      FROM snack_orders so
      JOIN snack_items si ON so.item_id = si.id
      JOIN snack_menus sm ON so.menu_id = sm.id
      WHERE so.user_id = $1
      ORDER BY so.created_at DESC
    `, [req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update order quantity
router.put('/orders/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Invalid quantity' });
    }

    const result = await pool.query(
      `UPDATE snack_orders SET quantity = $1
       WHERE id = $2 AND user_id = $3 AND status = 'pending' RETURNING *`,
      [quantity, id, req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Order not found or cannot be updated' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cancel order
router.delete('/orders/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE snack_orders SET status = 'cancelled', cancelled_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status = 'pending' RETURNING *`,
      [id, req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Order not found or cannot be cancelled' });
    }

    res.json({ success: true, message: 'Order cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
