const express = require('express');
const router = express.Router();
const NotificationController = require('../controller/notificationController');

router.get('/get-notifications', NotificationController.getNotifications);
router.get('/acknowledge', NotificationController.setAcknowledged);

module.exports = router;
