// server/src/modules/issuance/routes/issuanceRoutes.js
const express = require('express');
const router = express.Router();
const IssuanceController = require('../controllers/issuanceController');

// Allocate bags endpoint
router.post('/allocate-bags', IssuanceController.allocateBags);

// Get transaction reference number endpoint
router.get('/transaction-reference', IssuanceController.getTransactionReferenceNumber);

// Get next issuance reference number endpoint
router.get('/issuance-reference', IssuanceController.getNextIssuanceReference);

// Get areas endpoint
router.get('/areas', IssuanceController.getAreas);

// Get all available lots for an area (no allocation) - must be before /areas/:area/lots
router.get('/areas/:area/available-lots', IssuanceController.getAvailableLots);

// Get items by area endpoint
router.get('/areas/:area/items', IssuanceController.getItemsByArea);

// Get lots by area and optionally by item endpoint
router.get('/areas/:area/lots', IssuanceController.getLotsByArea);

// Post issuance endpoint
router.post('/post', IssuanceController.postIssuance);

module.exports = router;
