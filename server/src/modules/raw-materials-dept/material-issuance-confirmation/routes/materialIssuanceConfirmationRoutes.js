const express = require('express');
const router = express.Router();
const MaterialIssuanceConfirmationController = require('../controller/materialIssuanceConfirmationController');

router.get('/get-material-issuance-request-header', MaterialIssuanceConfirmationController.getMaterialIssuanceRequestHeader);
router.put('/mark-as-served', MaterialIssuanceConfirmationController.markItemAsServed);
router.get('/get-material-issuance-request-details', MaterialIssuanceConfirmationController.getMaterialsIssuanceRequestDetails);
router.get('/get-material-issuance-request-details/:mirNo', MaterialIssuanceConfirmationController.getMaterialsIssuanceRequestDetails);

module.exports = router;