// server/src/modules/forklift-operator/routes/forkliftOperatorRoutes.js

const express = require('express');
const router = express.Router();
const forkliftOperatorController = require('../controllers/forkliftOperatorController');

router.get('/', forkliftOperatorController.getForkliftOperators);
router.get('/:rowId', forkliftOperatorController.getForkliftOperatorById);
router.post('/', forkliftOperatorController.createForkliftOperator);
router.put('/:rowId', forkliftOperatorController.updateForkliftOperator);
router.delete('/:rowId', forkliftOperatorController.deleteForkliftOperator);
router.patch('/:rowId/toggle-status', forkliftOperatorController.toggleStatus);

module.exports = router;