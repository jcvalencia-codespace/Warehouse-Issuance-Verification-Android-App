// server/src/modules/warehouse/services/warehouseService.js

const { getPool } = require('../../../config/database');

class WarehouseService {
  /**
   * Get warehouse metrics for dashboard
   * Returns:
   * - pendingCount: NOT POSTED transactions
   * - completedToday: Transactions with DATETRANS = today
   * - totalTransactions: Count of all transactions
   */
  static async getMetrics() {
    try {
      const pool = await getPool(process.env.DB_SFC);
      
      // Get current date (start of day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toISOString().split('T')[0];
      
      // Query for all metrics
      const query = `
        SELECT 
          SUM(CASE WHEN POSTSTATUS = 'NOT POSTED' THEN 1 ELSE 0 END) as pendingCount,
          SUM(CASE WHEN CAST(DATETRANS AS DATE) = CAST('${todayString}' AS DATE) THEN 1 ELSE 0 END) as completedToday,
          COUNT(*) as totalTransactions
        FROM (
          SELECT 
            CASE WHEN IQMH.POSTSTATUS = 0 THEN 'NOT POSTED'
            ELSE 'POSTED'
            END AS POSTSTATUS,
            IQMD.TRANSREFNO, IQMH.DATETRANS,
            ROW_NUMBER() OVER (PARTITION BY IQMD.TRANSREFNO ORDER BY IQMD.REFERENCENO) AS rn
          FROM [INVENTORY.QUANTITYMASTER4.HEADER] AS IQMH 
          INNER JOIN [INVENTORY.QUANTITYMASTER4.DETAILS] AS IQMD 
            ON IQMH.TRANSREFNO = IQMD.TRANSREFNO
        ) ranked
        WHERE rn = 1
      `;

      const result = await pool.request().query(query);
      
      const metrics = result.recordset[0] || {};
      
      return {
        success: true,
        data: {
          pendingCount: metrics.pendingCount || 0,
          completedToday: metrics.completedToday || 0,
          totalTransactions: metrics.totalTransactions || 0,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error fetching warehouse metrics:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch metrics',
        data: {
          pendingCount: 0,
          completedToday: 0,
          totalTransactions: 0
        }
      };
    }
  }

  /**
   * Get pending (not posted) transactions with pagination
   */
  static async getPendingTransactions(skip = 0, take = 50) {
    try {
      const pool = await getPool(process.env.DB_SFC);
      
      const query = `
        SELECT 
          POSTSTATUS, TRANSREFNO, REFERENCENO, ITEMNMBR, ISSUEDBY, 
          DATETRANS, TRANSTYPE, UOFM, QUANTITY_TRANS, BAG_TRANS, 
          UNITCOST, FROMCOMPANY, FROMTRANSNO, FROMLOCNCODE
        FROM (
          SELECT 
            CASE WHEN IQMH.POSTSTATUS = 0 THEN 'NOT POSTED'
            ELSE 'POSTED'
            END AS POSTSTATUS,
            IQMD.TRANSREFNO, IQMD.REFERENCENO, IQMD.ITEMNMBR, IQMH.ISSUEDBY, 
            IQMH.DATETRANS, IQMH.TRANSTYPE, IQMD.UOFM, IQMD.QUANTITY_TRANS, 
            IQMD.BAG_TRANS, IQMD.UNITCOST, IQMH.FROMCOMPANY, IQMH.FROMTRANSNO, 
            IQMH.FROMLOCNCODE,
            ROW_NUMBER() OVER (PARTITION BY IQMD.TRANSREFNO ORDER BY IQMD.REFERENCENO) AS rn
          FROM [INVENTORY.QUANTITYMASTER4.HEADER] AS IQMH 
          INNER JOIN [INVENTORY.QUANTITYMASTER4.DETAILS] AS IQMD 
            ON IQMH.TRANSREFNO = IQMD.TRANSREFNO
        ) ranked
        WHERE rn = 1 AND POSTSTATUS = 'NOT POSTED'
        ORDER BY DATETRANS DESC
        OFFSET ${skip} ROWS
        FETCH NEXT ${take} ROWS ONLY
      `;

      const result = await pool.request().query(query);
      
      return {
        success: true,
        data: result.recordset || [],
        count: result.recordset.length
      };
    } catch (error) {
      console.error('Error fetching pending transactions:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch pending transactions',
        data: []
      };
    }
  }

  /**
   * Get completed transactions for today
   */
  static async getCompletedTransactionToday(skip = 0, take = 50) {
    try {
      const pool = await getPool(process.env.DB_SFC);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toISOString().split('T')[0];
      
      const query = `
        SELECT 
          POSTSTATUS, TRANSREFNO, REFERENCENO, ITEMNMBR, ISSUEDBY, 
          DATETRANS, TRANSTYPE, UOFM, QUANTITY_TRANS, BAG_TRANS, 
          UNITCOST, FROMCOMPANY, FROMTRANSNO, FROMLOCNCODE
        FROM (
          SELECT 
            CASE WHEN IQMH.POSTSTATUS = 0 THEN 'NOT POSTED'
            ELSE 'POSTED'
            END AS POSTSTATUS,
            IQMD.TRANSREFNO, IQMD.REFERENCENO, IQMD.ITEMNMBR, IQMH.ISSUEDBY, 
            IQMH.DATETRANS, IQMH.TRANSTYPE, IQMD.UOFM, IQMD.QUANTITY_TRANS, 
            IQMD.BAG_TRANS, IQMD.UNITCOST, IQMH.FROMCOMPANY, IQMH.FROMTRANSNO, 
            IQMH.FROMLOCNCODE,
            ROW_NUMBER() OVER (PARTITION BY IQMD.TRANSREFNO ORDER BY IQMD.REFERENCENO) AS rn
          FROM [INVENTORY.QUANTITYMASTER4.HEADER] AS IQMH 
          INNER JOIN [INVENTORY.QUANTITYMASTER4.DETAILS] AS IQMD 
            ON IQMH.TRANSREFNO = IQMD.TRANSREFNO
        ) ranked
        WHERE rn = 1 AND CAST(DATETRANS AS DATE) = CAST('${todayString}' AS DATE)
        ORDER BY DATETRANS DESC
        OFFSET ${skip} ROWS
        FETCH NEXT ${take} ROWS ONLY
      `;

      const result = await pool.request().query(query);
      
      return {
        success: true,
        data: result.recordset || [],
        count: result.recordset.length
      };
    } catch (error) {
      console.error('Error fetching completed transactions today:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch completed transactions',
        data: []
      };
    }
  }

  /**
   * Get transaction details for warehouse confirmation
   * Returns item details for a specific TRANSREFNO
   */
  static async getTransactionDetails(transRefNo) {
    try {
      const pool = await getPool(process.env.DB_SFC);
      
      const query = `
        SELECT 
          QM4DROWID, 
          ITEMNMBR AS 'ITEM CODE', 
          LOTNUMBER AS 'LOT NUMBER', 
          UOFM, 
          ROUND(QUANTITY_TRANS, 3) AS 'QUANTITY ISS.', 
          ROUND(BAG_TRANS, 3) AS 'BAGS ISS.', 
          ROUND(UNITCOST, 3) AS 'UNITCOST', 
          QUANTITY_RECV AS 'QUANTITY RECEIVED', 
          BAGS_RECV AS 'BAGS RECEIVED',
          ACTUAL_UNITCOST
        FROM [INVENTORY.QUANTITYMASTER4.DETAILS] 
        WHERE TRANSREFNO = '${transRefNo}'
        ORDER BY QM4DROWID
      `;

      const result = await pool.request().query(query);
      
      return {
        success: true,
        data: result.recordset || [],
        count: result.recordset.length
      };
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch transaction details',
        data: []
      };
    }
  }
}

module.exports = WarehouseService;
