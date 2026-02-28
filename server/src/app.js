// server/src/app.js
const crypto = require('crypto');
const originalCreateSecureContext = crypto.createSecureContext;

// IMPORTANT: This must be set before any TLS operations
// This is needed for SQL Server 2005 compatibility
crypto.createSecureContext = function(options) {
  if (options) {
    options.minVersion = 'TLSv1';
    options.maxVersion = 'TLSv1.2';
  }
  return originalCreateSecureContext.call(this, options);
};

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Set Node.js TLS options for older SQL Server compatibility
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Import routes and controllers from modules
const authRoutes = require('./modules/auth/routes/authRoutes');
const schemaRoutes = require('./modules/schema/routes/schemaRoutes');
const warehouseRoutes = require('./modules/warehouse/routes/warehouseRoutes');
const issuanceRoutes = require('./modules/issuance/routes/issuanceRoutes');
const AuthController = require('./modules/auth/controllers/authController');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/health', AuthController.healthCheck);
app.post('/login', AuthController.login);
app.use('/auth', authRoutes);
app.use('/schema', schemaRoutes);
app.use('/warehouse', warehouseRoutes);
app.use('/issuance', issuanceRoutes);

// Test database connection endpoint
app.get('/test-db', async (req, res) => {
  try {
    const { getPool } = require('./config/database');
    const dbName = process.env.DB_GDB || 'GDB';
    const pool = await getPool(dbName);
    const result = await pool.request().query('SELECT 1 as test');
    res.json({ 
      success: true, 
      message: 'Database connection successful',
      database: dbName,
      result: result.recordset 
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

// Health check endpoint (backward compatibility)
app.get('/', (req, res) => {
  res.json({ 
    status: 'Server is running',
    endpoints: {
      health: 'GET /health',
      login: 'POST /login or POST /auth/login',
      schema: 'GET /schema or GET /schema/:tableName',
      testDb: 'GET /test-db'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

module.exports = app;
