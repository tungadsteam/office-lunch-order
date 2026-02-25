const pool = require('../config/database');
const NotificationService = require('./NotificationService');

/**
 * BuyerSelectionService
 * Implements Algorithm 1: Fair rotation buyer selection
 * 
 * Goal:
 * - Select 4 buyers per day
 * - Fair rotation (everyone selected equally)
 * - No duplicate with yesterday's buyers
 */
class BuyerSelectionService {
  /**
   * Select 4 buyers for today's session
   * @param {number} sessionId - Lunch session ID
   * @returns {Promise<Array>} Selected buyers
   */
  async selectFourBuyers(sessionId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Get session info
      const sessionResult = await client.query(
        'SELECT * FROM lunch_sessions WHERE id = $1',
        [sessionId]
      );
      
      if (sessionResult.rows.length === 0) {
        throw new Error('Session not found');
      }
      
      const session = sessionResult.rows[0];
      
      if (session.status !== 'ordering') {
        throw new Error(`Cannot select buyers for session with status: ${session.status}`);
      }
      
      // 2. Get today's orders (confirmed only)
      const ordersResult = await client.query(`
        SELECT lo.*, u.id as user_id, u.name, u.email, u.rotation_index, 
               u.last_bought_date, u.total_bought_times, u.fcm_token
        FROM lunch_orders lo
        JOIN users u ON lo.user_id = u.id
        WHERE lo.session_id = $1 AND lo.status = 'confirmed' AND u.is_active = true
        ORDER BY u.rotation_index ASC, u.last_bought_date ASC NULLS FIRST
      `, [sessionId]);
      
      const participants = ordersResult.rows;
      
      if (participants.length === 0) {
        throw new Error('No confirmed orders for today');
      }
      
      // 3. Get yesterday's buyers
      const yesterdayResult = await client.query(`
        SELECT buyer_ids FROM lunch_sessions 
        WHERE session_date = $1 - INTERVAL '1 day'
        LIMIT 1
      `, [session.session_date]);
      
      const yesterdayBuyerIds = yesterdayResult.rows[0]?.buyer_ids || [];
      
      // 4. Filter candidates: exclude yesterday's buyers (if possible)
      let candidates = participants.filter(p => !yesterdayBuyerIds.includes(p.user_id));
      
      // 5. Edge case: Not enough candidates after filtering
      if (candidates.length < 4) {
        console.log(`⚠️  Only ${candidates.length} new candidates. Adding yesterday's buyers...`);
        
        // Add back yesterday's buyers (sorted by rotation_index)
        const extras = participants
          .filter(p => yesterdayBuyerIds.includes(p.user_id))
          .sort((a, b) => {
            if (a.rotation_index !== b.rotation_index) {
              return a.rotation_index - b.rotation_index;
            }
            if (!a.last_bought_date) return -1;
            if (!b.last_bought_date) return 1;
            return new Date(a.last_bought_date) - new Date(b.last_bought_date);
          })
          .slice(0, 4 - candidates.length);
        
        candidates = [...candidates, ...extras];
      }
      
      // Edge case: Less than 4 people total
      const selectedCount = Math.min(4, candidates.length);
      const selectedBuyers = candidates.slice(0, selectedCount);
      
      if (selectedBuyers.length === 0) {
        throw new Error('No eligible buyers found');
      }
      
      console.log(`✅ Selected ${selectedBuyers.length} buyers:`, selectedBuyers.map(b => b.name));
      
      // 6. Update rotation_index for selected buyers
      await this._updateRotationIndex(client, selectedBuyers, participants.length, session.session_date);
      
      // 7. Save buyer IDs to session
      const buyerIds = selectedBuyers.map(b => b.user_id);
      await client.query(`
        UPDATE lunch_sessions 
        SET buyer_ids = $1, status = 'buyers_selected', selected_at = NOW(), total_participants = $2
        WHERE id = $3
      `, [buyerIds, participants.length, sessionId]);
      
      await client.query('COMMIT');
      
      // 8. Send notifications (after commit)
      try {
        await NotificationService.notifyBuyersSelected(selectedBuyers, session.session_date);
      } catch (notifError) {
        console.error('⚠️  Notification error:', notifError.message);
        // Don't fail the whole operation if notification fails
      }
      
      return selectedBuyers;
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ BuyerSelectionService error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Update rotation_index for selected buyers
   * @private
   */
  async _updateRotationIndex(client, selectedBuyers, totalParticipants, sessionDate) {
    // Find max rotation_index
    const maxResult = await client.query('SELECT COALESCE(MAX(rotation_index), 0) as max_index FROM users');
    const maxIndex = maxResult.rows[0].max_index;
    
    // Update selected buyers
    for (const buyer of selectedBuyers) {
      await client.query(`
        UPDATE users 
        SET rotation_index = $1,
            last_bought_date = $2,
            total_bought_times = total_bought_times + 1
        WHERE id = $3
      `, [maxIndex + 1, sessionDate, buyer.user_id]);
    }
    
    // Check if everyone has been selected at least once → Reset rotation
    const minResult = await client.query('SELECT MIN(rotation_index) as min_index FROM users WHERE is_active = true');
    const minIndex = minResult.rows[0].min_index || 0;
    
    // If minimum rotation_index >= total participants, reset everyone to 0
    if (minIndex >= totalParticipants && totalParticipants > 0) {
      console.log('🔄 Rotation cycle complete. Resetting rotation_index...');
      await client.query('UPDATE users SET rotation_index = 0 WHERE is_active = true');
    }
  }
  
  /**
   * Get buyer count from admin settings
   * @returns {Promise<number>} Buyer count (default: 4)
   */
  async getBuyerCount() {
    const result = await pool.query(
      "SELECT value FROM admin_settings WHERE key = 'buyer_count'"
    );
    return parseInt(result.rows[0]?.value || '4');
  }
}

module.exports = new BuyerSelectionService();
