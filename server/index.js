const app = require('./src/app');
const { getPool, closePool } = require('./src/config/database');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const DEFAULT_DB = process.env.DB_GDB || 'GDB';

const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📍 Test with: http://192.168.10.85:${PORT}/health\n`);
  
  // Test database connection on startup (non-blocking)
  getPool(DEFAULT_DB)
    .then(() => console.log('✅ Database connection established'))
    .catch(err => {
      console.error('❌ Failed to connect to database on startup:', err.message);
      console.log('Note: If you see TLS/SSL errors, run with: node --openssl-legacy-provider server/index.js');
      console.log('The server will continue running - database operations will connect on demand');
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await closePool();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});