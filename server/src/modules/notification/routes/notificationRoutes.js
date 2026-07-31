const express = require('express');
const router = express.Router();
const notificationController = require('../controller/notificationController');

router.post('/register-token', notificationController.registerToken);
router.post('/send', notificationController.sendNotification);
router.get('/tokens', notificationController.getAllTokens);
module.exports = router;
