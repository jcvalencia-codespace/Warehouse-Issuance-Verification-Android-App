const { getPool } = require('../../../../config/database');
const { getCompanyDbName } = require('../../../../utils/companyDb');

exports.getDeptCodeByScannedApprover = async (req, res) => {
    const { scannedApprover } = req.params;
    const { company } = req.query;

    const query = `SELECT DEPTCODE FROM [SYSTEM.USERACCOUNT] WHERE NAME = @scannedApprover`;
    const dbName = getCompanyDbName(company);
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