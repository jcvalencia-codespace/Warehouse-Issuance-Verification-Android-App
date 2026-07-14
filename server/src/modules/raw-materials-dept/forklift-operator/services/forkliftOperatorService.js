// server/src/modules/forklift-operator/services/forkliftOperatorService.js

const { getPool } = require('../../../../config/database');

class ForkliftOperatorService {
  /**
   * Get all forklift operators with optional filtering
   */
  static async getForkliftOperators(params = {}) {
    try {
      const pool = await getPool(process.env.DB_SFC);

      let query = `
        SELECT ROWID, FORKLIFT_OPERATOR, IS_ACTIVE, DATECREATED, CREATEDBY, MODIFIEDDATE, MODIFIEDBY
        FROM [SETTINGS.FORKLIFTOPERATOR]
        WHERE 1=1
      `;

      if (params.search) {
        query += ` AND FORKLIFT_OPERATOR LIKE '%${params.search}%'`;
      }

      if (params.isActive !== undefined) {
        query += ` AND IS_ACTIVE = ${params.isActive ? 1 : 0}`;
      }

      query += ` ORDER BY ROWID DESC`;

      const result = await pool.request().query(query);

      return {
        success: true,
        data: result.recordset || [],
        count: result.recordset.length
      };
    } catch (error) {
      console.error('Error fetching forklift operators:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch forklift operators',
        data: []
      };
    }
  }

  /**
   * Get forklift operator by ROWID
   */
  static async getForkliftOperatorById(rowId) {
    try {
      const pool = await getPool(process.env.DB_SFC);

      const query = `
        SELECT ROWID, FORKLIFT_OPERATOR, IS_ACTIVE, DATECREATED, CREATEDBY, MODIFIEDDATE, MODIFIEDBY
        FROM [SETTINGS.FORKLIFTOPERATOR]
        WHERE ROWID = @rowId
      `;

      const result = await pool.request()
        .input('rowId', rowId)
        .query(query);

      if (result.recordset.length === 0) {
        return {
          success: false,
          error: 'Forklift operator not found',
          data: null
        };
      }

      return {
        success: true,
        data: result.recordset[0]
      };
    } catch (error) {
      console.error('Error fetching forklift operator:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch forklift operator',
        data: null
      };
    }
  }

  /**
   * Create new forklift operator
   */
  static async createForkliftOperator(data, createdBy = 'SYSTEM') {
    try {
      const pool = await getPool(process.env.DB_SFC);

      const query = `
        INSERT INTO [SETTINGS.FORKLIFTOPERATOR] (FORKLIFT_OPERATOR, IS_ACTIVE, DATECREATED, CREATEDBY)
        VALUES (@forkliftOperator, @isActive, GETDATE(), @createdBy);
        
        SELECT SCOPE_IDENTITY() AS ROWID;
      `;

      const result = await pool.request()
        .input('forkliftOperator', data.FORKLIFT_OPERATOR)
        .input('isActive', data.IS_ACTIVE !== false ? 1 : 0)
        .input('createdBy', createdBy)
        .query(query);

      const newRowId = result.recordset[0].ROWID;

      return {
        success: true,
        data: {
          ROWID: newRowId,
          FORKLIFT_OPERATOR: data.FORKLIFT_OPERATOR,
          IS_ACTIVE: data.IS_ACTIVE !== false,
          DATECREATED: new Date().toISOString(),
          CREATEDBY: createdBy
        }
      };
    } catch (error) {
      console.error('Error creating forklift operator:', error);
      return {
        success: false,
        error: error.message || 'Failed to create forklift operator'
      };
    }
  }

  /**
   * Update forklift operator
   */
  static async updateForkliftOperator(rowId, data, modifiedBy = 'SYSTEM') {
    try {
      const pool = await getPool(process.env.DB_SFC);

      const updates = [];
      const request = pool.request();

      if (data.FORKLIFT_OPERATOR !== undefined) {
        updates.push('FORKLIFT_OPERATOR = @forkliftOperator');
        request.input('forkliftOperator', data.FORKLIFT_OPERATOR);
      }

      if (data.IS_ACTIVE !== undefined) {
        updates.push('IS_ACTIVE = @isActive');
        request.input('isActive', data.IS_ACTIVE ? 1 : 0);
      }

      if (updates.length === 0) {
        return {
          success: false,
          error: 'No fields to update'
        };
      }

      updates.push('MODIFIEDDATE = GETDATE()');
      updates.push('MODIFIEDBY = @modifiedBy');

      request.input('modifiedBy', modifiedBy);
      request.input('rowId', rowId);

      const query = `
        UPDATE [SETTINGS.FORKLIFTOPERATOR]
        SET ${updates.join(', ')}
        WHERE ROWID = @rowId;

        SELECT ROWID, FORKLIFT_OPERATOR, IS_ACTIVE, DATECREATED, CREATEDBY, MODIFIEDDATE, MODIFIEDBY
        FROM [SETTINGS.FORKLIFTOPERATOR]
        WHERE ROWID = @rowId
      `;

      const result = await request.query(query);

      if (result.recordset.length === 0) {
        return {
          success: false,
          error: 'Forklift operator not found'
        };
      }

      return {
        success: true,
        data: result.recordset[0]
      };
    } catch (error) {
      console.error('Error updating forklift operator:', error);
      return {
        success: false,
        error: error.message || 'Failed to update forklift operator'
      };
    }
  }

  /**
   * Delete forklift operator
   */
  static async deleteForkliftOperator(rowId) {
    try {
      const pool = await getPool(process.env.DB_SFC);

      const query = `
        DELETE FROM [SETTINGS.FORKLIFTOPERATOR]
        WHERE ROWID = @rowId;
        
        SELECT @@ROWCOUNT AS deletedCount;
      `;

      const result = await pool.request()
        .input('rowId', rowId)
        .query(query);

      if (result.recordset[0].deletedCount === 0) {
        return {
          success: false,
          error: 'Forklift operator not found'
        };
      }

      return {
        success: true,
        message: 'Forklift operator deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting forklift operator:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete forklift operator'
      };
    }
  }

  /**
   * Toggle forklift operator status
   */
  static async toggleStatus(rowId, isActive) {
    try {
      const pool = await getPool(process.env.DB_SFC);

      const query = `
        UPDATE [SETTINGS.FORKLIFTOPERATOR]
        SET IS_ACTIVE = @isActive, MODIFIEDDATE = GETDATE()
        WHERE ROWID = @rowId;

        SELECT ROWID, FORKLIFT_OPERATOR, IS_ACTIVE, DATECREATED, CREATEDBY, MODIFIEDDATE, MODIFIEDBY
        FROM [SETTINGS.FORKLIFTOPERATOR]
        WHERE ROWID = @rowId
      `;

      const result = await pool.request()
        .input('rowId', rowId)
        .input('isActive', isActive ? 1 : 0)
        .query(query);

      if (result.recordset.length === 0) {
        return {
          success: false,
          error: 'Forklift operator not found'
        };
      }

      return {
        success: true,
        data: result.recordset[0]
      };
    } catch (error) {
      console.error('Error toggling forklift operator status:', error);
      return {
        success: false,
        error: error.message || 'Failed to toggle status'
      };
    }
  }
}

module.exports = ForkliftOperatorService;