const express = require('express');
const router = express.Router();
const MaterialUtilizationController = require('../controller/materialUtilizationController');

router.get('/get-material-utilization-lists', MaterialUtilizationController.getMaterialUtilization);
router.get('/get-material-utilization-done-lists', MaterialUtilizationController.getMaterialUtilizationDone);
router.get('/get-material-utilization-done-pivot-details', MaterialUtilizationController.getMaterialUtilizationDonePivotDetails);
router.get('/get-next-usage-ref-no', MaterialUtilizationController.getNextUsageRefNo);
router.get('/get-machine-lines', MaterialUtilizationController.getMachineLines);
router.get('/get-feed-types', MaterialUtilizationController.getFeedTypes);
router.get('/get-variants-by-feed-type', MaterialUtilizationController.getVariantsByFeedType);
router.get('/get-item-code', MaterialUtilizationController.getItemCode);
router.get('/get-allocation', MaterialUtilizationController.getAllocation);
router.get('/get-batch-lists', MaterialUtilizationController.getBatchLists);
router.get('/get-batch-details', MaterialUtilizationController.getBatchDetails);
router.get('/get-rm-total-kgs', MaterialUtilizationController.getRmTotalKgs);
router.get('/get-issuance-no', MaterialUtilizationController.getIssuanceNo);
router.get('/get-allowed-reviewer', MaterialUtilizationController.getAllowedReviewer);
router.get('/get-next-batch-no', MaterialUtilizationController.getNextBatchNo);
router.get('/get-material-utilization-details', MaterialUtilizationController.getMaterialUtilizationDetails);
router.get('/get-material-utilization-dosing-machine-details', MaterialUtilizationController.getMaterialUtilizationDosingMachineDetails);
router.post('/set-complete', MaterialUtilizationController.setComplete);
router.post('/save-material-utilization', MaterialUtilizationController.saveMaterialUtilization);
router.post('/save-batching-material-utilization', MaterialUtilizationController.saveBatchingMaterialUtilization);
router.put('/update-batching-material-utilization', MaterialUtilizationController.updateBatchingMaterialUtilization);

module.exports = router;