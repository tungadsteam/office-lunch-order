const pool = require('../config/database');

/**
 * WebSnackController
 * Implements the web app's "restaurant menu" snack model:
 *   - Creator defines menu items (name + price)
 *   - Other users pick items and quantities
 *   - Creator (or admin) finalizes → deducts per-user cost + creates reimbursement for creator
 *
 * ANY authenticated user can create and finalize menus (not admin-only).
 */
class WebSnackController {

  // ─── MENU MANAGEMENT ────────────────────────────────────────

  /**
   * GET /snacks/menus
   * List all menus (newest first)
   */
  async getMenus(req, res) {
    try {
      const result = await pool.query(`
        SELECT
          sm.id, sm.title, sm.status, sm.total_amount, sm.created_at,
          u.id AS creator_id, u.name AS creator_name,
          COUNT(DISTINCT smi.id) AS item_count,
          COUNT(DISTINCT suo.user_id) AS order_count,
          COALESCE(SUM(smi_cost.cost), 0) AS total_revenue
        FROM snack_menus sm
        JOIN users u ON sm.created_by = u.id
        LEFT JOIN snack_menu_items smi ON smi.snack_menu_id = sm.id
        LEFT JOIN snack_user_orders suo ON suo.snack_menu_id = sm.id
        LEFT JOIN (
          SELECT suo2.snack_menu_id, SUM(smi2.price * suo2.quantity) AS cost
          FROM snack_user_orders suo2
          JOIN snack_menu_items smi2 ON smi2.id = suo2.item_id
          GROUP BY suo2.snack_menu_id
        ) smi_cost ON smi_cost.snack_menu_id = sm.id
        GROUP BY sm.id, u.id
        ORDER BY sm.created_at DESC
        LIMIT 100
      `);

      res.json({
        success: true,
        data: result.rows.map(r => ({
          ...r,
          total_amount: parseFloat(r.total_amount || 0),
          total_revenue: parseFloat(r.total_revenue || 0),
          item_count: parseInt(r.item_count || 0),
          order_count: parseInt(r.order_count || 0)
        }))
      });
    } catch (error) {
      console.error('getMenus error:', error);
      res.status(500).json({ success: false, message: 'Lấy danh sách thất bại' });
    }
  }

  /**
   * GET /snacks/menus/active
   * Get the active snack menu (status = ordering/active)
   */
  async getActiveMenu(req, res) {
    try {
      const userId = req.user.id;

      const menuResult = await pool.query(`
        SELECT sm.*, u.name AS creator_name
        FROM snack_menus sm
        JOIN users u ON sm.created_by = u.id
        WHERE sm.status = 'ordering'
        ORDER BY sm.created_at DESC
        LIMIT 1
      `);

      if (menuResult.rows.length === 0) {
        return res.json({ success: true, data: null });
      }

      const menu = menuResult.rows[0];

      // Get items
      const itemsResult = await pool.query(
        'SELECT id, name, price, description FROM snack_menu_items WHERE snack_menu_id = $1 ORDER BY id',
        [menu.id]
      );

      // Get user's own orders for this menu
      const myOrdersResult = await pool.query(`
        SELECT suo.id, suo.item_id, smi.name AS item_name, smi.price, suo.quantity
        FROM snack_user_orders suo
        JOIN snack_menu_items smi ON smi.id = suo.item_id
        WHERE suo.snack_menu_id = $1 AND suo.user_id = $2
      `, [menu.id, userId]);

      res.json({
        success: true,
        data: {
          menu: { ...menu, total_amount: parseFloat(menu.total_amount || 0) },
          items: itemsResult.rows.map(i => ({ ...i, price: parseFloat(i.price) })),
          myOrders: myOrdersResult.rows.map(o => ({ ...o, price: parseFloat(o.price) }))
        }
      });
    } catch (error) {
      console.error('getActiveMenu error:', error);
      res.status(500).json({ success: false, message: 'Lấy menu thất bại' });
    }
  }

  /**
   * POST /snacks/menus
   * Create a new snack menu — any authenticated user
   */
  async createMenu(req, res) {
    try {
      const { title, imageUrl, items } = req.body;
      const userId = req.user.id;

      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, message: 'Tên menu không được trống' });
      }
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Menu cần ít nhất 1 món' });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const menuResult = await client.query(`
          INSERT INTO snack_menus (title, created_by, status, notes)
          VALUES ($1, $2, 'ordering', $3)
          RETURNING *
        `, [title.trim(), userId, imageUrl || null]);

        const menu = menuResult.rows[0];

        // Insert items
        for (const item of items) {
          if (!item.name || !item.price || item.price <= 0) continue;
          await client.query(`
            INSERT INTO snack_menu_items (snack_menu_id, name, price, description)
            VALUES ($1, $2, $3, $4)
          `, [menu.id, item.name.trim(), item.price, item.description || null]);
        }

        await client.query('COMMIT');

        res.status(201).json({
          success: true,
          data: { id: menu.id, title: menu.title, status: menu.status },
          message: 'Tạo menu thành công!'
        });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('createMenu error:', error);
      res.status(500).json({ success: false, message: 'Tạo menu thất bại' });
    }
  }

  /**
   * GET /snacks/menus/:id
   * Get a specific menu with items
   */
  async getMenu(req, res) {
    try {
      const menuId = req.params.id;

      const menuResult = await pool.query(`
        SELECT sm.*, u.name AS creator_name
        FROM snack_menus sm
        JOIN users u ON sm.created_by = u.id
        WHERE sm.id = $1
      `, [menuId]);

      if (menuResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy menu' });
      }

      const menu = menuResult.rows[0];
      const itemsResult = await pool.query(
        'SELECT id, name, price, description FROM snack_menu_items WHERE snack_menu_id = $1 ORDER BY id',
        [menuId]
      );

      res.json({
        success: true,
        data: {
          ...menu,
          total_amount: parseFloat(menu.total_amount || 0),
          items: itemsResult.rows.map(i => ({ ...i, price: parseFloat(i.price) }))
        }
      });
    } catch (error) {
      console.error('getMenu error:', error);
      res.status(500).json({ success: false, message: 'Lấy menu thất bại' });
    }
  }

  /**
   * POST /snacks/menus/:id/activate
   * Activate a draft menu (creator or admin)
   * Note: in our model status starts as 'ordering' (active), so this is a no-op
   * but kept for web compatibility
   */
  async activateMenu(req, res) {
    try {
      const menuId = req.params.id;
      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';

      const menuResult = await pool.query('SELECT * FROM snack_menus WHERE id = $1', [menuId]);
      if (menuResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy menu' });
      }

      const menu = menuResult.rows[0];
      if (menu.created_by !== userId && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Không có quyền kích hoạt menu này' });
      }

      res.json({ success: true, message: 'Menu đã kích hoạt!' });
    } catch (error) {
      console.error('activateMenu error:', error);
      res.status(500).json({ success: false, message: 'Kích hoạt thất bại' });
    }
  }

  /**
   * GET /snacks/menus/:id/orders
   * Get all orders for a menu (creator or admin)
   */
  async getMenuOrders(req, res) {
    try {
      const menuId = req.params.id;

      const menuResult = await pool.query('SELECT * FROM snack_menus WHERE id = $1', [menuId]);
      if (menuResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy menu' });
      }

      // Get orders grouped by user — visible to all authenticated users
      const result = await pool.query(`
        SELECT
          u.id AS user_id,
          u.name AS user_name,
          u.balance,
          SUM(smi.price * suo.quantity) AS total_cost,
          JSON_AGG(JSON_BUILD_OBJECT(
            'item_id', smi.id,
            'item_name', smi.name,
            'quantity', suo.quantity,
            'price', smi.price,
            'subtotal', smi.price * suo.quantity
          ) ORDER BY smi.id) AS items
        FROM snack_user_orders suo
        JOIN users u ON suo.user_id = u.id
        JOIN snack_menu_items smi ON suo.item_id = smi.id
        WHERE suo.snack_menu_id = $1
        GROUP BY u.id
        ORDER BY u.name
      `, [menuId]);

      const isCreatorOrAdmin = req.user.id === menuResult.rows[0].created_by || req.user.role === 'admin';

      res.json({
        success: true,
        data: result.rows.map(r => ({
          user_id: r.user_id,
          user_name: r.user_name,
          total_cost: parseFloat(r.total_cost),
          items: r.items,
          // balance only shown to creator/admin (for insufficient funds warning)
          ...(isCreatorOrAdmin ? { balance: parseFloat(r.balance) } : {}),
        }))
      });
    } catch (error) {
      console.error('getMenuOrders error:', error);
      res.status(500).json({ success: false, message: 'Lấy đơn thất bại' });
    }
  }

  /**
   * POST /snacks/menus/:id/finalize
   * Chốt đơn & Trừ tiền — creator or admin
   * Deducts each user's cost from their balance, creates reimbursement for creator
   */
  async finalizeMenu(req, res) {
    const menuId = req.params.id;
    const actorId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const menuResult = await client.query(
        'SELECT * FROM snack_menus WHERE id = $1 FOR UPDATE',
        [menuId]
      );

      if (menuResult.rows.length === 0) throw new Error('Không tìm thấy menu');
      const menu = menuResult.rows[0];

      if (menu.status !== 'ordering') throw new Error('Menu đã được chốt hoặc hủy');
      if (menu.created_by !== actorId && !isAdmin) throw new Error('Chỉ người tạo hoặc admin mới có thể chốt đơn');

      // Get per-user totals
      const ordersResult = await client.query(`
        SELECT
          suo.user_id,
          u.name AS user_name,
          u.balance,
          SUM(smi.price * suo.quantity) AS user_total
        FROM snack_user_orders suo
        JOIN users u ON suo.user_id = u.id
        JOIN snack_menu_items smi ON suo.item_id = smi.id
        WHERE suo.snack_menu_id = $1
        GROUP BY suo.user_id, u.name, u.balance
      `, [menuId]);

      if (ordersResult.rows.length === 0) throw new Error('Chưa có ai đặt');

      // Check balances
      const insufficient = ordersResult.rows.filter(r => parseFloat(r.balance) < parseFloat(r.user_total));
      if (insufficient.length > 0) {
        const names = insufficient.map(r => r.user_name).join(', ');
        throw new Error(`Số dư không đủ: ${names}`);
      }

      let grandTotal = 0;
      for (const row of ordersResult.rows) {
        const amount = parseFloat(row.user_total);
        grandTotal += amount;

        await client.query(
          'UPDATE users SET balance = balance - $1 WHERE id = $2',
          [amount, row.user_id]
        );

        await client.query(`
          INSERT INTO transactions (user_id, type, amount, status, note, metadata)
          VALUES ($1, 'expense', $2, 'completed', $3, $4)
        `, [
          row.user_id,
          -amount,
          `Đồ ăn vặt: ${menu.title}`,
          JSON.stringify({ snack_menu_id: menuId, type: 'snack_expense' })
        ]);
      }

      // Update menu status
      await client.query(`
        UPDATE snack_menus
        SET status = 'settled', total_amount = $1, settled_at = NOW(), settled_by = $2
        WHERE id = $3
      `, [grandTotal, actorId, menuId]);

      // Create reimbursement request for the creator
      const creatorId = menu.created_by;
      await client.query(`
        INSERT INTO reimbursement_requests
          (type, reference_id, settler_id, total_amount, status)
        VALUES ('snack', $1, $2, $3, 'pending')
      `, [menuId, creatorId, grandTotal]);

      await client.query('COMMIT');

      res.json({
        success: true,
        data: { usersCharged: ordersResult.rows.length, totalRevenue: grandTotal },
        message: `Đã chốt! ${ordersResult.rows.length} người, tổng ${grandTotal.toLocaleString('vi-VN')}đ. Admin sẽ chuyển khoản cho bạn.`
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('finalizeMenu error:', error);
      res.status(400).json({ success: false, message: error.message || 'Chốt đơn thất bại' });
    } finally {
      client.release();
    }
  }

  /**
   * POST /snacks/menus/:id/cancel
   * Cancel a menu (creator or admin)
   */
  async cancelMenu(req, res) {
    try {
      const menuId = req.params.id;
      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';

      const menuResult = await pool.query('SELECT * FROM snack_menus WHERE id = $1', [menuId]);
      if (menuResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy menu' });
      }

      const menu = menuResult.rows[0];
      if (menu.created_by !== userId && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Không có quyền hủy menu này' });
      }
      if (menu.status !== 'ordering') {
        return res.status(400).json({ success: false, message: 'Chỉ hủy được menu đang mở' });
      }

      await pool.query("UPDATE snack_menus SET status = 'cancelled' WHERE id = $1", [menuId]);

      res.json({ success: true, message: 'Đã hủy menu' });
    } catch (error) {
      console.error('cancelMenu error:', error);
      res.status(500).json({ success: false, message: 'Hủy menu thất bại' });
    }
  }

  // ─── USER ORDERS ────────────────────────────────────────────

  /**
   * POST /snacks/orders
   * Place/update orders for a menu
   * body: { menuId, items: [{itemId, quantity}] }
   */
  async placeOrder(req, res) {
    const { menuId, items } = req.body;
    const userId = req.user.id;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const menuResult = await client.query('SELECT status FROM snack_menus WHERE id = $1', [menuId]);
      if (menuResult.rows.length === 0) throw new Error('Không tìm thấy menu');
      if (menuResult.rows[0].status !== 'ordering') throw new Error('Menu đã đóng');

      // Delete existing orders for this user in this menu
      await client.query(
        'DELETE FROM snack_user_orders WHERE snack_menu_id = $1 AND user_id = $2',
        [menuId, userId]
      );

      // Insert new orders
      for (const item of items) {
        if (!item.itemId || !item.quantity || item.quantity <= 0) continue;
        await client.query(`
          INSERT INTO snack_user_orders (snack_menu_id, user_id, item_id, quantity)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (snack_menu_id, user_id, item_id) DO UPDATE SET quantity = $4
        `, [menuId, userId, item.itemId, item.quantity]);
      }

      await client.query('COMMIT');
      res.status(201).json({ success: true, message: 'Đặt đồ ăn vặt thành công!' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('placeOrder error:', error);
      res.status(400).json({ success: false, message: error.message || 'Đặt hàng thất bại' });
    } finally {
      client.release();
    }
  }

  /**
   * GET /snacks/orders/my
   * Get current user's orders (all menus)
   */
  async getMyOrders(req, res) {
    try {
      const userId = req.user.id;
      const result = await pool.query(`
        SELECT suo.id, suo.snack_menu_id, sm.title AS menu_title,
               suo.item_id, smi.name AS item_name, smi.price, suo.quantity
        FROM snack_user_orders suo
        JOIN snack_menus sm ON suo.snack_menu_id = sm.id
        JOIN snack_menu_items smi ON suo.item_id = smi.id
        WHERE suo.user_id = $1
        ORDER BY suo.snack_menu_id, suo.item_id
      `, [userId]);

      res.json({
        success: true,
        data: result.rows.map(r => ({ ...r, price: parseFloat(r.price) }))
      });
    } catch (error) {
      console.error('getMyOrders error:', error);
      res.status(500).json({ success: false, message: 'Lấy đơn thất bại' });
    }
  }

  /**
   * PUT /snacks/orders/:id
   * Update quantity of a specific order line
   */
  async updateOrder(req, res) {
    try {
      const orderId = req.params.id;
      const userId = req.user.id;
      const { quantity } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({ success: false, message: 'Số lượng phải >= 1' });
      }

      const result = await pool.query(`
        UPDATE snack_user_orders SET quantity = $1
        WHERE id = $2 AND user_id = $3
        RETURNING id
      `, [quantity, orderId, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });
      }

      res.json({ success: true, message: 'Đã cập nhật' });
    } catch (error) {
      console.error('updateOrder error:', error);
      res.status(500).json({ success: false, message: 'Cập nhật thất bại' });
    }
  }

  /**
   * DELETE /snacks/orders/:id
   * Cancel a specific order line
   */
  async cancelOrder(req, res) {
    try {
      const orderId = req.params.id;
      const userId = req.user.id;

      const result = await pool.query(
        'DELETE FROM snack_user_orders WHERE id = $1 AND user_id = $2 RETURNING id',
        [orderId, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });
      }

      res.json({ success: true, message: 'Đã hủy' });
    } catch (error) {
      console.error('cancelOrder error:', error);
      res.status(500).json({ success: false, message: 'Hủy thất bại' });
    }
  }

  // ─── AI IMAGE EXTRACTION ─────────────────────────────────────

  /**
   * POST /snacks/upload
   * Extract menu items from image(s) via AI API.
   * Accepts: multipart/form-data with field "image" (1-5 files)
   *       OR JSON body { imageUrl: string } for URL-based input
   * Returns: { success: true, data: { items: [{name, price}] } }
   */
  async extractFromImage(req, res) {
    const AI_API_URL = 'https://reels.adsteam.xyz/ai/menu-from-image';

    // Build list of base64 image strings
    let images = [];

    if (req.files && req.files.length > 0) {
      // Multipart upload: convert each buffer to base64 data URL
      images = req.files.map(f => `data:${f.mimetype};base64,${f.buffer.toString('base64')}`);
    } else if (req.body?.imageUrl) {
      // Legacy URL-based input
      images = [req.body.imageUrl];
    } else {
      return res.status(400).json({ success: false, message: 'Không có ảnh nào được gửi lên' });
    }

    // Call AI API — send single string or array depending on count
    const payload = { images: images.length === 1 ? images[0] : images };

    const aiRes = await fetch(AI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('AI API error:', aiRes.status, errText);
      return res.status(502).json({ success: false, message: 'AI nhận diện thất bại, thử lại sau' });
    }

    const aiData = await aiRes.json();

    // Map API response {ten, gia} → internal format {name, price}
    const rawItems = Array.isArray(aiData.data) ? aiData.data : [];
    const items = rawItems
      .filter(i => i.ten && i.gia > 0)
      .map(i => ({ name: String(i.ten).trim(), price: Number(i.gia) }));

    res.json({
      success: true,
      data: {
        items,
        message: `AI nhận diện được ${items.length} món. Vui lòng kiểm tra lại tên và giá.`,
      },
    });
  }
}

module.exports = new WebSnackController();
