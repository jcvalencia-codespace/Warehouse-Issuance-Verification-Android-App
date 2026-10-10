const express = require('express');
const router = express.Router();
const ProfileController = require('../controller/profileController');

router.get('/get-mobile-app-names', ProfileController.getMobileAppNames);
router.get('/get-mobile-app-names-by-locn-code', ProfileController.getMobileAppNamesByLocnCode);
router.post('/save-mobile-app-name', ProfileController.saveMobileAppName);
router.put('/deactivate-mobile-app-name', ProfileController.deactivateMobileAppName);

module.exports = router;