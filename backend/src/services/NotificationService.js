// backend/src/services/notificationService.js
const webpush = require('web-push');
const db = require('../db');

// VAPID keys should be generated once and stored securely in environment variables
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const sendNotification = async (subscription, payload) => {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (error) {
    console.error('Error sending notification, subscription probably expired', error.statusCode);
    // TODO: Delete expired subscription from DB
  }
};

const sendReminderNotifications = async () => {
  console.log('Sending 9 AM order reminders...');
  const { rows: subscriptions } = await db.query('SELECT * FROM push_subscriptions');
  const payload = {
    title: 'Lunch Order Reminder',
    body: 'Don\'t forget to place your lunch order before 10 AM!',
  };
  for (const sub of subscriptions) {
    await sendNotification(sub.subscription_object, payload);
  }
};

const sendFinalizedNotifications = async () => {
    console.log('Sending order finalization notifications...');
    // Get users who ordered today
    const { rows: users } = await db.query(`
        SELECT DISTINCT u.id 
        FROM users u
        JOIN orders o ON u.id = o.user_id
        WHERE o.order_date = CURRENT_DATE
    `);
    const userIds = users.map(u => u.id);

    if (userIds.length === 0) return;

    // Get subscriptions for those users
    const { rows: subscriptions } = await db.query(
        'SELECT * FROM push_subscriptions WHERE user_id = ANY($1::int[])',
        [userIds]
    );

    const payload = {
        title: 'Lunch Order Finalized',
        body: 'Today\'s lunch order has been finalized. Check the app for details.',
    };

    for (const sub of subscriptions) {
        await sendNotification(sub.subscription_object, payload);
    }
};

module.exports = {
  sendReminderNotifications,
  sendFinalizedNotifications,
};
