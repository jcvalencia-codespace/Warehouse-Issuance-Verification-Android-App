// server/src/modules/forklift-operator/controllers/forkliftOperatorController.js

const ForkliftOperatorService = require('../services/forkliftOperatorService');

const forkliftOperatorController = {
  /**
   * GET /api/forklift-operators
   * Get all forklift operators with optional filtering
   */
  async getForkliftOperators(req, res) {
    try {
      const { search, isActive } = req.query;

      const params = {};
      if (search) params.search = search;
      if (isActive !== undefined) params.isActive = isActive === 'true';

      const result = await ForkliftOperatorService.getForkliftOperators(params);

      if (!result.success) {
        return res.status(500).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in getForkliftOperators:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  },

  /**
   * GET /api/forklift-operators/:rowId
   * Get forklift operator by ROWID
   */
  async getForkliftOperatorById(req, res) {
    try {
      const { rowId } = req.params;

      const result = await ForkliftOperatorService.getForkliftOperatorById(parseInt(rowId));

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in getForkliftOperatorById:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  },

  /**
   * POST /api/forklift-operators
   * Create new forklift operator
   */
  async createForkliftOperator(req, res) {
    try {
      const { FORKLIFT_OPERATOR, IS_ACTIVE } = req.body;

      if (!FORKLIFT_OPERATOR) {
        return res.status(400).json({
          success: false,
          error: 'FORKLIFT_OPERATOR is required'
        });
      }

      const createdBy = req.user?.username || 'SYSTEM';

      const result = await ForkliftOperatorService.createForkliftOperator(
        { FORKLIFT_OPERATOR, IS_ACTIVE },
        createdBy
      );

      if (!result.success) {
        return res.status(500).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createForkliftOperator:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  },

  /**
   * PUT /api/forklift-operators/:rowId
   * Update forklift operator
   */
  async updateForkliftOperator(req, res) {
    try {
      const { rowId } = req.params;
      const { FORKLIFT_OPERATOR, IS_ACTIVE } = req.body;

      const modifiedBy = req.user?.username || 'SYSTEM';

      const result = await ForkliftOperatorService.updateForkliftOperator(
        parseInt(rowId),
        { FORKLIFT_OPERATOR, IS_ACTIVE },
        modifiedBy
      );

      if (!result.success) {
        return res.status(500).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in updateForkliftOperator:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  },

  /**
   * DELETE /api/forklift-operators/:rowId
   * Delete forklift operator
   */
  async deleteForkliftOperator(req, res) {
    try {
      const { rowId } = req.params;

      const result = await ForkliftOperatorService.deleteForkliftOperator(parseInt(rowId));

      if (!result.success) {
        return res.status(500).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in deleteForkliftOperator:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  },

  /**
   * PATCH /api/forklift-operators/:rowId/toggle-status
   * Toggle forklift operator status
   */
  async toggleStatus(req, res) {
    try {
      const { rowId } = req.params;
      const { IS_ACTIVE } = req.body;

      if (IS_ACTIVE === undefined) {
        return res.status(400).json({
          success: false,
          error: 'IS_ACTIVE is required'
        });
      }

      const result = await ForkliftOperatorService.toggleStatus(
        parseInt(rowId),
        IS_ACTIVE
      );

      if (!result.success) {
        return res.status(500).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in toggleStatus:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  }
};

module.exports = forkliftOperatorController;