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

exports.getNextReferenceNo = async (company) => {
    const query = `SELECT ISNULL(MAX(REFERENCENO), 0) + 1 AS LASTNUM FROM [INVENTORY.ISSUANCEHEADER3] WHERE LOCNCODE = 'PAWHSP'`;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);
    const result = await pool.request().query(query);
    return result.recordset[0].LASTNUM;
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

exports.validatedDate = async (req, res) => {
    const { company } = req.query;
    try {
        const query = `SELECT TOP 1 DATEISSUED FROM [INVENTORY.ISSUANCEHEADER3] WHERE POSTSTATUS = 0 ORDER BY REFERENCENO DESC`;
        const dbName = getCompanyDbName(company);
        const pool = await getPool(dbName);
        const result = await pool.request().query(query);

        if (result.recordset.length > 0) {
            const lastDateIssued = result.recordset[0].DATEISSUED;
            const diffDays = Math.floor((Date.now() - new Date(lastDateIssued).getTime()) / (1000 * 60 * 60 * 24));
            const canIssue = diffDays < 3;
            res.json({ success: true, lastDateIssued, canIssue, diffDays });
        } else {
            res.json({ success: true, lastDateIssued: null, canIssue: true, diffDays: 0 });
        }
    } catch (error) {
        console.error('validatedDate error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to validate issuance date' });
    }
}

exports.postIssuance = async (req, res) => {
    const { company } = req.query;
    const {
        referenceNo, locnCode, transactionType, issuanceType, otherDocNo,
        dateIssued, shift, contactPerson, transferLocnCode, projectName, areaTransfer,
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
                            '', '', @otherDocNo )`

    const detailsQuery = `INSERT INTO [INVENTORY.ISSUANCEDETAILS3]
                        (REFERENCENO, REFNORECV, LOTNUMBER, ITEMNMBR, QUANTITY, 
                        UOFM, MACHINENO, LINENUMRECV, REMARKS, TRANSACTIONTYPE, ISSUANCETYPE)
                    VALUES (@dReferenceNo, @dRefNoRecv, @dLotNumber, @dItemNmbr, @dQuantity, 
                        @dUofm, @dMachineNo, @dLineNumRecv, @dRemarks, @dTransactionType, @dIssuanceType)`

    const updateQM2 = `UPDATE [INVENTORY.QUANTITYMASTER2] 
                       SET QUANTITYISSUANCE = QUANTITYISSUANCE + @dQuantity, USERNAME = @userName, DATEMODIFIED = GETDATE()
                       WHERE LOTNUMBER = @dLotNumber`

    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const validateQuery = `SELECT TOP 1 DATEISSUED FROM [INVENTORY.ISSUANCEHEADER3] WHERE POSTSTATUS = 0 ORDER BY REFERENCENO DESC`;
    const validateResult = await pool.request().query(validateQuery);
    if (validateResult.recordset.length > 0) {
        const lastDateIssued = validateResult.recordset[0].DATEISSUED;
        const diffDays = Math.floor((Date.now() - new Date(lastDateIssued).getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 3) {
            const err = new Error(`Cannot issue new transaction. The last unposted issuance (${new Date(lastDateIssued).toISOString().split('T')[0]}) is ${diffDays} days old.`);
            err.statusCode = 400;
            throw err;
        }
    }

    let referenceNoToUse = referenceNo;
    if (!referenceNoToUse) {
        referenceNoToUse = await getNextReferenceNo(company);
    }

    if (referenceNoToUse) {
        let existsResult = await pool.request()
            .input('referenceNo', referenceNoToUse)
            .input('locnCode', locnCode)
            .query(`SELECT 1 FROM [INVENTORY.ISSUANCEHEADER3] WHERE REFERENCENO = @referenceNo AND LOCNCODE = @locnCode`);

        while (existsResult.recordset.length > 0) {
            referenceNoToUse = parseInt(referenceNoToUse) + 1;
            existsResult = await pool.request()
                .input('referenceNo', referenceNoToUse)
                .input('locnCode', locnCode)
                .query(`SELECT 1 FROM [INVENTORY.ISSUANCEHEADER3] WHERE REFERENCENO = @referenceNo AND LOCNCODE = @locnCode`);
        }
    }

    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        const allocations = [];

        for (const line of lineItems) {
            const requestedQty = line.quantity ?? line.QUANTITY ?? 0;
            const itemCode = line.itemCode ?? line.ITEMNMBR ?? 'Unknown';
            const machineNo = line.machineNo ?? line.MACHINENO ?? null;
            const uofm = line.uofm ?? line.UOFM ?? null;
            const refNoRecv = line.refNoRecv ?? line.REFNORECV ?? null;
            const lineNumRecv = line.lineNumRecv ?? line.LINENUMRECV ?? null;
            const remarks = line.remarks ?? line.REMARKS ?? null;

            const lotsResult = await (new sql.Request(transaction))
                .input('itemCode', itemCode)
                .query(`SELECT Q.LOTNUMBER, (Q.QUANTITY + Q.QUANTITYADJ - Q.QUANTITYISSUANCE) - ISNULL((SELECT SUM(WA.QUANTITY) FROM [INVENTORY.WHSEAREA] WA WHERE WA.LOTNUMBER = Q.LOTNUMBER), 0) AS AVAILABLE FROM [INVENTORY.QUANTITYMASTER2] Q WITH (UPDLOCK, ROWLOCK) WHERE Q.ITEMNMBR = @itemCode AND Q.LOCNCODE = 'PAWHSP' AND (Q.QUANTITY + Q.QUANTITYADJ - Q.QUANTITYISSUANCE) - ISNULL((SELECT SUM(WA.QUANTITY) FROM [INVENTORY.WHSEAREA] WA WHERE WA.LOTNUMBER = Q.LOTNUMBER), 0) > 0 ORDER BY Q.DATERECEIVED ASC, Q.REFERENCENO ASC`);

            if (lotsResult.recordset.length === 0) {
                const err = new Error(`Item ${itemCode} has no available stock.`);
                err.statusCode = 400;
                throw err;
            }

            let remaining = requestedQty;
            const lineAllocations = [];
            for (const lot of lotsResult.recordset) {
                if (remaining <= 0) break;
                const take = Math.min(remaining, lot.AVAILABLE);
                lineAllocations.push({
                    itemCode,
                    machineNo,
                    lotNumber: lot.LOTNUMBER,
                    quantity: take,
                    uofm,
                    refNoRecv,
                    lineNumRecv,
                    remarks,
                });
                remaining -= take;
            }

            if (remaining > 0) {
                const err = new Error(`Item ${itemCode} has insufficient stock. Requested: ${requestedQty}, Available: ${requestedQty - remaining}`);
                err.statusCode = 400;
                throw err;
            }

            allocations.push(...lineAllocations);
        }

        const headerRequest = new sql.Request(transaction);
        await headerRequest
            .input('REFERENCENO', referenceNoToUse)
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
            .input('OTHERDOCNO', otherDocNo)
            .query(headerQuery);

        for (const alloc of allocations) {
            const detailRequest = new sql.Request(transaction);
            await detailRequest
                .input('dReferenceNo', referenceNoToUse)
                .input('dRefNoRecv', alloc.refNoRecv)
                .input('dLotNumber', alloc.lotNumber)
                .input('dItemNmbr', alloc.itemCode)
                .input('dQuantity', alloc.quantity)
                .input('dUofm', alloc.uofm)
                .input('dMachineNo', alloc.machineNo)
                .input('dLineNumRecv', alloc.lineNumRecv)
                .input('dRemarks', alloc.remarks)
                .input('dTransactionType', transactionType)
                .input('dIssuanceType', issuanceType)
                .query(detailsQuery);
        }

        for (const alloc of allocations) {
            const updateRequest = new sql.Request(transaction);
            await updateRequest
                .input('dQuantity', alloc.quantity)
                .input('dLotNumber', alloc.lotNumber)
                .input('userName', userName)
                .query(updateQM2);
        }

        await transaction.commit();
        res.json({ success: true, insertedDetails: allocations.length, referenceNo: referenceNoToUse });
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
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ success: false, message: error.message || 'Failed to post issuance' });
    }
}

exports.getPostedIssuanceHeader = async (req, res) => {
    const { company } = req.query;
    const { year, month } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);
    const request = pool.request();

    const columns = `REFERENCENO, TRANSACTIONTYPE, ISSUANCETYPE, DATEISSUED, SHIFT, CONTACTPERSON,
                     TRANSFER_LOCNCODE, PROJECTNAME, AREATRANSFER, ISSUEDBY, APPROVEBY,
                     TIMEREQUEST, TIMEISSUED, POSTSTATUS, COUNT(*) OVER() AS totalCount`;

    let baseDateFrom = new Date();
    baseDateFrom.setMonth(baseDateFrom.getMonth() - 2);
    let dateFromValue = baseDateFrom.toISOString().split('T')[0];

    if (year) {
        dateFromValue = `${year}-01-01`;
        request.input('year', parseInt(year));
        if (month) {
            const monthStr = String(month).padStart(2, '0');
            dateFromValue = `${year}-${monthStr}-01`;
            request.input('month', parseInt(month));
        }
    }

    request.input('dateFrom', dateFromValue);

    let query = `SELECT ${columns} FROM [INVENTORY.ISSUANCEHEADER3]
                   WHERE POSTSTATUS = 1 AND DATEISSUED >= @dateFrom`;

    if (year && !month) {
        const nextYear = parseInt(year) + 1;
        query += ` AND DATEISSUED < @dateTo`;
        request.input('dateTo', `${nextYear}-01-01`);
    } else if (year && month) {
        const nextMonth = month === 12 ? 1 : parseInt(month) + 1;
        const nextMonthYear = month === 12 ? parseInt(year) + 1 : parseInt(year);
        const nextMonthStr = String(nextMonth).padStart(2, '0');
        query += ` AND DATEISSUED < @dateTo`;
        request.input('dateTo', `${nextMonthYear}-${nextMonthStr}-01`);
    } else if (month && !year) {
        const currentYear = new Date().getFullYear();
        const nextMonth = month === 12 ? 1 : parseInt(month) + 1;
        const nextMonthYear = month === 12 ? currentYear + 1 : currentYear;
        const nextMonthStr = String(nextMonth).padStart(2, '0');
        query += ` AND DATEISSUED < @dateTo`;
        request.input('dateTo', `${nextMonthYear}-${nextMonthStr}-01`);
    }

    query += ` ORDER BY REFERENCENO DESC`;

    const result = await request.query(query);
    const totalCount = result.recordset.length > 0 ? result.recordset[0].totalCount : 0;
    const records = result.recordset.map(({ totalCount: _tc, ...rest }) => rest);
    res.json({ success: true, issueduances: records, totalCount });
}
exports.getPostedIssuanceDetails = async (req, res) => {
    const { company } = req.query;
    const { referenceNo } = req.params;

    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);
    const result = await pool.request()
        .input('referenceNo', referenceNo)
        .query(`SELECT * FROM [INVENTORY.ISSUANCEDETAILS3] WHERE REFERENCENO = @referenceNo ORDER BY REFERENCENO DESC`);

    res.json({ success: true, issueduances: result.recordset });
}