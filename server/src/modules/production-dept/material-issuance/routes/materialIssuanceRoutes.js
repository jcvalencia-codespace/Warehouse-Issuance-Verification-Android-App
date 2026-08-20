const express = require('express');
const router = express.Router();
const MaterialIssuanceController = require('../controller/materialIssuanceController');

router.get('/get-item-code', MaterialIssuanceController.getItemCode);
router.get('/get-next-mir-no', MaterialIssuanceController.getNextMIRNo);
router.put('/save-material-issuance-request', MaterialIssuanceController.saveMaterialIssuanceRequest);

module.exports = router;