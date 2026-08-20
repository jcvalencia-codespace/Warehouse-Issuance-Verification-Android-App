const sql = require('mssql');
const { getPool } = require('../../../../config/database');
const { getCompanyDbName } = require('../../../../utils/companyDb');
const { emitMaterialIssuanceUpdate, emitNotification } = require('../../../../utils/socketEvents');
const { sendExpoPush } = require('../../../../utils/notificationService');


exports.getRequestsHeaderForReview = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const query = `SELECT * FROM [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER] WHERE POSTSTATUS = 0 AND IS_APPROVED IS NULL ORDER BY DATECREATED`;

    try {
        const result = await pool.request().query(query);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Error fetching material issuance request headers:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch material issuance request headers' });
    }
}

exports.getRequestsDetailsForReview = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const query = `SELECT D.*, I.ITEMDESC FROM [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] D INNER JOIN [IV00101] I ON D.ITEMNMBR = I.ITEMNMBR WHERE D.MIRNO = @mirNo`;

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

exports.approveRequest = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const { mirNo, user } = req.body || {};

    try {
        const result = await pool.request()
            .input('mirNo', mirNo)
            .input('user', user.NAME || null)
            .query(`UPDATE [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER]
                    SET POSTSTATUS = 1, IS_APPROVED = 1, MODIFIEDBY = @user, DATEMODIFIED = GETDATE()
                    WHERE MIRNO = @mirNo`);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        res.json({ success: true, message: 'New Material Issuance Request successfully' });
        emitMaterialIssuanceUpdate('posted', { mirNo, company });

        try {
            const notificationPool = await getPool('GDB');
            const usersResult = await notificationPool.request().query(`SELECT NAME FROM [SYSTEM.USERACCOUNT] WHERE NAME IN ('Jairus Valencia','Jayson Delos Reyes', 'Genesis Guinto', 'Lester A. Arceo')`);
            const users = usersResult.recordset;
            for (const recipient of users) {
                await notificationPool.request()
                    .input('receiver', recipient.NAME)
                    .input('category', 'New Material Issuance Request')
                    .input('form', 'ERP MOBILE')
                    .input('referenceNo', mirNo)
                    .input('sender', user || null)
                    .query(`INSERT INTO [SYSTEM.NOTIFICATIONMASTER] (RECEIVER, CATEGORY, FORM, REFERENCENO, SENDER, DATESENT)
                            VALUES (@receiver, @category, @form, @referenceNo, @sender, GETDATE())`);
            }
            emitNotification({ type: 'notification', data: { mirNo, receiver: 'PAWHRM', category: 'New Material Issuance Request', form: 'ERP MOBILE', referenceno: mirNo, sender: user || null } });
        } catch (notifError) {
            console.error('Notification error:', notifError);
        }
    } catch (error) {
        console.error('Error approving material issuance request:', error);
        res.status(500).json({ success: false, message: 'Failed to approve material issuance request' });
    }
}

exports.rejectRequest = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const { mirNo, user, remarks } = req.body || {};

    try {
        const result = await pool.request()
            .input('mirNo', mirNo)
            .input('user', user || null)
            .input('remarks', remarks)
            .query(`UPDATE [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER]
                    SET IS_APPROVED = 0, MODIFIEDBY = @user, REMARKS = @remarks, DATEMODIFIED = GETDATE()
                    WHERE MIRNO = @mirNo`);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        res.json({ success: true, message: 'Material issuance request rejected successfully' });
        emitMaterialIssuanceUpdate('rejected', { mirNo, company });

        try {
            const notificationPool = await getPool('GDB');
            const usersResult = await notificationPool.request().query(`SELECT NAME FROM [SYSTEM.USERACCOUNT] WHERE NAME IN ('Jairus Valencia','Jayson Delos Reyes', 'Genesis Guinto', 'Lester A. Arceo')`);
            const users = usersResult.recordset;
            const category = (remarks) => {
                return remarks?.trim()
                    ? 'Material Issuance Request Rejected With Remarks: ' + remarks
                    : 'Material Issuance Request Rejected';
            };
            for (const recipient of users) {
                await notificationPool.request()
                    .input('receiver', recipient.NAME)
                    .input('category', category(remarks))
                    .input('form', 'ERP MOBILE')
                    .input('referenceNo', mirNo)
                    .input('sender', user || null)
                    .query(`INSERT INTO [SYSTEM.NOTIFICATIONMASTER] (RECEIVER, CATEGORY, FORM, REFERENCENO, SENDER, DATESENT)
                            VALUES (@receiver, @category, @form, @referenceNo, @sender, GETDATE())`);
            }
            emitNotification({ type: 'notification', data: { mirNo, receiver: 'PAWHRM', category: 'Material Issuance Request Rejected', form: 'ERP MOBILE', referenceno: mirNo, sender: user || null } });
        } catch (notifError) {
            console.error('Notification error:', notifError);
        }
    } catch (error) {
        console.error('Error rejecting material issuance request:', error);
        res.status(500).json({ success: false, message: 'Failed to reject material issuance request' });
    }
}