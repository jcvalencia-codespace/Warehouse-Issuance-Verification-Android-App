const express = require('express');
const router = express.Router();
const IssuanceController = require('../controllers/issuanceController');

router.get('/dept-code/:scannedApprover', IssuanceController.getDeptCodeByScannedApprover);
router.get('/next-reference-number', IssuanceController.getNextReferenceNo);
router.get('/get-transaction-type', IssuanceController.getTransactionType);
router.get('/get-item-code', IssuanceController.getItemCode);

module.exports = router;