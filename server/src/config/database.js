// server/src/config/database.js
const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Base config used for any database
const baseConfig = {
  server: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectionTimeout: 10000,
    requestTimeout: 15000,
  },
};

let poolMap = {};       // Stores pools per database name
let connectingMap = {}; // Prevent duplicate connections

function validateDbConfig(dbName) {
  const missing = [];
  if (!baseConfig.server) missing.push('DB_HOST');
  if (!baseConfig.user) missing.push('DB_USER');
  if (!baseConfig.password) missing.push('DB_PASSWORD');
  if (!dbName) missing.push('Database name');

  if (missing.length) {
    console.warn('⚠️ Missing DB config:', missing.join(', '));
    return false;
  }
  return true;
}

async function getPool(dbName) {
  if (!validateDbConfig(dbName)) {
    throw new Error(`Database is not properly configured. Missing values.`);
  }

  // Already connected?
  if (poolMap[dbName] && poolMap[dbName].connected) {
    return poolMap[dbName];
  }

  // Already connecting?
  if (connectingMap[dbName]) {
    return connectingMap[dbName];
  }

  const config = { ...baseConfig, database: dbName };

  const connectPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
      poolMap[dbName] = pool;

      pool.on('error', err => {
        console.error(`SQL Pool error (${dbName}):`, err);
        poolMap[dbName] = null;
      });

      console.log(`✅ Connected to SQL Server database: ${dbName}`);
      return pool;
    })
    .catch(err => {
      poolMap[dbName] = null;
      throw err;
    })
    .finally(() => {
      connectingMap[dbName] = null;
    });

  connectingMap[dbName] = connectPromise;
  return connectPromise;
}

async function closePool() {
  for (const key of Object.keys(poolMap)) {
    if (poolMap[key]) {
      await poolMap[key].close();
      poolMap[key] = null;
    }
  }
}

module.exports = {
  getPool,
  closePool,
};