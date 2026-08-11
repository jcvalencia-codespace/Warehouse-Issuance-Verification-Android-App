const express = require('express');
const router = express.Router();
const MaterialUtilizationTagController = require('../controller/materialUtilizationTagController');

router.get('/get-tag', MaterialUtilizationTagController.getTag);
router.put('/update-tag', MaterialUtilizationTagController.updateTag);
module.exports = router;
