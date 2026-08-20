const express = require('express');
const router = express.Router();
const MaterialIssuanceRequestReviewController = require('../controller/materialIssuanceRequestReviewController');

router.get('/get-request-header', MaterialIssuanceRequestReviewController.getRequestsHeaderForReview);
router.get('/get-request-details/:mirNo', MaterialIssuanceRequestReviewController.getRequestsDetailsForReview);
router.put('/approve-request', MaterialIssuanceRequestReviewController.approveRequest);
router.put('/reject-request', MaterialIssuanceRequestReviewController.rejectRequest);

module.exports = router;