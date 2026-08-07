const express = require('express');
const router = express.Router();
const MaterialUtilizationController = require('../controller/materialUtilizationController');

router.get('/get-next-usage-ref-no', MaterialUtilizationController.getNextUsageRefNo);
router.get('/get-machine-lines', MaterialUtilizationController.getMachineLines);
router.get('/get-feed-types-and-variant', MaterialUtilizationController.getFeedTypesAndVariant);
router.get('/get-formulations', MaterialUtilizationController.getFormulations);
router.get('/get-formulation-materials/:formulationNo', MaterialUtilizationController.getFormulationMaterials);
router.put('/save-material-utilization', MaterialUtilizationController.saveMaterialUtilization);

module.exports = router;