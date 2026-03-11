const app = require('./src/app');
const { initCronJobs } = require('./src/cron/lunch-cron');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Start server
const server = app.listen(PORT, () => {
  console.log('==========================================');
  console.log('🍱 Lunch Fund Management API');
  console.log('==========================================');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
  console.log('==========================================');

  // Start cron jobs after server is up
  initCronJobs();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = server;
