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
        return res.json(result);
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
}

module.exports = AuthController;
