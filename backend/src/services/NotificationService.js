// backend/src/services/NotificationService.js
const webpush = require('web-push');
const db = require('../config/database');

// Only configure web-push when VAPID keys are available
const vapidEnabled = process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY;
if (vapidEnabled) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || 'admin@lunchfund.com'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('⚠️  VAPID keys not configured — push notifications disabled');
}

/**
 * Send web push to a single subscription. Remove expired subscriptions.
 */
async function sendToSubscription(sub, payload) {
  if (!vapidEnabled) return;
  try {
    await webpush.sendNotification(sub.subscription_object, JSON.stringify(payload));
  } catch (error) {
    // 404 or 410 = subscription expired, remove it
    if (error.statusCode === 404 || error.statusCode === 410) {
      await db.query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
      console.log(`🗑️  Removed expired push subscription #${sub.id}`);
    } else {
      console.error(`Push error for sub #${sub.id}:`, error.statusCode || error.message);
    }
  }
}

/**
 * Send notification to specific user IDs
 */
async function sendToUsers(userIds, payload) {
  if (!vapidEnabled || userIds.length === 0) return;
  const { rows: subs } = await db.query(
    'SELECT * FROM push_subscriptions WHERE user_id = ANY($1::int[])',
    [userIds]
  );
  for (const sub of subs) {
    await sendToSubscription(sub, payload);
  }
  console.log(`📨 Sent "${payload.title}" to ${subs.length} subscriptions (${userIds.length} users)`);
}

/**
 * Send notification to ALL subscribers
 */
async function sendBroadcast(payload) {
  if (!vapidEnabled) return;
  const { rows: subs } = await db.query('SELECT * FROM push_subscriptions');
  for (const sub of subs) {
    await sendToSubscription(sub, payload);
  }
  console.log(`📢 Broadcast "${payload.title}" to ${subs.length} subscriptions`);
}

// === Public API ===

/** Cron: remind users who haven't ordered yet */
async function notifyDailyReminder(users) {
  const userIds = users.map(u => u.id);
  await sendToUsers(userIds, {
    title: '🍱 Nhắc đặt cơm',
    body: 'Bạn chưa đặt cơm hôm nay. Đặt ngay trước khi chốt sổ!',
  });
}

/** Notify selected buyers when buyer selection is done */
async function notifyBuyersSelected(buyers, sessionDate) {
  const userIds = buyers.map(b => b.user_id || b.id);
  await sendToUsers(userIds, {
    title: '🛒 Bạn được chọn đi mua cơm!',
    body: `Phiên ${sessionDate}: Bạn là 1 trong ${buyers.length} người đi mua. Mở app để xem chi tiết.`,
  });
}

/** Notify user when their deposit is approved */
async function notifyDepositApproved(userId, amount) {
  await sendToUsers([userId], {
    title: '✅ Nạp tiền được duyệt',
    body: `Yêu cầu nạp ${amount.toLocaleString('vi-VN')}đ đã được admin duyệt.`,
  });
}

/** Notify user when their deposit is rejected */
async function notifyDepositRejected(userId, amount, reason) {
  await sendToUsers([userId], {
    title: '❌ Nạp tiền bị từ chối',
    body: `Yêu cầu nạp ${amount.toLocaleString('vi-VN')}đ bị từ chối${reason ? ': ' + reason : ''}.`,
  });
}

/** Notify participants when settlement is complete */
async function notifySettlementComplete(userIds, amountPerPerson) {
  await sendToUsers(userIds, {
    title: '💰 Đã quyết toán cơm trưa',
    body: `Mỗi người: ${amountPerPerson.toLocaleString('vi-VN')}đ. Kiểm tra số dư trong app.`,
  });
}

/** Generic broadcast from admin */
async function sendBroadcastNotification(payload) {
  await sendBroadcast(payload);
}

/** Legacy: send reminder to all (used by cron/jobs.js) */
async function sendReminderNotifications() {
  await sendBroadcast({
    title: '🍱 Nhắc đặt cơm',
    body: 'Đừng quên đặt cơm trưa hôm nay!',
  });
}

/** Legacy: finalized notifications */
async function sendFinalizedNotifications() {
  // Get users who ordered today
  const { rows: users } = await db.query(`
    SELECT DISTINCT lo.user_id
    FROM lunch_orders lo
    JOIN lunch_sessions ls ON lo.session_id = ls.id
    WHERE ls.session_date = CURRENT_DATE AND lo.status = 'confirmed'
  `);
  const userIds = users.map(u => u.user_id);
  if (userIds.length === 0) return;

  await sendToUsers(userIds, {
    title: '📋 Đã chốt sổ cơm trưa',
    body: 'Phiên cơm trưa hôm nay đã được chốt. Xem chi tiết trong app.',
  });
}

module.exports = {
  notifyDailyReminder,
  notifyBuyersSelected,
  notifyDepositApproved,
  notifyDepositRejected,
  notifySettlementComplete,
  sendBroadcastNotification,
  sendReminderNotifications,
  sendFinalizedNotifications,
};
