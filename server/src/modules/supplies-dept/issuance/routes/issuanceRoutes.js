const express = require('express');
const router = express.Router();
const IssuanceController = require('../controllers/issuanceController');

router.get('/dept-code/:scannedApprover', IssuanceController.getDeptCodeByScannedApprover);
router.get('/dept-option', IssuanceController.getDepartmentOption);
router.get('/next-reference-number', IssuanceController.getNextReferenceNo);
router.get('/get-transaction-type', IssuanceController.getTransactionType);
router.get('/get-item-code', IssuanceController.getItemCode);
router.get('/get-item-details/:itemCode', IssuanceController.getItemDetails);
router.get('/get-assigned-quantity-allocation/:itemCode', IssuanceController.getAssignQuantityAllocation);
router.get('/get-area-option/:department', IssuanceController.getAreaOption);
router.get('/get-project-name/:department/:area', IssuanceController.getProjectNameOption);
router.get('/get-machine-no', IssuanceController.getMachineNo);
router.get('/is-month-posted/:locationCode/:month/:year', IssuanceController.isMonthPosted);
router.get('/get-valid-personnel', IssuanceController.getValidPersonnel);
router.post('/post', IssuanceController.postIssuance);

router.get('/posted-header', IssuanceController.getPostedIssuanceHeader);
router.get('/posted-details/:referenceNo', IssuanceController.getPostedIssuanceDetails);

module.exports = router;