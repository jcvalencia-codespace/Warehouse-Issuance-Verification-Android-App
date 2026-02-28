// server/src/modules/schema/routes/schemaRoutes.js
const express = require('express');
const { getPool } = require('../../../config/database');
const sql = require('mssql');

const router = express.Router();
const DB_NAME = process.env.DB_GDB || 'GDB';

/**
 * GET /schema
 * Get all tables in the database
 */
router.get('/', async (req, res) => {
  try {
    const pool = await getPool(DB_NAME);
    
    const result = await pool.request()
      .query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
      `);
    
    res.json({ 
      success: true, 
      tables: result.recordset.map(r => r.TABLE_NAME)
    });
  } catch (error) {
    console.error('Schema query error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Could not retrieve schema',
      error: error.message 
    });
  }
});

/**
 * GET /schema/:table
 * Get columns for a specific table
 */
router.get('/:table', async (req, res) => {
  try {
    const pool = await getPool(DB_NAME);
    const tableName = req.params.table;
    
    const result = await pool.request()
      .input('tableName', sql.VarChar, tableName)
      .query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = @tableName
        ORDER BY ORDINAL_POSITION
      `);
    
    res.json({ 
      success: true, 
      columns: result.recordset
    });
  } catch (error) {
    console.error('Column query error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Could not retrieve column information',
      error: error.message 
    });
  }
});

module.exports = router;
