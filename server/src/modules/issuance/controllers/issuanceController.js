// server/src/modules/issuance/controllers/issuanceController.js
const { getPool } = require('../../../config/database');

/**
 * Allocate bags from inventory using FIFO method
 */
exports.allocateBags = async (req, res) => {
  try {
    const { requiredBags, area, itemNumber, lotNumber, itemRemarks, date } = req.body;

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

    // Add date filter if provided - filter transactions on or before the given date
    if (date) {
      whereClause += ` AND H.DATETRANS <= '${date}'`;
    }

    // Add remarks filter - always filter by remarks to ensure correct item+remarks combination
    if (itemRemarks && itemRemarks.trim() !== '') {
      // If remarks provided, filter by that specific remarks
      whereClause += ` AND D.REMARKS = '${itemRemarks}'`;
    } else {
      // If no remarks selected, only allocate from lots with NULL/empty remarks
      whereClause += ` AND (D.REMARKS IS NULL OR D.REMARKS = '')`;
    }

    // Add lot number filter if provided
    if (lotNumber) {
      whereClause += ` AND D.LOTNUMBER = '${lotNumber}'`;
    }

    // Execute the FIFO allocation query
    const query = `
      DECLARE @RequiredBags INT = ${parseInt(requiredBags)};
      
      ;WITH TABLE1 AS
      (
          SELECT  D.AREA, D.LOTNUMBER, D.ITEMNMBR, D.UOFM, D.REMARKS, D.QM_IDNUMBER
              , CAST(QUANTITY_RECV * 1.0 / BAGS_RECV AS DECIMAL(18,8)) AS AVEWT
              , CASE WHEN D.AMOUNT = 0 THEN M_COST ELSE D.AMOUNT END AS AMOUNT
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
          AMOUNT, AVEWT,
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
  const dbName = process.env.DB_SFC || 'SFC';
  const pool = await getPool(dbName);

  try {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const {
      transactionRefNumber,
      area,
      palletWeight,
      numberOfBags,
      weightInKg,
      allocations,
      username,
      forkliftOperator,
      floorScale,
      transType,
      date
    } = req.body;

    if (!transactionRefNumber || !area || !numberOfBags || !weightInKg || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    if (!allocations || allocations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No allocations provided'
      });
    }

    // Get the first allocation (should only be 1 lot based on validation)
    const allocation = allocations[0];

    // Get next IDs
    const issIdNumberResult = await pool.request().query(
      'SELECT MAX((ISS_IDNUMBER) + 1) AS NEXT_ID FROM [INVENTORY.ISSUANCE.HEADER5]'
    );
    const issIdNumber = issIdNumberResult.recordset[0].NEXT_ID || 1;

    // Get next TRANSREFNO from QUANTITYMASTER4.HEADER
    const transRefNoResult = await pool.request().query(
      'SELECT MAX((TRANSREFNO) + 1) AS NEXT_REF FROM [INVENTORY.QUANTITYMASTER4.HEADER]'
    );
    let transRefNo = transRefNoResult.recordset[0].NEXT_REF;

    // If NEXT_REF is NULL (table is empty or has NULL values), start from 1
    if (transRefNo === null || transRefNo === undefined) {
      transRefNo = 1;
    }

    // Use the selected date or default to current date
    const dateIssued = date
      ? `${date} ${new Date().toTimeString().slice(0, 8)}`
      : new Date().toISOString().replace('T', ' ').slice(0, 19);

    const dateCreated = `${new Date().toISOString().replace('T', ' ').slice(0, 10)} ${new Date().toTimeString().slice(0, 8)}`;

    // Check for duplicate using transactionRefNumber and allocation lot
    const checkDuplicate = await pool.request().query(`
      SELECT TOP 1 H.TRANSREFNO 
      FROM [INVENTORY.QUANTITYMASTER4.HEADER] H
      INNER JOIN [INVENTORY.QUANTITYMASTER4.DETAILS] D ON H.TRANSREFNO = D.TRANSREFNO
      WHERE D.LOTNUMBER = '${allocation.LOTNUMBER}' 
        AND H.TRANSREFNO = '${transactionRefNumber}'
        AND D.TRANSREFNO = '${transactionRefNumber}'
        AND D.ITEMNMBR = '${allocation.ITEMNMBR}'
        AND H.DATETRANS = '${dateIssued}'
    `);

    if (checkDuplicate.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This issuance has already been processed. Please check your records.',
        duplicate: true,
        existingTransRefNo: checkDuplicate.recordset[0].TRANSREFNO
      });
    }

    // Use transaction for all database operations
    const transaction = pool.transaction();
    let isCommitted = false;
    await transaction.begin();

    try {
      // Insert into ISSUANCE.HEADER5
      await transaction.request().query(`
        INSERT INTO [INVENTORY.ISSUANCE.HEADER5] (LOCNCODE, ISS_IDNUMBER, DATEISSUED, ISSUANCETYPE, DEPARTMENT, REQUESTEDBY, POSTSTATUS, CREATEDBY, DATECREATED)
        VALUES ('PAWHRM', ${issIdNumber}, '${dateIssued}', 'Issued', '${floorScale}', 'MIPA', '1', '${username}', GETDATE())
      `);

      // Insert into ISSUANCE.DETAILS5
      await transaction.request().query(`
        INSERT INTO [INVENTORY.ISSUANCE.DETAILS5] (ISS_IDNUMBER, ISSUANCETYPE, DETAILS, AREA, LOTNUMBER, ITEMNMBR, UOFM, REMARKS, QM_IDNUMBER, AMOUNT, BAGS, QUANTITY)
        VALUES (${issIdNumber}, 'None', 'None', '${allocation.AREA}', '${allocation.LOTNUMBER}', '${allocation.ITEMNMBR}', '${allocation.UOFM}', '${allocation.REMARKS || ''}', ${allocation.QM_IDNUMBER}, '0.00000', ${numberOfBags}, ${allocation.KGS})
      `);

      // Update QUANTITYMASTER3.DETAILS - use form input weight and bags
      await transaction.request().query(`
        UPDATE [INVENTORY.QUANTITYMASTER3.DETAILS] 
        SET QUANTITY_ISS = QUANTITY_ISS + ${allocation.KGS},
            BAGS_ISS = BAGS_ISS + ${numberOfBags}
        WHERE LOTNUMBER = '${allocation.LOTNUMBER}' AND QM_IDNUMBER = ${allocation.QM_IDNUMBER}
      `);

      // Insert into QUANTITYMASTER4.HEADER
      await transaction.request().query(`
        INSERT INTO [INVENTORY.QUANTITYMASTER4.HEADER] (LOCNCODE, FROMCOMPANY, FROMLOCNCODE, FROMTRANSNO, ISSUEDBY, DATETRANS, TRANSTYPE, TRANSREFNO, RECEIVEDBY, DATERECEIVED, POSTSTATUS)
        VALUES ('OPPREP', 'SFC', 'PAWHRM', ${issIdNumber}, '${username}', '${dateIssued}', '${transType}', ${transRefNo}, '${forkliftOperator}', '${dateIssued}', 1)
      `);

      // Calculate actual unit cost - use allocation AMOUNT
      const unitCost = allocation.AMOUNT || 0;
      const actualQuantity = (weightInKg - palletWeight);
      const actualBags = numberOfBags || 0;
      const calculatedActualUnitCost = ((allocation.KGS * unitCost) / actualQuantity);

      // Insert into QUANTITYMASTER4.DETAILS - use form input weight and bags
      await transaction.request().query(`
        INSERT INTO [INVENTORY.QUANTITYMASTER4.DETAILS] (TRANSREFNO, FROMISSUANCENOID, REFERENCENO, LOTNUMBER, ITEMNMBR, 
                                                          REMARKS, UOFM, PALLETWEIGHT, QUANTITY_TRANS, BAG_TRANS, 
                                                          UNITCOST, QUANTITY_RECV, BAGS_RECV, ACTUAL_UNITCOST)
        VALUES (${transRefNo}, ${issIdNumber}, '${allocation.QM_IDNUMBER}', '${allocation.LOTNUMBER}', '${allocation.ITEMNMBR}',
               '${allocation.REMARKS}', '${allocation.UOFM}', ${palletWeight}, ${allocation.KGS}, ${numberOfBags}, 
                ${unitCost}, ${actualQuantity}, ${actualBags}, ${calculatedActualUnitCost})
      `);

      // Commit transaction
      await transaction.commit();
      isCommitted = true;

      console.log('Issuance posted successfully:', { clientIP, issIdNumber, transRefNo, dateIssued, dateCreated });
      res.json({
        success: true,
        message: 'Issuance posted successfully',
        data: {
          issIdNumber,
          transRefNo,
          dateTrans: dateIssued,
          transactionRefNumber,
          area,
          numberOfBags,
          weightInKg,
          allocatedLots: allocations.length
        }
      });
    } catch (transactionError) {
      // Rollback on error only if not already committed
      if (!isCommitted) {
        await transaction.rollback();
      }
      throw transactionError;
    }

  } catch (error) {
    console.error('Error posting issuance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post issuance: ' + error.message,
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
 * Get list of all item numbers (without area filter)
 */
exports.getAllItems = async (req, res) => {
  try {
    const dbName = process.env.DB_SFC || 'SFC';
    const pool = await getPool(dbName);

    const query = `
      SELECT DISTINCT D.ITEMNMBR, ISNULL(D.REMARKS, '') AS REMARKS, MIN(D.LOTNUMBER) AS LOTNUMBER
      FROM [INVENTORY.QUANTITYMASTER3.HEADER] H 
      INNER JOIN [INVENTORY.QUANTITYMASTER3.DETAILS] D 
          ON H.QM_IDNUMBER = D.QM_IDNUMBER
      WHERE H.LOCNCODE = 'PAWHRM' 
        AND (D.BAGS_RECV - D.BAGS_ALLOC - D.BAGS_ISS + D.BAGS_RET - D.BAGS_SAL - D.BAGS_ADJ) > 0
      GROUP BY D.ITEMNMBR, D.REMARKS
      ORDER BY D.ITEMNMBR
    `;

    const result = await pool.request().query(query);

    const items = result.recordset
      .map(row => ({
        label: row.ITEMNMBR.trim(),
        value: row.REMARKS && row.REMARKS.trim()
          ? `${row.ITEMNMBR.trim()}-${row.REMARKS.trim()}`
          : row.ITEMNMBR.trim(),
        remarks: row.REMARKS && row.REMARKS.trim() ? row.REMARKS.trim() : undefined,
        lotNumber: row.LOTNUMBER ? row.LOTNUMBER.trim() : undefined
      }))
      .filter((item, index, self) =>
        index === self.findIndex(t => t.value === item.value)
      );

    res.json({
      success: true,
      data: items
    });

  } catch (error) {
    console.error('Error fetching all items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch items',
      error: error.message
    });
  }
};

/**
 * Get list of areas by item number
 */
exports.getAreasByItem = async (req, res) => {
  try {
    const { itemNumber } = req.params;
    const { itemRemarks } = req.query;

    if (!itemNumber) {
      return res.status(400).json({
        success: false,
        message: 'Item number is required'
      });
    }

    const dbName = process.env.DB_SFC || 'SFC';
    const pool = await getPool(dbName);

    let query = `
      SELECT DISTINCT D.AREA
      FROM [INVENTORY.QUANTITYMASTER3.HEADER] H 
      INNER JOIN [INVENTORY.QUANTITYMASTER3.DETAILS] D 
          ON H.QM_IDNUMBER = D.QM_IDNUMBER
      WHERE H.LOCNCODE = 'PAWHRM' 
        AND D.ITEMNMBR = @itemNumber
        AND (D.BAGS_RECV - D.BAGS_ALLOC - D.BAGS_ISS + D.BAGS_RET - D.BAGS_SAL - D.BAGS_ADJ) > 0
    `;

    if (itemRemarks && itemRemarks.trim() !== '') {
      query += ` AND D.REMARKS = @itemRemarks`;
    } else {
      query += ` AND (D.REMARKS IS NULL OR D.REMARKS = '')`;
    }

    query += ` ORDER BY D.AREA`;

    const request = pool.request()
      .input('itemNumber', itemNumber);

    if (itemRemarks) {
      request.input('itemRemarks', itemRemarks);
    }

    const result = await request.query(query);

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
    console.error('Error fetching areas by item:', error);
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
      SELECT D.ITEMNMBR, ISNULL(D.REMARKS, '') AS REMARKS, MIN(D.LOTNUMBER) AS LOTNUMBER
      FROM [INVENTORY.QUANTITYMASTER3.HEADER] H 
      INNER JOIN [INVENTORY.QUANTITYMASTER3.DETAILS] D 
          ON H.QM_IDNUMBER = D.QM_IDNUMBER
      WHERE H.LOCNCODE = 'PAWHRM' 
        AND D.AREA = @area
        AND (D.BAGS_RECV - D.BAGS_ALLOC - D.BAGS_ISS + D.BAGS_RET - D.BAGS_SAL - D.BAGS_ADJ) > 0
      GROUP BY D.ITEMNMBR, D.REMARKS
      ORDER BY D.ITEMNMBR
    `;

    const result = await pool.request()
      .input('area', area)
      .query(query);

    const items = result.recordset
      .map(row => ({
        label: row.ITEMNMBR.trim(),
        value: row.REMARKS && row.REMARKS.trim()
          ? `${row.ITEMNMBR.trim()}-${row.REMARKS.trim()}`
          : row.ITEMNMBR.trim(),
        remarks: row.REMARKS && row.REMARKS.trim() ? row.REMARKS.trim() : undefined,
        lotNumber: row.LOTNUMBER ? row.LOTNUMBER.trim() : undefined
      }))
      .filter((item, index, self) =>
        index === self.findIndex(t => t.value === item.value)
      );

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

/**
 * Get list of lot numbers by area and optionally by item number
 */
exports.getLotsByArea = async (req, res) => {
  try {
    const { area } = req.params;
    const { itemNumber, itemRemarks } = req.query;

    if (!area) {
      return res.status(400).json({
        success: false,
        message: 'Area is required'
      });
    }

    const dbName = process.env.DB_SFC || 'SFC';
    const pool = await getPool(dbName);

    // Base query
    let query = `
      SELECT DISTINCT D.LOTNUMBER, D.ITEMNMBR, D.REMARKS
      FROM [INVENTORY.QUANTITYMASTER3.HEADER] H 
      INNER JOIN [INVENTORY.QUANTITYMASTER3.DETAILS] D 
          ON H.QM_IDNUMBER = D.QM_IDNUMBER
      WHERE H.LOCNCODE = 'PAWHRM' 
        AND D.AREA = @area
        AND (D.BAGS_RECV - D.BAGS_ALLOC - D.BAGS_ISS + D.BAGS_RET - D.BAGS_SAL - D.BAGS_ADJ) > 0
    `;

    // Add item filter if provided
    if (itemNumber) {
      query += ` AND D.ITEMNMBR = @itemNumber`;
    }

    // Add remarks filter - always filter to ensure correct item+remarks combination
    if (itemRemarks && itemRemarks.trim() !== '') {
      // If remarks provided, filter by that specific remarks
      query += ` AND D.REMARKS = @itemRemarks`;
    } else {
      // If no remarks selected, only show lots with NULL/empty remarks
      query += ` AND (D.REMARKS IS NULL OR D.REMARKS = '')`;
    }

    query += ` ORDER BY D.LOTNUMBER`;

    const request = pool.request().input('area', area);
    if (itemNumber) {
      request.input('itemNumber', itemNumber);
    }
    if (itemRemarks) {
      request.input('itemRemarks', itemRemarks);
    }

    const result = await request.query(query);

    const lots = result.recordset
      .filter(row => row.LOTNUMBER)
      .map(row => ({
        label: row.LOTNUMBER.trim(),
        value: row.LOTNUMBER.trim(),
        itemNumber: row.ITEMNMBR ? row.ITEMNMBR.trim() : null,
        remarks: row.REMARKS ? row.REMARKS.trim() : null
      }));

    res.json({
      success: true,
      data: lots
    });

  } catch (error) {
    console.error('Error fetching available lots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available lots',
      error: error.message
    });
  }
};

/**
 * Get lots for area and item (full details for allocation table)
 */
exports.getLotsByAreaAndItem = async (req, res) => {
  try {
    const { area } = req.params;
    const { itemNumber, itemRemarks, date } = req.query;

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

    let query = `
      SELECT 
        D.AREA, 
        D.LOTNUMBER, 
        D.ITEMNMBR, 
        D.UOFM, 
        D.REMARKS, 
        D.QM_IDNUMBER,
        CAST(QUANTITY_RECV / BAGS_RECV AS DECIMAL(18,8)) AS AVEWT,
        (BAGS_RECV + BAGS_RET) 
        - (BAGS_ALLOC + BAGS_ISS + BAGS_SAL + BAGS_ADJ) AS [AVAILABLE BAGS],
        (QUANTITY_RECV - QUANTITY_ALLOC - QUANTITY_ISS 
         + QUANTITY_RET - QUANTITY_SAL - QUANTITY_ADJ) AS [AVAILABLE KGS],
        DATETRANS, 
        H.REFERENCENO, 
        D.LINENUMBER
      FROM [INVENTORY.QUANTITYMASTER3.HEADER] H 
      INNER JOIN [INVENTORY.QUANTITYMASTER3.DETAILS] D 
          ON H.QM_IDNUMBER = D.QM_IDNUMBER
      WHERE H.LOCNCODE = 'PAWHRM' 
        AND D.AREA = @area
        AND D.ITEMNMBR = @itemNumber
        AND (D.BAGS_RECV - D.BAGS_ALLOC - D.BAGS_ISS + D.BAGS_RET - D.BAGS_SAL - D.BAGS_ADJ) > 0
    `;

    if (date) {
      query += ` AND H.DATETRANS <= @date`;
    }

    if (itemRemarks && itemRemarks.trim() !== '') {
      query += ` AND D.REMARKS = @itemRemarks`;
    } else {
      query += ` AND (D.REMARKS IS NULL OR D.REMARKS = '')`;
    }

    query += ` ORDER BY DATETRANS, REFERENCENO, LINENUMBER`;

    const request = pool.request()
      .input('area', area)
      .input('itemNumber', itemNumber);

    if (itemRemarks) {
      request.input('itemRemarks', itemRemarks);
    }

    if (date) {
      request.input('date', date);
    }

    const result = await request.query(query);

    const data = result.recordset.map(row => ({
      ...row,
      BAGS: null,
      KGS: null,
      TAG: 'FALSE'
    }));

    res.json({
      success: true,
      data: data,
      totalAvailableBags: data.reduce((sum, item) => sum + item['AVAILABLE BAGS'], 0),
      totalAvailableKgs: data.reduce((sum, item) => sum + item['AVAILABLE KGS'], 0)
    });

  } catch (error) {
    console.error('Error fetching lots by area and item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lots',
      error: error.message
    });
  }
};

/**
 * Get all transaction reference number
 */
exports.getNextIssuanceReference = async (req, res) => {
  try {
    const dbName = process.env.DB_SFC || 'SFC';
    const pool = await getPool(dbName);

    const result = await pool.request().query(
      'SELECT MAX((ISS_IDNUMBER) + 1) AS NEXT_ID FROM [INVENTORY.ISSUANCE.HEADER5]'
    );

    let nextId = result.recordset[0].NEXT_ID;

    // If NEXT_ID is NULL (table is empty or has NULL values), start from 1
    if (nextId === null || nextId === undefined) {
      nextId = 1;
    }

    res.json({
      success: true,
      nextReferenceNumber: nextId
    });

  } catch (error) {
    console.error('Error fetching next issuance reference number:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch next issuance reference number',
      error: error.message
    });
  }
};

/**
 * Get all available lots for an area (without allocation)
 */
exports.getAvailableLots = async (req, res) => {
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
      SELECT 
        D.AREA, 
        D.LOTNUMBER, 
        D.ITEMNMBR, 
        D.UOFM, 
        D.REMARKS, 
        D.QM_IDNUMBER,
        CAST(QUANTITY_RECV / BAGS_RECV AS DECIMAL(18,8)) AS AVEWT,
        (BAGS_RECV + BAGS_RET) 
        - (BAGS_ALLOC + BAGS_ISS + BAGS_SAL + BAGS_ADJ) AS [AVAILABLE BAGS],
        (QUANTITY_RECV - QUANTITY_ALLOC - QUANTITY_ISS 
         + QUANTITY_RET - QUANTITY_SAL - QUANTITY_ADJ) AS [AVAILABLE KGS],
        DATETRANS, 
        H.REFERENCENO, 
        D.LINENUMBER
      FROM [INVENTORY.QUANTITYMASTER3.HEADER] H 
      INNER JOIN [INVENTORY.QUANTITYMASTER3.DETAILS] D 
          ON H.QM_IDNUMBER = D.QM_IDNUMBER
      WHERE H.LOCNCODE = 'PAWHRM' 
        AND D.AREA = @area
        AND (D.BAGS_RECV - D.BAGS_ALLOC - D.BAGS_ISS + D.BAGS_RET - D.BAGS_SAL - D.BAGS_ADJ) > 0
      ORDER BY DATETRANS, REFERENCENO, LINENUMBER
    `;

    const result = await pool.request()
      .input('area', area)
      .query(query);

    const data = result.recordset.map(row => ({
      ...row,
      BAGS: null,
      KGS: null,
      TAG: 'FALSE'
    }));

    res.json({
      success: true,
      data: data,
      totalAvailableBags: data.reduce((sum, item) => sum + item['AVAILABLE BAGS'], 0),
      totalAvailableKgs: data.reduce((sum, item) => sum + item['AVAILABLE KGS'], 0)
    });

  } catch (error) {
    console.error('Error fetching available lots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available lots',
      error: error.message
    });
  }
};
/**
 * Get all transaction reference number
 */
exports.getTransactionReferenceNumber = async (req, res) => {
  try {
    const dbName = process.env.DB_SFC || 'SFC';
    const pool = await getPool(dbName);
    const query = `SELECT MAX((TRANSREFNO) + 1) AS NEXT_REF FROM [INVENTORY.QUANTITYMASTER4.HEADER]`;
    const result = await pool.request().query(query);

    let nextReferenceNumber = result.recordset[0].NEXT_REF;

    // If NEXT_REF is NULL (table is empty or has NULL values), start from 1
    if (nextReferenceNumber === null || nextReferenceNumber === undefined) {
      nextReferenceNumber = 1;
    }

    res.json({
      success: true,
      nextReferenceNumber: nextReferenceNumber
    });
  } catch (error) {
    console.error('Error fetching transaction reference number:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction reference number',
      error: error.message
    });
  }
};
