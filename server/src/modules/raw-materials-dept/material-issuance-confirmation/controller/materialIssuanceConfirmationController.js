const sql = require('mssql');
const { getPool } = require('../../../../config/database');
const { getCompanyDbName } = require('../../../../utils/companyDb');

exports.getMaterialIssuanceRequestHeader = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const query = `SELECT H.ROWID, H.MIRNO, H.SHIFT, H.REVIEWEDBY, H.CREATEDBY, H.DATECREATED, H.POSTSTATUS, H.MODIFIEDBY, H.DATEMODIFIED
                    FROM [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER] AS H INNER JOIN [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] D ON D.MIRNO = H.MIRNO
                    WHERE POSTSTATUS = 1 AND D.IS_SERVED = 0 ORDER BY H.MIRNO`;

    try {
        const result = await pool.request().query(query);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Error fetching material issuance request headers:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch material issuance request headers' });
    }
}

exports.markItemAsPreparing = async (req, res) => {
    const { company } = req.query;
    const { mirNo, rowId, user } = req.body;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const query = `UPDATE [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] SET IS_PREPARING = 1, PREPARINGBY = @user, DATEPREPARING = GETDATE() WHERE MIRNO = @mirNo AND IS_SERVED = 0 AND ROWID = @rowId`;

    try {
        await pool.request()
            .input('user', user)
            .input('mirNo', mirNo)
            .input('rowId', rowId)
            .query(query);
        res.json({ success: true, message: 'Item set to preparing.' });
    } catch (error) {
        console.error('Error marking item as preparing:', error);
        res.status(500).json({ success: false, message: 'Failed to mark item as preparing' });
    }
}

exports.markItemAsPrepared = async (req, res) => {
    const { company } = req.query;
    const { mirNo, rowId, user } = req.body;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const query = `UPDATE [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] SET IS_PREPARED = 1, PREPAREDBY = @user, DATEPREPARED = GETDATE() WHERE MIRNO = @mirNo AND IS_SERVED = 0 AND ROWID = @rowId`;

    try {
        await pool.request()
            .input('user', user)
            .input('mirNo', mirNo)
            .input('rowId', rowId)
            .query(query);
        res.json({ success: true, message: 'Item set to prepared.' });
    } catch (error) {
        console.error('Error marking item as prepared:', error);
        res.status(500).json({ success: false, message: 'Failed to mark item as prepared' });
    }
}

exports.markItemAsServed = async (req, res) => {
    const { company } = req.query;
    const { mirNo, rowId, user } = req.body;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const query = `UPDATE [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] SET IS_SERVED = 1, SERVEDBY = @user, DATESERVED = GETDATE() WHERE MIRNO = @mirNo AND IS_SERVED = 0 AND ROWID = @rowId`;

    try {
        await pool.request()
            .input('user', user)
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

    const query = `SELECT D.*, I.ITEMDESC FROM [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] D
                    INNER JOIN IV00101 I ON D.ITEMNMBR = I.ITEMNMBR WHERE MIRNO = @mirNo AND IS_SERVED = 0 ORDER BY MIRNO`;

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

exports.getPreparingItems = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const query = `SELECT * FROM [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] WHERE IS_PREPARING = 1`

    try {
        const result = await pool.request()
            .query(query);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Error fetching preparing items:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch preparing items' });
    }
}

exports.getPreparedItems = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const query = `SELECT * FROM [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] WHERE IS_PREPARED = 1`

    try {
        const result = await pool.request()
            .query(query);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Error fetching preparing items:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch preparing items' });
    }
}

exports.getServedItemsToday = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const query = `SELECT D.*, I.ITEMDESC FROM [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] D
                    INNER JOIN IV00101 I ON D.ITEMNMBR = I.ITEMNMBR WHERE D.IS_SERVED = 1 AND CAST(D.DATESERVED AS DATE) = CAST(GETDATE() AS DATE) ORDER BY D.MIRNO`;

    try {
        const result = await pool.request()
            .query(query);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Error fetching served items:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch served items' });
    }
}