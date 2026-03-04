// backend/src/controllers/adminController.js
const { sendBroadcastNotification } = require('../services/notificationService');

exports.broadcastMessage = async (req, res) => {
  const { title, body } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required.' });
  }

  try {
    const payload = { title, body };
    await sendBroadcastNotification(payload);
    res.status(200).json({ message: 'Broadcast sent successfully.' });
  } catch (error) {
    console.error('Error sending broadcast:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
