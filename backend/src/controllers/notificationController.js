// backend/src/controllers/notificationController.js
const db = require('../db');

exports.subscribe = async (req, res) => {
  const { subscription } = req.body;
  const userId = req.user.id; // Assuming auth middleware

  try {
    await db.query(
      'INSERT INTO push_subscriptions (user_id, subscription_object) VALUES ($1, $2)',
      [userId, subscription]
    );
    res.status(201).json({ message: 'Subscription saved.' });
  } catch (error) {
    console.error('Error saving subscription', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
