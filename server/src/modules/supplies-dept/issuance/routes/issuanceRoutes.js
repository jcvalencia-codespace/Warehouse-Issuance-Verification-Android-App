const express = require('express');
const router = express.Router();
const IssuanceController = require('../controllers/issuanceController');

router.get('/dept-code/:scannedApprover', IssuanceController.getDeptCodeByScannedApprover);
router.get('/next-reference-number', IssuanceController.getNextReferenceNo);
router.get('/get-transaction-type', IssuanceController.getTransactionType);

module.exports = router;