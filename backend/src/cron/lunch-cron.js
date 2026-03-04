const cron = require('node-cron');
const moment = require('moment');
const pool = require('../config/database');
const BuyerSelectionService = require('../services/BuyerSelectionService');
const NotificationService = require('../services/NotificationService');

// VN timezone = UTC+7, schedule crons using UTC times:
// 9:00 VN  = 02:00 UTC   9:30 VN  = 02:30 UTC
// 10:00 VN = 03:00 UTC   10:30 VN = 03:30 UTC
// 11:00 VN = 04:00 UTC   11:30 VN = 04:30 UTC

/**
 * Job 1: Every 30 min from 9:00–11:00 VN (before auto-selection)
 * Remind users who haven't ordered yet
 */
const orderReminderJob = cron.schedule('0,30 2,3,4 * * 1-5', async () => {
  const todayVN = moment().utcOffset('+07:00').format('YYYY-MM-DD');

  try {
    const sessionResult = await pool.query(
      "SELECT id FROM lunch_sessions WHERE session_date = $1 AND status = 'ordering'",
      [todayVN]
    );

    if (sessionResult.rows.length === 0) return;
    const sessionId = sessionResult.rows[0].id;

    // Get users who haven't joined yet and have push subscriptions
    const usersResult = await pool.query(`
      SELECT DISTINCT u.id, u.name
      FROM users u
      JOIN push_subscriptions ps ON ps.user_id = u.id
      WHERE u.is_active = true
        AND u.notification_enabled = true
        AND u.id NOT IN (
          SELECT user_id FROM lunch_orders
          WHERE session_id = $1 AND status = 'confirmed'
        )
    `, [sessionId]);

    if (usersResult.rows.length > 0) {
      console.log(`⏰ [Cron] Sending order reminders to ${usersResult.rows.length} users`);
      await NotificationService.notifyDailyReminder(usersResult.rows);
    }
  } catch (err) {
    console.error('❌ [Cron] Order reminder error:', err.message);
  }
}, { scheduled: false });

/**
 * Job 2: At 11:30 VN (04:30 UTC) on weekdays – auto select buyers
 */
const autoSelectBuyersJob = cron.schedule('30 4 * * 1-5', async () => {
  const todayVN = moment().utcOffset('+07:00').format('YYYY-MM-DD');

  try {
    const sessionResult = await pool.query(
      "SELECT id FROM lunch_sessions WHERE session_date = $1 AND status = 'ordering'",
      [todayVN]
    );

    if (sessionResult.rows.length === 0) {
      console.log('⏭️  [Cron] No active ordering session today, skipping buyer selection');
      return;
    }

    const sessionId = sessionResult.rows[0].id;
    console.log(`🎯 [Cron] Auto-selecting buyers for session ${sessionId}...`);
    await BuyerSelectionService.selectFourBuyers(sessionId);
    console.log('✅ [Cron] Auto buyer selection complete');
  } catch (err) {
    console.error('❌ [Cron] Auto select buyers error:', err.message);
  }
}, { scheduled: false });

function initCronJobs() {
  if (process.env.CRON_ENABLED !== 'true') {
    console.log('⏸️  Cron jobs disabled (set CRON_ENABLED=true to enable)');
    return;
  }

  orderReminderJob.start();
  autoSelectBuyersJob.start();

  console.log('✅ Cron jobs initialized');
  console.log('   - Order reminders : every 30min, 9:00–11:00 VN, weekdays');
  console.log('   - Auto buyer select: 11:30 VN, weekdays');
}

module.exports = { initCronJobs };
