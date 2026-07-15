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
const path = require('path');

// Load .env from project root (3 levels up from server/src/)
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

// Get the API URL from environment for CORS configuration
const API_URL = process.env.EXPO_PUBLIC_API_URL || `http://192.168.10.85:3000`;
const ALLOWED_ORIGINS = [
  API_URL,
  'http://localhost:8081',
  'http://localhost:19000',
  'http://localhost:19006',
];

// CORS configuration - allow requests from the Expo app's origin
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      // For development, log and allow anyway (remove in production)
      console.log(`CORS: Allowing request from origin: ${origin}`);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  // console.log(`📱 Client connected: ${clientIP}`);
  next();
});

// Import routes and controllers from modules
const authRoutes = require('./modules/auth/routes/authRoutes');
const schemaRoutes = require('./modules/schema/routes/schemaRoutes');
const warehouseRoutes = require('./modules/raw-materials-dept/warehouse/routes/warehouseRoutes');
const issuanceRoutes = require('./modules/raw-materials-dept/issuance/routes/issuanceRoutes');
const suppliesIssuanceRoutes = require('./modules/supplies-dept/issuance/routes/issuanceRoutes');
const forkliftOperatorRoutes = require('./modules/raw-materials-dept/forklift-operator/routes/forkliftOperatorRoutes');
const warehouseController = require('./modules/raw-materials-dept/warehouse/controllers/warehouseController');
const AuthController = require('./modules/auth/controllers/authController');

// Routes
app.get('/health', AuthController.healthCheck);
app.post('/login', AuthController.login);
app.use('/auth', authRoutes);
app.use('/schema', schemaRoutes);
app.use('/warehouse', warehouseRoutes);
app.use('/issuance', issuanceRoutes);
app.use('/supplies/issuance', suppliesIssuanceRoutes);
app.use('/forklift-operators', forkliftOperatorRoutes);

// Stock balance endpoint (direct route)
app.get('/stock-balance', warehouseController.getStockBalance);

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
console.log('API URL:', process.env.EXPO_PUBLIC_API_URL);
module.exports = app;
