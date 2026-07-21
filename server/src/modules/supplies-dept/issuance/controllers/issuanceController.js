const sql = require('mssql');
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

exports.getDepartmentOption = async (req, res) => {
    const { company } = req.query;

    const query = `SELECT DISTINCT DEPARTMENT FROM [SYSTEM.USERACCOUNT]`
    const dbName = process.env.DB_GDB;
    const pool = await getPool(dbName);
    const result = await pool.request().query(query);

    res.json({ success: true, departments: result.recordset });
}

exports.getValidPersonnel = async (req, res) => {
    const query = `SELECT NAME FROM [SYSTEM.USERACCOUNT] WHERE ACTIVE = 1`
    const dbName = process.env.DB_GDB;
    const pool = await getPool(dbName);
    const result = await pool.request().query(query);

    res.json({ success: true, personnel: result.recordset });
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

exports.getMachineNo = async (req, res) => {
    const query = `SELECT MACHINENO FROM [SETTINGS.MACHINE] WHERE ACTIVE = 1 ORDER BY MACHINENO`;
    const dbName = process.env.DB_SFC;
    const pool = await getPool(dbName);
    const result = await pool.request().query(query);

    res.json({ success: true, machineNos: result.recordset });
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

    const query = `SELECT TOP 1 MONTHPOST, YEARPOST FROM [POSTINVENTORY.YEARANDMONTH2] WHERE LOCNCODE = 'PAWHSP' ORDER BY YEARPOST DESC, MONTHPOST DESC`;
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

exports.postIssuance = async (req, res) => {
    const { company } = req.query;
    const {
        referenceNo, locnCode, transactionType, issuanceType, dateIssued,
        shift, contactPerson, transferLocnCode, projectName, areaTransfer,
        issuedBy, approvedBy, timeRequest, timeIssued, dateCreated,
        dateModified, userName, postStatus, details,
    } = req.body;

    let lineItems = [];
    try {
        lineItems = details ? (Array.isArray(details) ? details : JSON.parse(details)) : [];
        if (!Array.isArray(lineItems)) lineItems = [];
    } catch (e) {
        lineItems = [];
    }

    const headerQuery = `INSERT INTO [INVENTORY.ISSUANCEHEADER3]
                        (REFERENCENO, MINO, LOCNCODE, TRANSACTIONTYPE, ISSUANCETYPE, DATEISSUED, 
                        SHIFT, CONTACTPERSON, TRANSFER_LOCNCODE, PROJECTNAME, AREATRANSFER,
                        MACHINENAME, ISSUEDBY, APPROVEBY, TIMEREQUEST, TIMEISSUED, DATECREATED,
                        DATEMODIFIED, USERNAME, POSTSTATUS,
                        PONUMBER, WORKORDERNO, OTHERDOCNO)
                    VALUES (@referenceNo, '', @locnCode, @transactionType, @issuanceType, @dateIssued, 
                            @shift, @contactPerson, @TRANSFER_LOCNCODE, @projectName, @areaTransfer,
                            '', @issuedBy, @approvedBy, @timeRequest, @timeIssued, @dateCreated,
                            @dateModified, @userName, @postStatus,
                            '', '', '')`

    const detailsQuery = `INSERT INTO [INVENTORY.ISSUANCEDETAILS3]
                        (REFERENCENO, REFNORECV, LOTNUMBER, ITEMNMBR, QUANTITY, 
                        UOFM, MACHINENO, LINENUMRECV, REMARKS, TRANSACTIONTYPE, ISSUANCETYPE)
                    VALUES (@dReferenceNo, @dRefNoRecv, @dLotNumber, @dItemNmbr, @dQuantity, 
                        @dUofm, @dMachineNo, @dLineNumRecv, @dRemarks, @dTransactionType, @dIssuanceType)`

    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const headerRequest = new sql.Request(transaction);
        await headerRequest
            .input('REFERENCENO', referenceNo)
            .input('LOCNCODE', locnCode)
            .input('TRANSACTIONTYPE', transactionType)
            .input('ISSUANCETYPE', issuanceType)
            .input('DATEISSUED', dateIssued)
            .input('SHIFT', shift)
            .input('CONTACTPERSON', contactPerson)
            .input('TRANSFER_LOCNCODE', transferLocnCode)
            .input('PROJECTNAME', projectName)
            .input('AREATRANSFER', areaTransfer)
            .input('ISSUEDBY', issuedBy)
            .input('APPROVEDBY', approvedBy)
            .input('TIMEREQUEST', timeRequest)
            .input('TIMEISSUED', timeIssued)
            .input('DATECREATED', dateCreated)
            .input('DATEMODIFIED', dateModified)
            .input('USERNAME', userName)
            .input('POSTSTATUS', postStatus)
            .query(headerQuery);

        for (const line of lineItems) {
            const detailRequest = new sql.Request(transaction);
            await detailRequest
                .input('dReferenceNo', referenceNo)
                .input('dRefNoRecv', line.refNoRecv ?? line.REFNORECV ?? null)
                .input('dLotNumber', line.lotNumber ?? line.LOTNUMBER ?? null)
                .input('dItemNmbr', line.itemCode ?? line.ITEMNMBR ?? null)
                .input('dQuantity', line.quantity ?? line.QUANTITY ?? 0)
                .input('dUofm', line.uofm ?? line.UOFM ?? null)
                .input('dMachineNo', line.machineNo ?? line.MACHINENO ?? null)
                .input('dLineNumRecv', line.lineNumRecv ?? line.LINENUMRECV ?? null)
                .input('dRemarks', line.remarks ?? line.REMARKS ?? null)
                .input('dTransactionType', transactionType)
                .input('dIssuanceType', issuanceType)
                .query(detailsQuery);
        }

        await transaction.commit();
        res.json({ success: true, insertedDetails: lineItems.length });
    } catch (error) {
        try {
            if (transaction.active) {
                await transaction.rollback();
            }
        } catch (rollbackError) {
            // Transaction may already be aborted by mssql; ignore EABORT here
            if ((rollbackError)?.code !== 'EABORT') {
                console.error('Rollback failed:', rollbackError);
            }
        }
        console.error('postIssuance failed:', error);
        res.status(500).json({ success: false, message: 'Failed to post issuance', error: error.message });
    }
}

exports.getPostedIssuanceHeader = async (req, res) => {
    const { company } = req.query;
    const { year, skip = 0, take = 50 } = req.query;

    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);
    const request = pool.request();

    const columns = `REFERENCENO, TRANSACTIONTYPE, ISSUANCETYPE, DATEISSUED, SHIFT, CONTACTPERSON, 
                     TRANSFER_LOCNCODE, PROJECTNAME, AREATRANSFER, ISSUEDBY, APPROVEBY, 
                     TIMEREQUEST, TIMEISSUED, POSTSTATUS, COUNT(*) OVER() AS totalCount`;

    let query = `SELECT ${columns} FROM [INVENTORY.ISSUANCEHEADER3] WHERE POSTSTATUS = 1`;

    if (year) {
        const yearStart = `${year}-01-01`;
        const yearEnd = `${parseInt(year) + 1}-01-01`;
        query += ` AND DATEISSUED >= @yearStart AND DATEISSUED < @yearEnd`;
        request.input('yearStart', yearStart);
        request.input('yearEnd', yearEnd);
    }

    query += ` ORDER BY REFERENCENO DESC OFFSET @skip ROWS FETCH NEXT @take ROWS ONLY`;
    request.input('skip', parseInt(skip, 10));
    request.input('take', parseInt(take, 10));

    const totalCount = result.recordset.length > 0 ? result.recordset[0].totalCount : 0;
    const records = result.recordset.map(({ totalCount: _tc, ...rest }) => rest);
    res.json({ success: true, issueduances: records, totalCount });
}

exports.getPostedIssuanceDetails= async (req, res) => {
    const { company } = req.query;
    const { referenceNo } = req.params;

    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);
    const result = await pool.request()
        .input('referenceNo', referenceNo)
        .query(`SELECT * FROM [INVENTORY.ISSUANCEDETAILS3] WHERE REFERENCENO = @referenceNo ORDER BY REFERENCENO DESC`);

    res.json({ success: true, issueduances: result.recordset });
}