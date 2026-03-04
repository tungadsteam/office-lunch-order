// backend/src/cron/jobs.js
const cron = require('node-cron');
const { sendReminderNotifications, sendFinalizedNotifications } = require('../services/notificationService');

const initCronJobs = () => {
  // Every day at 9:00 AM
  cron.schedule('0 9 * * 1-5', () => { // Mon-Fri
    sendReminderNotifications();
  }, {
    timezone: "Asia/Ho_Chi_Minh"
  });

  // This needs to be called manually from the finalize order endpoint
  // But we can add another cron for safety if needed
};

module.exports = { initCronJobs, sendFinalizedNotifications };
