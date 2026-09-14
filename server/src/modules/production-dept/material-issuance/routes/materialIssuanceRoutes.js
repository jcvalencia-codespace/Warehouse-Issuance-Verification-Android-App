const express = require('express');
const router = express.Router();
const MaterialIssuanceController = require('../controller/materialIssuanceController');

router.get('/get-item-code', MaterialIssuanceController.getItemCode);
router.get('/get-next-mir-no', MaterialIssuanceController.getNextMIRNo);
router.get('/get-for-edit', MaterialIssuanceController.getMIRForEdit);
router.get('/get-details-for-edit/:mirNo', MaterialIssuanceController.getMIRDetailsForEdit);
router.put('/save-material-issuance-request', MaterialIssuanceController.saveMaterialIssuanceRequest);
router.put('/update-material-issuance-request', MaterialIssuanceController.updateMaterialIssuanceRequest);

module.exports = router;