// server/src/modules/auth/routes/authRoutes.js
const express = require('express');
const AuthController = require('../controllers/authController');

const router = express.Router();

/**
 * POST /auth/login
 * Authenticate user with username and password
 */
router.post('/login', AuthController.login);
router.post('/login-history', AuthController.loginHistory);
router.get('/company', AuthController.companyLogin);
module.exports = router;
