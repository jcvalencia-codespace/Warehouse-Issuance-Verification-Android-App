const express = require('express');
const router = express.Router();
const MaterialIssuanceController = require('../controller/materialIssuanceController');

router.get('/get-item-code', MaterialIssuanceController.getItemCode);
router.get('/get-next-mir-no', MaterialIssuanceController.getNextMIRNo);
router.put('/save-material-issuance-request', MaterialIssuanceController.saveMaterialIssuanceRequest);
router.get('/get-material-issuance-request-header', MaterialIssuanceController.getMaterialsIssuanceRequestHeader);
router.get('/get-material-issuance-request-details', MaterialIssuanceController.getMaterialsIssuanceRequestDetails);
router.get('/get-material-issuance-request-details/:mirNo', MaterialIssuanceController.getMaterialsIssuanceRequestDetails);

module.exports = router;