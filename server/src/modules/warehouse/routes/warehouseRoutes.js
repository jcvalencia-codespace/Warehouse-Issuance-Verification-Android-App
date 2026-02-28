// server/src/modules/warehouse/routes/warehouseRoutes.js

const express = require('express');
const WarehouseController = require('../controllers/warehouseController');

const router = express.Router();

/**
 * Warehouse API Routes
 * Base path: /warehouse
 */

// Dashboard metrics endpoint
router.get('/metrics', WarehouseController.getMetrics);

// Pending (not posted) transactions endpoint
router.get('/pending-transactions', WarehouseController.getPendingTransactions);

// Completed today transactions endpoint
router.get('/completed-today', WarehouseController.getCompletedToday);

// Transaction details for warehouse confirmation
router.get('/transaction-details/:transRefNo', WarehouseController.getTransactionDetails);

module.exports = router;
