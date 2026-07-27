const sql = require('mssql');
const { getPool } = require('../../../../config/database');
const { getCompanyDbName } = require('../../../../utils/companyDb');

exports.getMaterialIssuanceRequestHeader = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const query = `SELECT H.ROWID, H.MIRNO, H.SHIFT, H.REVIEWEDBY, H.CREATEDBY, H.DATECREATED, H.POSTSTATUS, H.MODIFIEDBY, H.DATEMODIFIED
                    FROM [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER] AS H INNER JOIN [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] D ON D.MIRNO = H.MIRNO
                    WHERE POSTSTATUS = 1 AND D.IS_SERVED = 0 ORDER BY H.DATECREATED DESC`;

    try {
        const result = await pool.request().query(query);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Error fetching material issuance request headers:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch material issuance request headers' });
    }
}

exports.markItemAsServed = async (req, res) => {
    const { company } = req.query;
    const { mirNo, rowId } = req.body;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const query = `UPDATE [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] SET IS_SERVED = 1 WHERE MIRNO = @mirNo AND IS_SERVED = 0 AND ROWID = @rowId`;

    try {
        await pool.request()
            .input('mirNo', mirNo)
            .input('rowId', rowId)
            .query(query);
        res.json({ success: true, message: 'Item marked as served.' });
    } catch (error) {
        console.error('Error marking item as served:', error);
        res.status(500).json({ success: false, message: 'Failed to mark item as served' });
    }
}

exports.getMaterialsIssuanceRequestDetails = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const query = `SELECT * FROM [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] WHERE MIRNO = @mirNo AND IS_SERVED = 0 ORDER BY DATECREATED DESC`;

    try {
        const result = await pool.request()
            .input('mirNo', req.params.mirNo)
            .query(query);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Error fetching material issuance request details:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch material issuance request details' });

    }
}