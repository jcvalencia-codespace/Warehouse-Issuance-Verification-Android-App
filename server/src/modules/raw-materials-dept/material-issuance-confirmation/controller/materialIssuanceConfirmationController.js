const sql = require('mssql');
const { getPool } = require('../../../../config/database');
const { getCompanyDbName } = require('../../../../utils/companyDb');
const { emitMaterialIssuanceUpdate } = require('../../../../utils/socketEvents');

exports.getMaterialIssuanceRequestHeader = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const query = `SELECT H.ROWID, H.MIRNO, H.SHIFT, H.REVIEWEDBY, H.CREATEDBY, H.DATECREATED, H.POSTSTATUS, H.MODIFIEDBY, H.DATEMODIFIED
                    FROM [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER] AS H INNER JOIN [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] D ON D.MIRNO = H.MIRNO
                    WHERE POSTSTATUS = 1 AND D.IS_SERVED = 0 AND D.IS_CANCELLED = 0 ORDER BY H.MIRNO`;

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
        emitMaterialIssuanceUpdate('preparing', { mirNo, rowId, user, company });
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
        emitMaterialIssuanceUpdate('prepared', { mirNo, rowId, user, company });
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
        emitMaterialIssuanceUpdate('served', { mirNo, rowId, user, company });
    } catch (error) {
        console.error('Error marking item as served:', error);
        res.status(500).json({ success: false, message: 'Failed to mark item as served' });
    }
}

exports.markItemAsConfirmed = async (req, res) => {
    const { company } = req.query;
    const { mirNo, rowId, user } = req.body;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const query = `UPDATE [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] SET IS_CONFIRMED = 1, CONFIRMEDBY = @user, DATECONFIRMED = GETDATE() WHERE MIRNO = @mirNo AND ROWID = @rowId AND IS_SERVED = 1`;

    try {
        const result = await pool.request()
            .input('user', user)
            .input('mirNo', mirNo)
            .input('rowId', rowId)
            .query(query);
        res.json({ success: true, data: result.recordset });
        emitMaterialIssuanceUpdate('confirmed', { mirNo, rowId, user, company });

        const notificationPool = await getPool('GDB');
        const detailsServedQuery = await notificationPool.request()
            .input('mirNo', mirNo)
            .query(`SELECT COUNT(*) AS ServedCount FROM SFC.DBO.[PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] WHERE MIRNO = @mirNo AND IS_SERVED = 1`);

        if (detailsServedQuery.recordset[0].ServedCount > 0) {
            await notificationPool.request()
                .input('mirNo', mirNo)
                .query(`DELETE FROM [SYSTEM.NOTIFICATIONMASTER] WHERE REFERENCENO = @mirNo AND FORM = 'ERP MOBILE'`);
        }
    } catch (error) {
        console.error('Error Marking Item as Confirmed:', error);
        res.status(500).json({ success: false, message: 'Failed to mark item as confirmed' });
    }
}

exports.cancelItem = async (req, res) => {
    const { company } = req.query;
    const { cancelRemarks, mirNo, rowId, user } = req.body;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const query = `UPDATE [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] 
                   SET IS_CANCELLED = 1, REMARKS = @cancelRemarks, MODIFIEDBY = @user, DATEMODIFIED = GETDATE() 
                   WHERE MIRNO = @mirNo AND ROWID = @rowId`;

    try {
        await pool.request()
            .input('cancelRemarks', cancelRemarks)
            .input('user', user)
            .input('mirNo', mirNo)
            .input('rowId', rowId)
            .query(query);
        res.json({ success: true, message: 'Item Cancelled' });
        emitMaterialIssuanceUpdate('cancelled', { mirNo, rowId, user, company });
    } catch (error) {
        console.error('Error Cancelling Item.', error);
        res.status(500).json({ success: false, message: 'Failed to mark item as cancelled' });
    }
}

exports.getMaterialsIssuanceRequestDetails = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const query = `SELECT D.*, I.ITEMDESC FROM [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] D
                    INNER JOIN IV00101 I ON D.ITEMNMBR = I.ITEMNMBR WHERE MIRNO = @mirNo AND IS_SERVED = 0 AND IS_CANCELLED = 0 ORDER BY MIRNO`;

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
                    INNER JOIN IV00101 I ON D.ITEMNMBR = I.ITEMNMBR WHERE D.IS_SERVED = 1 AND D.IS_CONFIRMED = 0 ORDER BY D.MIRNO`;

    try {
        const result = await pool.request()
            .query(query);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Error fetching served items:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch served items' });
    }
}

exports.getConfirmedItemsToday = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const query = `SELECT D.*, I.ITEMDESC FROM [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] D
                    INNER JOIN IV00101 I ON D.ITEMNMBR = I.ITEMNMBR WHERE D.IS_CONFIRMED = 1 AND CAST(D.DATECONFIRMED AS DATE) = CAST(GETDATE() AS DATE) ORDER BY D.MIRNO`;

    try {
        const result = await pool.request()
            .query(query);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Error fetching confirmed items:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch confirmed items' });
    }
}