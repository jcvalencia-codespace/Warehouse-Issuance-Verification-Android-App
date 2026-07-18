const { getPool } = require('../../../../config/database');
const { getCompanyDbName } = require('../../../../utils/companyDb');

exports.getDeptCodeByScannedApprover = async (req, res) => {
    const { scannedApprover } = req.params;
    const { company } = req.query;

    const query = `SELECT DEPARTMENT FROM [SYSTEM.USERACCOUNT] WHERE NAME = @scannedApprover`;
    const dbName = process.env.DB_GDB;
    const pool = await getPool(dbName);
    const result = await pool.request().input('scannedApprover', scannedApprover).query(query);

    if (result.recordset.length > 0) {
        const deptCode = result.recordset[0].DEPARTMENT;
        res.json({ success: true, deptCode });
    } else {
        res.status(404).json({ success: false, message: 'Approver not found' });
    }
}

exports.getNextReferenceNo = async (req, res) => {
    const { company } = req.query;
    const query = `SELECT ISNULL(MAX(REFERENCENO), 0) + 1 AS LASTNUM FROM [INVENTORY.ISSUANCEHEADER3] WHERE LOCNCODE = 'PAWHSP'`;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);
    const result = await pool.request().query(query);

    const nextReferenceNo = result.recordset[0].LASTNUM;
    res.json({ success: true, nextReferenceNo });
}

exports.getTransactionType = async (req, res) => {
    const { company } = req.query;
    const query = `SELECT RTRIM(ISSUANCETYPE) AS ISSUANCETYPE FROM [SETTINGS.ISSUANCETYPE] WHERE LOCNCODE = 'PAWHSP' ORDER BY ISSUANCETYPE`;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);
    const result = await pool.request().query(query);

    res.json({ success: true, transactionTypes: result.recordset });
}

exports.getItemCode = async (req, res) => {
    const { company } = req.query;
    const query = `SELECT DISTINCT RTRIM(Q.ITEMNMBR) AS 'ITEM CODE', RTRIM(ITEMDESC) AS DESCRIPTION
                    FROM [INVENTORY.QUANTITYMASTER2] Q INNER JOIN IV00101 I ON Q.ITEMNMBR = I.ITEMNMBR
                    WHERE Q.LOCNCODE = 'PAWHSP' AND QUANTITY + QUANTITYADJ - QUANTITYISSUANCE <> 0 ORDER BY 'ITEM CODE'`;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);
    const result = await pool.request().query(query);

    res.json({ success: true, itemCodes: result.recordset });

}

exports.getItemDetails = async (req, res) => {
    const { company } = req.query;
    const { itemCode } = req.params;
    const query = `DECLARE @TEMP TABLE
                                            (DATERECEIVED SMALLDATETIME,  REFERENCENO  NVARCHAR(31), LINENUMBER INT, LOTNUMBER NVARCHAR(31), ITEMNMBR NVARCHAR(31), QUANTITY DECIMAL(18, 5), AREA NVARCHAR(21))

                                            INSERT INTO @TEMP (DATERECEIVED, REFERENCENO, LINENUMBER, LOTNUMBER, ITEMNMBR, QUANTITY, AREA)
                                            SELECT DATERECEIVED, REFERENCENO, LINENUMBER, QTM.LOTNUMBER, ITEMNMBR, (QTM.QUANTITY + QUANTITYADJ - QUANTITYISSUANCE)
                                            - ISNULL((SELECT SUM(QUANTITY) FROM [INVENTORY.WHSEAREA] WA WHERE QTM.LOTNUMBER = WA.LOTNUMBER), 0) AS QUANTITY,
                                            AREANAME AS 'AREA LOCATION'
                                            FROM [INVENTORY.QUANTITYMASTER2] AS QTM
                                            WHERE QTM.LOCNCODE = 'PAWHSP' AND QTM.QUANTITY + QUANTITYADJ - QUANTITYISSUANCE <> 0

                                            INSERT INTO @TEMP (DATERECEIVED, REFERENCENO, LINENUMBER, LOTNUMBER, ITEMNMBR, QUANTITY, AREA)
                                            SELECT DATERECEIVED, REFERENCENO, LINENUMBER, A.LOTNUMBER, ITEMNMBR, A.QUANTITY, AREA FROM [INVENTORY.WHSEAREA] A
                                            INNER JOIN [INVENTORY.QUANTITYMASTER2] Q ON A.LOTNUMBER = Q.LOTNUMBER 
                                            WHERE A.LOTNUMBER IN (SELECT LOTNUMBER FROM @TEMP) AND  Q.QUANTITY + QUANTITYADJ - QUANTITYISSUANCE <> 0 AND Q.LOCNCODE = 'PAWHSP' 

                                            SELECT  AREA, T.DATERECEIVED, T.REFERENCENO, T.LINENUMBER, T.LOTNUMBER, RTRIM(T.ITEMNMBR) 'ITEM CODE', UOFM, SUM(T.QUANTITY) QUANTITY
                                            FROM @TEMP T INNER JOIN [INVENTORY.QUANTITYMASTER2] Q ON T.REFERENCENO = Q.REFERENCENO AND T.LINENUMBER = Q.LINENUMBER AND T.LOTNUMBER = Q.LOTNUMBER AND T.ITEMNMBR = Q.ITEMNMBR 
                                            WHERE T.ITEMNMBR = @itemCode
                                            GROUP BY T.DATERECEIVED, T.REFERENCENO, T.LINENUMBER, T.LOTNUMBER, T.ITEMNMBR, UOFM, AREA
                                            HAVING SUM(T.QUANTITY) <> 0
                                            ORDER BY T.DATERECEIVED, T.REFERENCENO, QUANTITY`;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);
    const result = await pool.request()
        .input('itemCode', itemCode)
        .query(query);

    res.json({ success: true, itemDetails: result.recordset });

}

exports.getAssignQuantityAllocation = async (req, res) => {
    const { company } = req.query;
    const { itemCode } = req.params;
    const { assignedQty } = req.query;
    const query = `DECLARE @TEMP TABLE
                        (DATERECEIVED SMALLDATETIME, REFERENCENO NVARCHAR(31), LINENUMBER INT,
                        LOTNUMBER NVARCHAR(31), ITEMNMBR NVARCHAR(31), QUANTITY DECIMAL(18,5), AREA NVARCHAR(21))

                    INSERT INTO @TEMP (DATERECEIVED, REFERENCENO, LINENUMBER, LOTNUMBER, ITEMNMBR, QUANTITY, AREA)
                    SELECT DATERECEIVED, REFERENCENO, LINENUMBER, QTM.LOTNUMBER, ITEMNMBR,
                        (QTM.QUANTITY + QUANTITYADJ - QUANTITYISSUANCE)
                        - ISNULL((SELECT SUM(QUANTITY) FROM [INVENTORY.WHSEAREA] WA WHERE QTM.LOTNUMBER = WA.LOTNUMBER), 0) AS QUANTITY,
                        AREANAME AS 'AREA LOCATION'
                    FROM [INVENTORY.QUANTITYMASTER2] AS QTM
                    WHERE QTM.LOCNCODE = 'PAWHSP' AND QTM.QUANTITY + QUANTITYADJ - QUANTITYISSUANCE <> 0

                    INSERT INTO @TEMP (DATERECEIVED, REFERENCENO, LINENUMBER, LOTNUMBER, ITEMNMBR, QUANTITY, AREA)
                    SELECT DATERECEIVED, REFERENCENO, LINENUMBER, A.LOTNUMBER, ITEMNMBR, A.QUANTITY, AREA
                    FROM [INVENTORY.WHSEAREA] A
                    INNER JOIN [INVENTORY.QUANTITYMASTER2] Q ON A.LOTNUMBER = Q.LOTNUMBER
                    WHERE A.LOTNUMBER IN (SELECT LOTNUMBER FROM @TEMP)
                    AND Q.QUANTITY + QUANTITYADJ - QUANTITYISSUANCE <> 0
                    AND Q.LOCNCODE = 'PAWHSP'

                    ;WITH Grouped AS (
                        SELECT AREA, T.DATERECEIVED, T.REFERENCENO, T.LINENUMBER, T.LOTNUMBER,
                            RTRIM(T.ITEMNMBR) AS ITEMCODE, UOFM, SUM(T.QUANTITY) AS QUANTITY
                        FROM @TEMP T
                        INNER JOIN [INVENTORY.QUANTITYMASTER2] Q
                            ON T.REFERENCENO = Q.REFERENCENO AND T.LINENUMBER = Q.LINENUMBER
                        AND T.LOTNUMBER = Q.LOTNUMBER AND T.ITEMNMBR = Q.ITEMNMBR
                        WHERE T.ITEMNMBR = @itemCode
                        GROUP BY T.DATERECEIVED, T.REFERENCENO, T.LINENUMBER, T.LOTNUMBER, T.ITEMNMBR, UOFM, AREA
                        HAVING SUM(T.QUANTITY) <> 0
                    ),
                    Allocated AS (
                        SELECT *,
                            SUM(QUANTITY) OVER (
                                ORDER BY DATERECEIVED ASC, REFERENCENO ASC  -- FIFO: oldest first. Flip to DESC for LIFO.
                                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                            ) AS RunningTotal,
                            SUM(QUANTITY) OVER (
                                ORDER BY DATERECEIVED ASC, REFERENCENO ASC
                                ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
                            ) AS PriorTotal
                        FROM Grouped
                    )
                    SELECT
                        AREA, DATERECEIVED, REFERENCENO, LINENUMBER, LOTNUMBER, ITEMCODE, UOFM,
                        QUANTITY AS AVAILABLE_QUANTITY,
                        CASE
                            WHEN ISNULL(PriorTotal, 0) >= @assignedQty THEN 0
                            WHEN RunningTotal <= @assignedQty THEN QUANTITY
                            ELSE @assignedQty - ISNULL(PriorTotal, 0)
                        END AS ASSIGNED_QUANTITY
                    FROM Allocated
                    ORDER BY DATERECEIVED ASC, REFERENCENO ASC`

    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);
    const result = await pool.request()
        .input('itemCode', itemCode)
        .input('assignedQty', assignedQty)
        .query(query);

    res.json({ success: true, allocations: result.recordset });
}

exports.getAreaOption = async (req, res) => {
    const { company } = req.query;

    const companyColumn = {
        SFC: 'SFC',
        FEEDPRO: 'PNC',
        PNC: 'PNC',
        PET1: 'PET',
        PET: 'PET'
    };

    if (!company || !companyColumn[company]) {
        return res.status(400).json({ success: false, message: 'Invalid or missing company' });
    }
    const { department } = req.params;
    if (!department) {
        return res.status(400).json({ success: false, message: 'Missing department' });
    }
    const query = `SELECT DISTINCT AREA FROM [SETTINGS.PROJECTNAME] WHERE DEPARTMENT = @department AND ${companyColumn[company]} = 1 AND ACTIVE = 1 ORDER BY AREA`;
    const dbName = process.env.DB_GDB || 'GDB';
    const pool = await getPool(dbName);
    const result = await pool.request()
        .input('department', department)
        .query(query);

    res.json({ success: true, areas: result.recordset });
}

exports.getProjectNameOption = async (req, res) => {
    const { company } = req.query;
    const { department, area } = req.params;
    if (!department || !area) {
        return res.status(400).json({ success: false, message: 'Missing department or area' });
    }
    const query = `SELECT DISTINCT PROJECTNAME FROM [INVENTORY.ISSUANCEHEADER3] WHERE TRANSFER_LOCNCODE = @DEPARTMENT AND AREATRANSFER = @AREA ORDER BY PROJECTNAME`;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);
    const result = await pool.request()
        .input('department', department)
        .input('area', area)
        .query(query);

    res.json({ success: true, projects: result.recordset });
}

exports.getUserLocnCode = async (req, res) => {
    const { userName } = req.params;

    const query = `SELECT DEPTCODE FROM [SYSTEM.USERACCOUNT] WHERE USERNAME = @userName`
    const dbName = process.env.DB_GDB || 'GDB'
    const pool = await getPool(dbName);
    const result = await pool.request()
        .input('USERNAME', userName)
        .query(query);

    if (result.recordset.length > 0) {
        const deptCode = result.recordset[0].DEPTCODE;
        res.json({ success: true, deptCode });
    } else {
        res.status(404).json({ success: false, message: 'User not found' });
    }
}

exports.isMonthPosted = async (req, res) => {
    const { company } = req.query;
    const { locationCode, month, year } = req.params;

    const query = `SELECT TOP 1 MONTHPOST, YEARPOST FROM [POSTINVENTORY.YEARANDMONTH2] WHERE LOCNCODE = @LOCNCODE ORDER BY YEARPOST DESC, MONTHPOST DESC`;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);
    const result = await pool.request()
        .input('LOCNCODE', locationCode)
        .query(query);

    if (result.recordset.length > 0) {
        const { MONTHPOST, YEARPOST } = result.recordset[0];
        const isPosted = MONTHPOST === parseInt(month) && YEARPOST === parseInt(year);
        res.json({ success: true, isPosted });
    } else {
        res.json({ success: true, isPosted: false });
    }
}