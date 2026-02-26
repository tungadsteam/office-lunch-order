const cron = require('node-cron');
const pool = require('../config/database');

function startScheduler() {
  // Auto-close lunch sessions at 11:30 AM (Asia/Ho_Chi_Minh)
  cron.schedule('30 11 * * *', async () => {
    try {
      console.log('[CRON] Auto-closing lunch sessions at 11:30 AM...');
      const result = await pool.query(`
        UPDATE lunch_sessions SET status = 'closed'
        WHERE date = CURRENT_DATE AND status = 'ordering'
        RETURNING id
      `);
      if (result.rows.length > 0) {
        console.log(`[CRON] Closed ${result.rows.length} lunch session(s)`);
      }
    } catch (error) {
      console.error('[CRON] Error closing sessions:', error);
    }
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  console.log('[CRON] Scheduler started - auto-close lunch at 11:30 AM daily');
}

module.exports = { startScheduler };
