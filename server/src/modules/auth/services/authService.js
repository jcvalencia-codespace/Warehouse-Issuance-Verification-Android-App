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
  
  static async postLoginHistory(ipAddress, system, userName, name, company){
    const pool = await getPool(DB_NAME);

    // Log everything that will be inserted, including what gets truncated
    const data = {
      ipAddress: (ipAddress || '').substring(0, 50),
      system:    (system || '').substring(0, 50),
      userName:  (userName || '').substring(0, 50),
      name:      (name || '').substring(0, 100),
      company:   (company || '').substring(0, 50),
    };
    console.log('data to insert:', data);

    const result = await pool.request()
      .input('ipAddress', sql.VarChar(50), data.ipAddress)
      .input('system', sql.VarChar(50), data.system)
      .input('userName', sql.VarChar(50), data.userName)
      .input('name', sql.VarChar(100), data.name)
      .input('company', sql.VarChar(50), data.company)
      .query(`
        INSERT INTO [SYSTEM.USER_LOGIN_HISTORY] (COMPUTERNAME, EMPLOYEEID, SYSTEM_USERNAME, SYSTEM_NAME, DOMAIN_USERNAME, DOMAIN_NAME, SYSTEM, DATECREATED, COMPANY)
        VALUES                                  (@ipAddress, @userName, @userName, @name, @userName, @name, @company, GETDATE(), @company)
      `);

    console.log('insert result:', result.rowsAffected);
    return result;
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
