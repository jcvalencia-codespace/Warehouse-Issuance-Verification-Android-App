// server/src/modules/auth/services/authService.js
const sql = require('mssql');
const { getPool } = require('../../../config/database');

const DB_NAME = process.env.DB_GDB || 'GDB';

class AuthService {
  /**
   * Authenticate user with credentials
   */
  static async authenticateUser(username, password) {
    try {
      const pool = await getPool(DB_NAME);
      
      const result = await pool.request()
        .input('username', sql.VarChar, username)
        .input('password', sql.VarChar, password)
        .query(`
          SELECT * 
          FROM [SYSTEM.USERACCOUNT]
          WHERE USERNAME = @username 
          AND PASSWORD = @password
        `);

      if (result.recordset.length > 0) {
        const user = result.recordset[0];
        return {
          success: true,
          user: {
            USERNAME: user.USERNAME,
            USERLEVEL: user.USERLEVEL,
            EMPLOYEEID: user.EMPLOYEEID,
            NAME: user.NAME,
            DEPTCODE: user.DEPTCODE,
            DEPARTMENT: user.DEPARTMENT,
            JOBTITLE: user.JOBTITLE,
            ACTIVE: user.ACTIVE,
            EMAILADD: user.EMAILADD,
            ISADMIN: user.USERLEVEL === 'ADMINISTRATOR',
          }
        };
      }

      return { success: false, message: 'Invalid username or password' };
    } catch (error) {
      console.error('Auth service error:', error);
      throw error;
    }
  }

  /**
   * Get user by username
   */
  static async getUserByUsername(username) {
    try {
      const pool = await getPool(DB_NAME);
      
      const result = await pool.request()
        .input('username', sql.VarChar, username)
        .query(`
          SELECT * 
          FROM [SYSTEM.USERACCOUNT]
          WHERE USERNAME = @username
        `);

      return result.recordset.length > 0 ? result.recordset[0] : null;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }
}

module.exports = AuthService;
