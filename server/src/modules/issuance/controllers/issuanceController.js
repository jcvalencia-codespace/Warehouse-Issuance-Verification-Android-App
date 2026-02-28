// server/src/modules/issuance/controllers/issuanceController.js
const { getPool } = require('../../../config/database');

/**
 * Allocate bags from inventory using FIFO method
 */
exports.allocateBags = async (req, res) => {
  try {
    const { requiredBags, area, itemNumber } = req.body;

    // Validate required parameters
    if (!requiredBags || requiredBags <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid number of bags is required'
      });
    }

    if (!area) {
      return res.status(400).json({
        success: false,
        message: 'Area is required'
      });
    }

    if (!itemNumber) {
      return res.status(400).json({
        success: false,
        message: 'Item number is required'
      });
    }

    const dbName = process.env.DB_SFC || 'SFC';
    const pool = await getPool(dbName);

    // Build WHERE clause based on parameters - filter by both area AND itemNumber
    let whereClause = `D.AREA = '${area}'`;
    whereClause += ` AND (D.BAGS_RECV - D.BAGS_ALLOC - D.BAGS_ISS + D.BAGS_RET - D.BAGS_SAL - D.BAGS_ADJ) > 0`;
    whereClause += ` AND D.ITEMNMBR = '${itemNumber}'`;

    // Execute the FIFO allocation query
    const query = `
      DECLARE @RequiredBags INT = ${parseInt(requiredBags)};
      
      ;WITH TABLE1 AS
      (
          SELECT  D.AREA, D.LOTNUMBER, D.ITEMNMBR, D.UOFM, D.REMARKS, D.QM_IDNUMBER
              , CAST(QUANTITY_RECV * 1.0 / BAGS_RECV AS DECIMAL(18,8)) AS AVEWT
      
              , (BAGS_RECV + BAGS_RET) 
              - (BAGS_ALLOC + BAGS_ISS + BAGS_SAL + BAGS_ADJ) AS [AVAILABLE BAGS]
      
              , (QUANTITY_RECV - QUANTITY_ALLOC - QUANTITY_ISS 
               + QUANTITY_RET - QUANTITY_SAL - QUANTITY_ADJ) AS [AVAILABLE KGS]
      
              , DATETRANS, H.REFERENCENO, D.LINENUMBER
          FROM [INVENTORY.QUANTITYMASTER3.HEADER] H 
          INNER JOIN [INVENTORY.QUANTITYMASTER3.DETAILS] D 
              ON H.QM_IDNUMBER = D.QM_IDNUMBER
          WHERE ${whereClause}
      ),
      RUNNING AS
      (
          SELECT *,
                 SUM([AVAILABLE BAGS]) OVER (
                     ORDER BY DATETRANS, REFERENCENO, LINENUMBER
                     ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                 ) AS RunningTotal
          FROM TABLE1
      ),
      ALLOCATE AS
      (
          SELECT *,
              CASE 
                  WHEN RunningTotal <= @RequiredBags 
                      THEN [AVAILABLE BAGS]
      
                  WHEN RunningTotal - [AVAILABLE BAGS] < @RequiredBags 
                      THEN @RequiredBags - (RunningTotal - [AVAILABLE BAGS])
      
                  ELSE 0
              END AS BagsToTake
          FROM RUNNING
      )
      SELECT
      AREA, LOTNUMBER, ITEMNMBR, UOFM, REMARKS, QM_IDNUMBER,
          AVEWT,
          [AVAILABLE BAGS],
          [AVAILABLE KGS],
      
          CASE WHEN BagsToTake > 0 
               THEN BagsToTake 
               ELSE NULL 
          END AS BAGS,
      
          CASE WHEN BagsToTake > 0 
               THEN (BagsToTake * 1.0 / [AVAILABLE BAGS]) * [AVAILABLE KGS]
               ELSE NULL 
          END AS KGS,
      
          CASE WHEN BagsToTake > 0 
               THEN 'TRUE'
               ELSE 'FALSE'
          END AS TAG
      
      FROM ALLOCATE
      ORDER BY DATETRANS, REFERENCENO, LINENUMBER;
    `;

    const result = await pool.request().query(query);

    // Calculate summary
    const data = result.recordset;
    const allocatedItems = data.filter(item => item.BAGS !== null);
    const totalBags = allocatedItems.reduce((sum, item) => sum + (item.BAGS || 0), 0);
    const totalKgs = allocatedItems.reduce((sum, item) => sum + (item.KGS || 0), 0);
    const totalAvailableBags = data.reduce((sum, item) => sum + item['AVAILABLE BAGS'], 0);

    res.json({
      success: true,
      data: data,
      totalAvailableBags,
      totalAvailableKgs: data.reduce((sum, item) => sum + item['AVAILABLE KGS'], 0),
      summary: {
        required: requiredBags,
        allocated: totalBags,
        allocatedKgs: totalKgs,
        available: totalAvailableBags,
        lotsUsed: allocatedItems.length
      }
    });

  } catch (error) {
    console.error('Error allocating bags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to allocate bags',
      error: error.message
    });
  }
};

/**
 * Post issuance verification
 */
exports.postIssuance = async (req, res) => {
  try {
    const { 
      transactionRefNumber, 
      area, 
      numberOfBags, 
      weightInKg,
      allocations 
    } = req.body;

    if (!transactionRefNumber || !area || !numberOfBags || !weightInKg) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // TODO: Implement actual posting logic with database
    // This would involve inserting into the appropriate tables
    
    res.json({
      success: true,
      message: 'Issuance posted successfully',
      data: {
        transactionRefNumber,
        area,
        numberOfBags,
        weightInKg,
        allocatedLots: allocations?.length || 0
      }
    });

  } catch (error) {
    console.error('Error posting issuance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post issuance',
      error: error.message
    });
  }
};

/**
 * Get list of areas from inventory
 */
exports.getAreas = async (req, res) => {
  try {
    const dbName = process.env.DB_SFC || 'SFC';
    const pool = await getPool(dbName);

    const query = `
      SELECT DISTINCT D.AREA 
      FROM [INVENTORY.QUANTITYMASTER3.HEADER] H 
      INNER JOIN [INVENTORY.QUANTITYMASTER3.DETAILS] D 
          ON H.QM_IDNUMBER = D.QM_IDNUMBER
      WHERE H.LOCNCODE = 'PAWHRM' 
        AND (D.BAGS_RECV - D.BAGS_ALLOC - D.BAGS_ISS + D.BAGS_RET - D.BAGS_SAL - D.BAGS_ADJ) > 0
      ORDER BY D.AREA
    `;

    const result = await pool.request().query(query);
    
    const areas = result.recordset
      .filter(row => row.AREA)
      .map(row => ({
        label: row.AREA.trim(),
        value: row.AREA.trim()
      }));

    res.json({
      success: true,
      data: areas
    });

  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch areas',
      error: error.message
    });
  }
};

/**
 * Get list of item numbers by area
 */
exports.getItemsByArea = async (req, res) => {
  try {
    const { area } = req.params;
    
    if (!area) {
      return res.status(400).json({
        success: false,
        message: 'Area is required'
      });
    }

    const dbName = process.env.DB_SFC || 'SFC';
    const pool = await getPool(dbName);

    const query = `
      SELECT DISTINCT D.ITEMNMBR 
      FROM [INVENTORY.QUANTITYMASTER3.HEADER] H 
      INNER JOIN [INVENTORY.QUANTITYMASTER3.DETAILS] D 
          ON H.QM_IDNUMBER = D.QM_IDNUMBER
      WHERE H.LOCNCODE = 'PAWHRM' 
        AND D.AREA = @area
        AND (D.BAGS_RECV - D.BAGS_ALLOC - D.BAGS_ISS + D.BAGS_RET - D.BAGS_SAL - D.BAGS_ADJ) > 0
      ORDER BY D.ITEMNMBR
    `;

    const result = await pool.request()
      .input('area', area)
      .query(query);
    
    const items = result.recordset
      .filter(row => row.ITEMNMBR)
      .map(row => ({
        label: row.ITEMNMBR.trim(),
        value: row.ITEMNMBR.trim()
      }));

    res.json({
      success: true,
      data: items
    });

  } catch (error) {
    console.error('Error fetching items by area:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch items',
      error: error.message
    });
  }
};
