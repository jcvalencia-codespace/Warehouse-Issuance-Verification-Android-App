const express = require('express');
const router = express.Router();
const MaterialIssuanceRequestReviewController = require('../controller/materialIssuanceRequestReviewController');

router.get('/get-request-header', MaterialIssuanceRequestReviewController.getRequestsHeaderForReview);
router.get('/get-request-details', MaterialIssuanceRequestReviewController.getRequestsDetailsForReview);
router.put('/approve-request', MaterialIssuanceRequestReviewController.approveRequest);
router.put('/approve-request-bulk', MaterialIssuanceRequestReviewController.approveRequestsBulk);
router.put('/reject-request', MaterialIssuanceRequestReviewController.rejectRequest);
router.put('/reject-request-bulk', MaterialIssuanceRequestReviewController.rejectRequestsBulk);

module.exports = router;