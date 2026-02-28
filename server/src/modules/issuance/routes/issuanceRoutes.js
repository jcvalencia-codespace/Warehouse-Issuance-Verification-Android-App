// server/src/modules/issuance/routes/issuanceRoutes.js
const express = require('express');
const router = express.Router();
const IssuanceController = require('../controllers/issuanceController');

// Allocate bags endpoint
router.post('/allocate-bags', IssuanceController.allocateBags);

// Get areas endpoint
router.get('/areas', IssuanceController.getAreas);

// Get items by area endpoint
router.get('/areas/:area/items', IssuanceController.getItemsByArea);

// Post issuance endpoint
router.post('/post', IssuanceController.postIssuance);

module.exports = router;
