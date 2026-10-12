const express = require('express');
const router = express.Router();
const QaLineInspectorController = require('../controller/qaLineInspectorController');

router.get('/get-mobile-app-names', QaLineInspectorController.getMobileAppNames);
router.get('/get-mobile-app-names-by-locn-code', QaLineInspectorController.getMobileAppNamesByLocnCode);
router.post('/save-mobile-app-name', QaLineInspectorController.saveMobileAppName);
router.put('/deactivate-mobile-app-name', QaLineInspectorController.deactivateMobileAppName);
router.put('/activate-mobile-app-name', QaLineInspectorController.activateMobileAppName);
router.put('/update-mobile-app-name', QaLineInspectorController.updateMobileAppName);

module.exports = router;