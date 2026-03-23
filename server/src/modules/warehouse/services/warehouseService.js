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

      // Get current date (start of day) - use local time to match database
      const now = new Date();
      // Format as YYYY-MM-DD in local time (Taiwan timezone)
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayString = `${year}-${month}-${day}`;

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
      // console.error('Error fetching warehouse metrics:', error);
      // return {
      //   success: false,
      //   error: error.message || 'Failed to fetch metrics',
      //   data: {
      //     pendingCount: 0,
      //     completedToday: 0,
      //     totalTransactions: 0
      //   }
      // };
    }
  }

  /**
   * Get posted (completed) transaction headers with pagination
   */
  static async getPostedTransactions(skip = 0, take = 50) {
    try {
      const pool = await getPool(process.env.DB_SFC);

      const query = `
        SELECT TRANSREFNO, ISSUEDBY, DATETRANS, TRANSTYPE,  FROMCOMPANY, FROMLOCNCODE, FROMTRANSNO, RECEIVEDBY
        FROM [INVENTORY.QUANTITYMASTER4.HEADER]
        WHERE LOCNCODE = 'OPPREP' AND FROMLOCNCODE = 'PAWHRM' AND POSTSTATUS = 1
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
      console.error('Error fetching posted transactions:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch posted transactions',
        data: []
      };
    }
  }

  /**
   * Get posted transaction details by TRANSREFNO
   */
  static async getPostedTransactionDetails(transRefNo) {
    try {
      const pool = await getPool(process.env.DB_SFC);

      const query = `
        SELECT QH.TRANSREFNO, QH.FROMCOMPANY, QH.FROMLOCNCODE, QH.FROMTRANSNO, QH.DATETRANS, QH.TRANSTYPE, QD.REFERENCENO, QD.LOTNUMBER, QD.ITEMNMBR, QD.QUANTITY_TRANS, QD.BAG_TRANS, 
        QD.QUANTITY_RECV, QD.BAGS_RECV
        FROM [INVENTORY.QUANTITYMASTER4.HEADER] AS QH INNER JOIN
        [INVENTORY.QUANTITYMASTER4.DETAILS] AS QD ON QH.TRANSREFNO = QD.TRANSREFNO
        WHERE QH.TRANSREFNO = @transRefNo
        ORDER BY QD.ITEMNMBR, QD.REFERENCENO, QD.QUANTITY_TRANS
      `;

      const result = await pool.request()
        .input('transRefNo', transRefNo)
        .query(query);

      return {
        success: true,
        data: result.recordset || [],
        count: result.recordset.length
      };
    } catch (error) {
      console.error('Error fetching posted transaction details:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch posted transaction details',
        data: []
      };
    }
  }

  static async getPendingTransactions(skip = 0, take = 50) {
    try {
      const pool = await getPool(process.env.DB_SFC);

      const query = `
        SELECT 
          QMH4ROWID, POSTSTATUS, TRANSREFNO, REFERENCENO, ITEMNMBR, ISSUEDBY, 
          DATETRANS, TRANSTYPE, UOFM, QUANTITY_TRANS, BAG_TRANS, 
          UNITCOST, FROMCOMPANY, FROMTRANSNO, FROMLOCNCODE
        FROM (
          SELECT 
            IQMH.QMH4ROWID,  
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
        ORDER BY QMH4ROWID DESC
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
      // console.error('Error fetching pending transactions:', error);
      // return {
      //   success: false,
      //   error: error.message || 'Failed to fetch pending transactions',
      //   data: []
      // };
    }
  }

  /**
   * Get completed transactions for today
   */
  static async getCompletedTransactionToday(skip = 0, take = 50) {
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
        WHERE rn = 1 AND CAST(DATETRANS AS DATE) = CAST(GETDATE() AS DATE)
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
        error: error.message || 'Failed to fetch completed transactions today',
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

  /**
   * Get current stock balance
   * Returns available bags and kgs from inventory
   */
  static async getStockBalance(locncode = 'PAWHRM') {
    try {
      const pool = await getPool(process.env.DB_SFC);

      const query = `
        SELECT  D.AREA, D.ITEMNMBR, D.REMARKS, D.LOTNUMBER, D.UOFM
        , CONVERT(DECIMAL(18,3), (CAST(QUANTITY_RECV * 1.0 / BAGS_RECV AS DECIMAL(18,8)))) AS AVEWT
		, ((BAGS_RECV + BAGS_RET) - (BAGS_ALLOC + BAGS_ISS + BAGS_SAL + BAGS_ADJ)) AS [AVAILABLE BAGS]
		, CONVERT(DECIMAL(18,3), ((QUANTITY_RECV - QUANTITY_ALLOC - QUANTITY_ISS 
         + QUANTITY_RET - QUANTITY_SAL - QUANTITY_ADJ))) AS [AVAILABLE KGS]
    FROM [INVENTORY.QUANTITYMASTER3.HEADER] H 
    INNER JOIN [INVENTORY.QUANTITYMASTER3.DETAILS] D 
        ON H.QM_IDNUMBER = D.QM_IDNUMBER
    WHERE H.LOCNCODE = '${locncode}' 
      AND (D.BAGS_RECV - D.BAGS_ALLOC - D.BAGS_ISS + D.BAGS_RET - D.BAGS_SAL - D.BAGS_ADJ) > 0 
ORDER BY D.AREA, D.ITEMNMBR, H.DATETRANS, D.LINENUMBER
      `;

      const result = await pool.request().query(query);

      return {
        success: true,
        data: result.recordset || [],
        count: result.recordset.length
      };
    } catch (error) {
      console.error('Error fetching stock balance:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch stock balance',
        data: []
      };
    }
  }
}

module.exports = WarehouseService;
