// backend/src/controllers/notificationController.js
const db = require('../config/database');

exports.subscribe = async (req, res) => {
  const userId = req.user.id;
  const subscription = req.body; // Frontend sends subscription object directly

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ success: false, message: 'Invalid subscription' });
  }

  try {
    await db.query(
      `INSERT INTO push_subscriptions (user_id, subscription_object)
       VALUES ($1, $2)
       ON CONFLICT (user_id, subscription_object) DO NOTHING`,
      [userId, JSON.stringify(subscription)]
    );
    res.status(201).json({ success: true, message: 'Subscription saved' });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
