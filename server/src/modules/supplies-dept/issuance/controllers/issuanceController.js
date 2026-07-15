const { getPool } = require('../../../../config/database');

exports.getDeptCodeByScannedApprover = async (req, res) => {
    const { scannedApprover } = req.params;

    const query = `SELECT DEPTCODE FROM [SYSTEM.USERACCOUNT] WHERE NAME = @scannedApprover`;
    const dbName = process.env.DB_NAME || 'GDB';
    const pool = await getPool(dbName);
    const result = await pool.request().input('scannedApprover', scannedApprover).query(query);

    if (result.recordset.length > 0) {
        const deptCode = result.recordset[0].DEPTCODE;
        res.json({ success: true, deptCode });
    } else {
        res.status(404).json({ success: false, message: 'Approver not found' });
    }
}

exports.getNextReferenceNo = async (req, res) => {
    const query = `SELECT ISNULL(MAX(REFERENCENO), 0) + 1 AS LASTNUM FROM [INVENTORY.ISSUANCEHEADER3] WHERE LOCNCODE = 'PAWHSP'`;
    const dbName = process.env.DB_SFC || 'SFC';
    const pool = await getPool(dbName);
    const result = await pool.request().query(query);

    const nextReferenceNo = result.recordset[0].LASTNUM;
    res.json({ success: true, nextReferenceNo });
}

exports.getTransactionType = async (req,res) => {
    const query = `SELECT RTRIM(ISSUANCETYPE) AS ISSUANCETYPE FROM [SETTINGS.ISSUANCETYPE] WHERE LOCNCODE = 'PAWHSP' ORDER BY ISSUANCETYPE`;
    const dbName = process.env.DB_SFC || 'SFC';
    const pool = await getPool(dbName);
    const result = await pool.request().query(query);

    res.json({ success: true, transactionTypes: result.recordset });
}