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
      
      if (result && result.success) {
        return res.json({
          success: true,
          data: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          message: result?.error || 'Failed to fetch metrics',
          data: result?.data || {}
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch metrics'
      });
    }
  }

  /**
   * GET /warehouse/posted-transactions
   * Returns paginated list of POSTED transactions (headers only)
   * Query params: skip, take (default 50)
   */
  static async getPostedTransactions(req, res) {
    try {
      const skip = parseInt(req.query.skip || '0');
      const take = parseInt(req.query.take || '50');

      const result = await WarehouseService.getPostedTransactions(skip, take);
      
      if (result && result.success) {
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
          message: result?.error || 'Failed to fetch posted transactions',
          data: []
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch posted transactions'
      });
    }
  }

  /**
   * GET /warehouse/posted-transaction-details
   * Returns details for a specific posted transaction
   * Query params: transRefNo
   */
  static async getPostedTransactionDetails(req, res) {
    try {
      const { transRefNo } = req.query;

      if (!transRefNo) {
        return res.status(400).json({
          success: false,
          message: 'transRefNo is required'
        });
      }

      const result = await WarehouseService.getPostedTransactionDetails(transRefNo);
      
      if (result && result.success) {
        return res.json({
          success: true,
          data: result.data,
          count: result.count
        });
      } else {
        return res.status(500).json({
          success: false,
          message: result?.error || 'Failed to fetch posted transaction details',
          data: []
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch posted transaction details'
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
      
      if (result && result.success) {
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
          message: result?.error || 'Failed to fetch completed transactions',
          data: []
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch completed transactions'
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
      
      if (result && result.success) {
        return res.json({
          success: true,
          data: result.data,
          count: result.count,
          transRefNo
        });
      } else {
        return res.status(500).json({
          success: false,
          message: result?.error || 'Failed to fetch transaction details',
          data: []
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transaction details'
      });
    }
  }

  /**
   * GET /stock-balance
   * Returns current stock balance from inventory
   * Query params: locncode (optional, default 'PAWHRM')
   */
  static async getStockBalance(req, res) {
    try {
      const locncode = req.query.locncode || 'PAWHRM';

      const result = await WarehouseService.getStockBalance(locncode);
      
      if (result && result.success) {
        return res.json({
          success: true,
          data: result.data,
          count: result.count,
          locncode
        });
      } else {
        return res.status(500).json({
          success: false,
          message: result?.error || 'Failed to fetch stock balance',
          data: []
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stock balance'
      });
    }
  }
}

module.exports = WarehouseController;
