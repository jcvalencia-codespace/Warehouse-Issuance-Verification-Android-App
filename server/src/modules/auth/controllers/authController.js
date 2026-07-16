// server/src/modules/auth/controllers/authController.js
const AuthService = require('../services/authService');

class AuthController {
  /**
   * Handle login request
   */
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }

      const result = await AuthService.authenticateUser(username, password);

      if (result.success) {
        const { system, company } = req.body || {};
        const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || '';

        const responseBody = {
          ...result,
          company: company || result.user?.COMPANY || undefined,
        };

        res.json(responseBody);
        
        if (ipAddress && system) {
          AuthService.postLoginHistory(
            ipAddress,
            system,
            result.user.USERNAME,
            result.user.NAME,
            company || ''
          ).catch((historyError) => {
            console.error('Login history error:', historyError.message);
          });
        }
      } else {
        return res.status(401).json(result);
      }
    } catch (error) {
      console.error('Login controller error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Database error occurred',
        error: error.message,
        hint: 'Check /schema/SYSTEM.USERACCOUNT endpoint to verify column names'
      });
    }
  }

  /**
   * Handle health check
   */
  static healthCheck(req, res) {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  /**
   * Handle login history
   */
  static async loginHistory(req, res) {
    try {
      const { ipAddress, system, userName, name, company } = req.body;

      if (!ipAddress || !system || !userName) {
        return res.status(400).json({
          success: false,
          message: 'ipAddress, system, and userName are required',
        });
      }

      const result = await AuthService.postLoginHistory(ipAddress, system, userName, name || '', company || '');
      res.json({ success: true, result });
    } catch (error) {
      console.error('Login history controller error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Database error occurred',
        error: error.message,
      });
    }
  }

  static async companyLogin(req, res){
    try{
      const {ipAddress, username} = req.body;

      const result = await AuthService.getCompanyLogin(ipAddress, username);
      res.json({ success: true, company: result });
    }catch (error){
      console.error('failed to get company login:', error.message);
      res.status(500).json({
        success: false,
        message: 'Database error occurred',
        error: error.message,
      });
    }
  }
}

module.exports = AuthController;
