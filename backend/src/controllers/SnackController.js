const pool = require('../config/database');

class SnackController {
  /**
   * GET /snacks
   * Get list of snack menus (recent 50)
   */
  async getMenus(req, res) {
    try {
      const result = await pool.query(`
        SELECT
          sm.id, sm.title, sm.status, sm.total_amount,
          sm.settled_at, sm.created_at,
          u.id AS creator_id, u.name AS creator_name,
          COUNT(DISTINCT si.user_id) AS participant_count,
          COALESCE(SUM(si.price * si.quantity), 0) AS current_total
        FROM snack_menus sm
        JOIN users u ON sm.created_by = u.id
        LEFT JOIN snack_items si ON si.snack_menu_id = sm.id
        GROUP BY sm.id, u.id
        ORDER BY sm.created_at DESC
        LIMIT 50
      `);

      res.json({
        success: true,
        data: result.rows.map(r => ({
          ...r,
          total_amount: parseFloat(r.total_amount || 0),
          current_total: parseFloat(r.current_total || 0),
          participant_count: parseInt(r.participant_count || 0)
        }))
      });
    } catch (error) {
      console.error('getMenus error:', error);
      res.status(500).json({ success: false, message: 'Lấy danh sách thất bại' });
    }
  }

  /**
   * POST /snacks
   * Create a new snack menu (any authenticated user)
   */
  async createMenu(req, res) {
    try {
      const { title, notes } = req.body;
      const userId = req.user.id;

      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, message: 'Tên menu không được trống' });
      }

      const result = await pool.query(`
        INSERT INTO snack_menus (title, created_by, notes)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [title.trim(), userId, notes || null]);

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Tạo menu thành công'
      });
    } catch (error) {
      console.error('createMenu error:', error);
      res.status(500).json({ success: false, message: 'Tạo menu thất bại' });
    }
  }

  /**
   * GET /snacks/:id
   * Get snack menu detail with all items grouped by user
   */
  async getMenu(req, res) {
    try {
      const menuId = req.params.id;
      const userId = req.user.id;

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

      // Get all items grouped by user
      const itemsResult = await pool.query(`
        SELECT
          si.id, si.user_id, si.item_name, si.price, si.quantity, si.created_at,
          u.name AS user_name,
          (si.price * si.quantity) AS subtotal
        FROM snack_items si
        JOIN users u ON si.user_id = u.id
        WHERE si.snack_menu_id = $1
        ORDER BY si.user_id, si.created_at
      `, [menuId]);

      // Group items by user
      const itemsByUser = {};
      let grandTotal = 0;
      for (const item of itemsResult.rows) {
        if (!itemsByUser[item.user_id]) {
          itemsByUser[item.user_id] = {
            user_id: item.user_id,
            user_name: item.user_name,
            items: [],
            user_total: 0
          };
        }
        const subtotal = parseFloat(item.subtotal);
        itemsByUser[item.user_id].items.push({
          id: item.id,
          item_name: item.item_name,
          price: parseFloat(item.price),
          quantity: item.quantity,
          subtotal
        });
        itemsByUser[item.user_id].user_total += subtotal;
        grandTotal += subtotal;
      }

      res.json({
        success: true,
        data: {
          menu: {
            ...menu,
            total_amount: parseFloat(menu.total_amount || 0)
          },
          participants: Object.values(itemsByUser),
          grand_total: grandTotal,
          is_creator: menu.created_by === userId,
          my_items: itemsResult.rows.filter(i => i.user_id === userId)
        }
      });
    } catch (error) {
      console.error('getMenu error:', error);
      res.status(500).json({ success: false, message: 'Lấy thông tin thất bại' });
    }
  }

  /**
   * POST /snacks/:id/items
   * Add an item to a snack menu
   */
  async addItem(req, res) {
    try {
      const menuId = req.params.id;
      const userId = req.user.id;
      const { item_name, price, quantity = 1 } = req.body;

      if (!item_name || !item_name.trim()) {
        return res.status(400).json({ success: false, message: 'Tên món không được trống' });
      }
      if (!price || price <= 0) {
        return res.status(400).json({ success: false, message: 'Giá phải lớn hơn 0' });
      }

      // Check menu exists and is still ordering
      const menuResult = await pool.query(
        'SELECT status FROM snack_menus WHERE id = $1',
        [menuId]
      );

      if (menuResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy menu' });
      }

      if (menuResult.rows[0].status !== 'ordering') {
        return res.status(400).json({ success: false, message: 'Menu đã được chốt, không thể thêm món' });
      }

      const result = await pool.query(`
        INSERT INTO snack_items (snack_menu_id, user_id, item_name, price, quantity)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [menuId, userId, item_name.trim(), price, quantity]);

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Thêm món thành công'
      });
    } catch (error) {
      console.error('addItem error:', error);
      res.status(500).json({ success: false, message: 'Thêm món thất bại' });
    }
  }

  /**
   * DELETE /snacks/:id/items/:itemId
   * Remove an item (only owner of the item)
   */
  async removeItem(req, res) {
    try {
      const { id: menuId, itemId } = req.params;
      const userId = req.user.id;

      // Check menu is still ordering
      const menuResult = await pool.query(
        'SELECT status FROM snack_menus WHERE id = $1',
        [menuId]
      );

      if (menuResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy menu' });
      }

      if (menuResult.rows[0].status !== 'ordering') {
        return res.status(400).json({ success: false, message: 'Menu đã được chốt' });
      }

      const result = await pool.query(`
        DELETE FROM snack_items
        WHERE id = $1 AND snack_menu_id = $2 AND user_id = $3
        RETURNING id
      `, [itemId, menuId, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy món hoặc không có quyền xóa' });
      }

      res.json({ success: true, message: 'Đã xóa món' });
    } catch (error) {
      console.error('removeItem error:', error);
      res.status(500).json({ success: false, message: 'Xóa món thất bại' });
    }
  }

  /**
   * POST /snacks/:id/settle
   * Chốt đơn & Trừ tiền - Only the creator can do this
   * Flow:
   *   1. Deduct each user's item total from their balance
   *   2. Create reimbursement_request for admin to transfer total to settler
   */
  async settle(req, res) {
    const menuId = req.params.id;
    const settlerId = req.user.id;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Lock menu row
      const menuResult = await client.query(
        'SELECT * FROM snack_menus WHERE id = $1 FOR UPDATE',
        [menuId]
      );

      if (menuResult.rows.length === 0) {
        throw new Error('Không tìm thấy menu');
      }

      const menu = menuResult.rows[0];

      if (menu.status !== 'ordering') {
        throw new Error('Menu đã được chốt hoặc hủy');
      }

      if (menu.created_by !== settlerId) {
        throw new Error('Chỉ người tạo menu mới có thể chốt đơn');
      }

      // Get all items
      const itemsResult = await client.query(`
        SELECT si.user_id, SUM(si.price * si.quantity) AS user_total
        FROM snack_items si
        WHERE si.snack_menu_id = $1
        GROUP BY si.user_id
      `, [menuId]);

      if (itemsResult.rows.length === 0) {
        throw new Error('Menu chưa có món nào');
      }

      let grandTotal = 0;
      for (const row of itemsResult.rows) {
        grandTotal += parseFloat(row.user_total);
      }

      // Check balances
      const userIds = itemsResult.rows.map(r => r.user_id);
      const usersResult = await client.query(
        'SELECT id, name, balance FROM users WHERE id = ANY($1)',
        [userIds]
      );

      const userMap = {};
      usersResult.rows.forEach(u => { userMap[u.id] = u; });

      const insufficient = itemsResult.rows.filter(r => {
        const u = userMap[r.user_id];
        return u && u.balance < parseFloat(r.user_total);
      });

      if (insufficient.length > 0) {
        const names = insufficient.map(r => userMap[r.user_id]?.name || r.user_id).join(', ');
        throw new Error(`Số dư không đủ: ${names}`);
      }

      // Deduct each user's total
      for (const row of itemsResult.rows) {
        const amount = parseFloat(row.user_total);
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
      `, [grandTotal, settlerId, menuId]);

      // Create reimbursement request for admin to transfer to settler
      const reimbResult = await client.query(`
        INSERT INTO reimbursement_requests
          (type, reference_id, settler_id, total_amount, status)
        VALUES ('snack', $1, $2, $3, 'pending')
        RETURNING id
      `, [menuId, settlerId, grandTotal]);

      await client.query('COMMIT');

      res.json({
        success: true,
        data: {
          menu_id: parseInt(menuId),
          grand_total: grandTotal,
          participants: itemsResult.rows.length,
          reimbursement_id: reimbResult.rows[0].id
        },
        message: `Đã chốt đơn! Tổng ${grandTotal.toLocaleString('vi-VN')}đ. Admin sẽ chuyển khoản cho bạn.`
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('settle snack error:', error);
      res.status(400).json({ success: false, message: error.message || 'Chốt đơn thất bại' });
    } finally {
      client.release();
    }
  }
}

module.exports = new SnackController();
