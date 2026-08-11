const express = require('express');
const router = express.Router();
const MaterialUtilizationController = require('../controller/materialUtilizationController');

router.get('/get-next-usage-ref-no', MaterialUtilizationController.getNextUsageRefNo);
router.get('/get-machine-lines', MaterialUtilizationController.getMachineLines);
router.get('/get-feed-types', MaterialUtilizationController.getFeedTypes);
router.get('/get-variants-by-feed-type', MaterialUtilizationController.getVariantsByFeedType);
router.get('/get-item-code', MaterialUtilizationController.getItemCode);
router.get('/get-allocation', MaterialUtilizationController.getAllocation);
router.post('/save-material-utilization', MaterialUtilizationController.saveMaterialUtilization);
module.exports = router;