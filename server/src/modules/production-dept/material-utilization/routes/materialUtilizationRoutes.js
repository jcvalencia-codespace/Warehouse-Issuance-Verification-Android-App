const express = require('express');
const router = express.Router();
const MaterialUtilizationController = require('../controller/materialUtilizationController');

router.get('/get-material-utilization-lists', MaterialUtilizationController.getMaterialUtilization);
router.get('/get-next-usage-ref-no', MaterialUtilizationController.getNextUsageRefNo);
router.get('/get-machine-lines', MaterialUtilizationController.getMachineLines);
router.get('/get-feed-types', MaterialUtilizationController.getFeedTypes);
router.get('/get-variants-by-feed-type', MaterialUtilizationController.getVariantsByFeedType);
router.get('/get-item-code', MaterialUtilizationController.getItemCode);
router.get('/get-allocation', MaterialUtilizationController.getAllocation);
router.get('/get-material-utilization-details', MaterialUtilizationController.getMaterialUtilizationDetails);
router.post('/save-material-utilization', MaterialUtilizationController.saveMaterialUtilization);
router.post('/save-batching-material-utilization', MaterialUtilizationController.saveBatchingMaterialUtilization);

module.exports = router;