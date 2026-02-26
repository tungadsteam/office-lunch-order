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

// Any user can upload menu image for AI extraction
router.post('/upload', authenticate, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'imageUrl is required' });
    }
    const aiService = require('../services/aiService');
    const extracted = await aiService.extractMenuFromImage(imageUrl);
    res.json({ success: true, data: extracted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Any user can create a snack menu
router.post('/menus', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { title, imageUrl, items } = req.body;
    if (!items?.length) {
      return res.status(400).json({ success: false, message: 'items required' });
    }
    const menuResult = await client.query(
      `INSERT INTO snack_menus (title, image_url, created_by, status)
       VALUES ($1, $2, $3, 'draft') RETURNING *`,
      [title || 'Menu đồ ăn vặt', imageUrl || null, req.user.id]
    );
    const menu = menuResult.rows[0];
    const insertedItems = [];
    for (let i = 0; i < items.length; i++) {
      const r = await client.query(
        `INSERT INTO snack_items (menu_id, name, price, display_order)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [menu.id, items[i].name, items[i].price, i]
      );
      insertedItems.push(r.rows[0]);
    }
    await client.query('COMMIT');
    res.json({ success: true, data: { ...menu, items: insertedItems } });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// Any user can activate their own menu
router.post('/menus/:id/activate', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE snack_menus SET status = 'active', activated_at = NOW()
       WHERE id = $1 AND (created_by = $2 OR $3 = 'admin') AND status = 'draft' RETURNING *`,
      [id, req.user.id, req.user.role]
    );
    if (!result.rows.length) {
      return res.status(400).json({ success: false, message: 'Menu not found or cannot activate' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Menu activated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Creator or admin can finalize their menu
router.post('/menus/:id/finalize', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;

    const menuCheck = await client.query(
      `SELECT * FROM snack_menus WHERE id = $1 AND status = 'active'
       AND (created_by = $2 OR $3 = 'admin')`,
      [id, req.user.id, req.user.role]
    );
    if (!menuCheck.rows.length) {
      return res.status(400).json({ success: false, message: 'Menu not active or not authorized' });
    }

    // Get pending orders grouped by user
    const orders = await client.query(`
      SELECT user_id, SUM(quantity * price) as total_cost
      FROM snack_orders WHERE menu_id = $1 AND status = 'pending'
      GROUP BY user_id
    `, [id]);

    let totalRevenue = 0;
    for (const order of orders.rows) {
      const userResult = await client.query(
        'SELECT balance FROM users WHERE id = $1 FOR UPDATE', [order.user_id]
      );
      if (parseFloat(userResult.rows[0].balance) < parseFloat(order.total_cost)) {
        throw new Error(`User ${order.user_id} insufficient balance`);
      }
      await client.query(
        'UPDATE users SET balance = balance - $1 WHERE id = $2',
        [order.total_cost, order.user_id]
      );
      await client.query(
        `INSERT INTO transactions (user_id, amount, type, description)
         VALUES ($1, $2, 'expense', $3)`,
        [order.user_id, -Math.abs(order.total_cost), `Snack order - Menu #${id}`]
      );
      totalRevenue += parseFloat(order.total_cost);
    }

    await client.query(
      `UPDATE snack_orders SET status = 'confirmed', confirmed_at = NOW()
       WHERE menu_id = $1 AND status = 'pending'`, [id]
    );

    await client.query(
      `UPDATE snack_menus SET status = 'closed', closed_at = NOW(),
       total_orders = $1, total_revenue = $2, total_cost = $2,
       finalized_by = $3, finalized_at = NOW() WHERE id = $4`,
      [orders.rows.length, totalRevenue, req.user.id, id]
    );

    // Create reimbursement if creator is not admin
    const creatorId = menuCheck.rows[0].created_by;
    if (totalRevenue > 0 && creatorId) {
      const creator = await client.query('SELECT role FROM users WHERE id = $1', [creatorId]);
      if (creator.rows[0]?.role !== 'admin') {
        await client.query(
          `INSERT INTO reimbursements (user_id, amount, type, related_id, status)
           VALUES ($1, $2, 'snack_creator', $3, 'pending')`,
          [creatorId, totalRevenue, id]
        );
        // Notify admins
        const admins = await client.query("SELECT id FROM users WHERE role = 'admin'");
        for (const admin of admins.rows) {
          await client.query(
            `INSERT INTO notifications (user_id, type, title, message, related_type, related_id)
             VALUES ($1, 'reimbursement_created', 'Hoàn tiền snack', $2, 'snack_menu', $3)`,
            [admin.id, `Người tạo menu đã trả ${totalRevenue}đ. Cần chuyển hoàn.`, id]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.json({
      success: true,
      message: 'Orders finalized',
      data: { usersCharged: orders.rows.length, totalRevenue }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
