const express = require('express');
const router = express.Router();
const IssuanceController = require('../controllers/issuanceController');

router.get('/dept-code/:scannedApprover', IssuanceController.getDeptCodeByScannedApprover);
router.get('/next-reference-number', IssuanceController.getNextReferenceNo);
router.get('/get-transaction-type', IssuanceController.getTransactionType);
router.get('/get-item-code', IssuanceController.getItemCode);
router.get('/get-item-details/:itemCode', IssuanceController.getItemDetails);
router.get('/get-assigned-quantity-allocation/:itemCode', IssuanceController.getAssignQuantityAllocation);
router.get('/get-area-option/:department', IssuanceController.getAreaOption);
router.get('/get-project-name/:department/:area', IssuanceController.getProjectNameOption);
router.get('/is-month-posted/:locationCode/:month/:year', IssuanceController.isMonthPosted);

module.exports = router;