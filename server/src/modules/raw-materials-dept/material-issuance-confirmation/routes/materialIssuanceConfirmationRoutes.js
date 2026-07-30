const express = require('express');
const router = express.Router();
const MaterialIssuanceConfirmationController = require('../controller/materialIssuanceConfirmationController');

router.get('/get-material-issuance-request-header', MaterialIssuanceConfirmationController.getMaterialIssuanceRequestHeader);
router.put('/mark-as-served', MaterialIssuanceConfirmationController.markItemAsServed);
router.put('/set-to-preparing', MaterialIssuanceConfirmationController.markItemAsPreparing);
router.put('/set-to-prepared', MaterialIssuanceConfirmationController.markItemAsPrepared);
router.get('/get-material-issuance-request-details', MaterialIssuanceConfirmationController.getMaterialsIssuanceRequestDetails);
router.get('/get-material-issuance-request-details/:mirNo', MaterialIssuanceConfirmationController.getMaterialsIssuanceRequestDetails);
router.get('/get-served-items-today', MaterialIssuanceConfirmationController.getServedItemsToday);
router.put('/cancel-item', MaterialIssuanceConfirmationController.cancelItem);
module.exports = router;