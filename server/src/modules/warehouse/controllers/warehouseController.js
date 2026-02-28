// server/src/modules/warehouse/controllers/warehouseController.js

const WarehouseService = require('../services/warehouseService');

class WarehouseController {
  /**
   * GET /warehouse/metrics
   * Returns dashboard metrics: pending, completed today, total transactions
   */
  static async getMetrics(req, res) {
    try {
      const result = await WarehouseService.getMetrics();
      
      if (result.success) {
        return res.json({
          success: true,
          data: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          message: result.error,
          data: result.data
        });
      }
    } catch (error) {
      console.error('Error in getMetrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch metrics',
        error: error.message
      });
    }
  }

  /**
   * GET /warehouse/pending-transactions
   * Returns paginated list of NOT POSTED transactions
   * Query params: skip, take (default 50)
   */
  static async getPendingTransactions(req, res) {
    try {
      const skip = parseInt(req.query.skip || '0');
      const take = parseInt(req.query.take || '50');

      const result = await WarehouseService.getPendingTransactions(skip, take);
      
      if (result.success) {
        return res.json({
          success: true,
          data: result.data,
          count: result.count,
          skip,
          take
        });
      } else {
        return res.status(500).json({
          success: false,
          message: result.error,
          data: []
        });
      }
    } catch (error) {
      console.error('Error in getPendingTransactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending transactions',
        error: error.message
      });
    }
  }

  /**
   * GET /warehouse/completed-today
   * Returns paginated list of transactions completed today
   * Query params: skip, take (default 50)
   */
  static async getCompletedToday(req, res) {
    try {
      const skip = parseInt(req.query.skip || '0');
      const take = parseInt(req.query.take || '50');

      const result = await WarehouseService.getCompletedTransactionToday(skip, take);
      
      if (result.success) {
        return res.json({
          success: true,
          data: result.data,
          count: result.count,
          skip,
          take
        });
      } else {
        return res.status(500).json({
          success: false,
          message: result.error,
          data: []
        });
      }
    } catch (error) {
      console.error('Error in getCompletedToday:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch completed transactions',
        error: error.message
      });
    }
  }

  /**
   * GET /warehouse/transaction-details/:transRefNo
   * Returns transaction details for warehouse confirmation
   */
  static async getTransactionDetails(req, res) {
    try {
      const { transRefNo } = req.params;

      if (!transRefNo) {
        return res.status(400).json({
          success: false,
          message: 'Transaction reference number is required',
          data: []
        });
      }

      const result = await WarehouseService.getTransactionDetails(transRefNo);
      
      if (result.success) {
        return res.json({
          success: true,
          data: result.data,
          count: result.count,
          transRefNo
        });
      } else {
        return res.status(500).json({
          success: false,
          message: result.error,
          data: []
        });
      }
    } catch (error) {
      console.error('Error in getTransactionDetails:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transaction details',
        error: error.message
      });
    }
  }
}

module.exports = WarehouseController;
