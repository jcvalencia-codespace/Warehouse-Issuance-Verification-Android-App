const { getPool } = require('../../../../config/database');
const { getCompanyDbName } = require('../../../../utils/companyDb');
const { emitMaterialIssuanceUpdate, emitNotification } = require('../../../../utils/socketEvents');


exports.getRequestsHeaderForReview = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const query = `SELECT CAST(H.DATECREATED AS DATE) AS DATECREATED,
                        (SELECT STRING_AGG(MIRNO, ', ')
                            FROM [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER] H2
                            WHERE CAST(H2.DATECREATED AS DATE) = CAST(H.DATECREATED AS DATE)
                            AND H2.POSTSTATUS = 0 AND H2.IS_APPROVED IS NULL) AS MIRNOS,
                        (SELECT STRING_AGG(REVIEWEDBY, ', ')
                            FROM (
                                SELECT DISTINCT REVIEWEDBY
                                FROM [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER] H3
                                WHERE CAST(H3.DATECREATED AS DATE) = CAST(H.DATECREATED AS DATE)
                                AND H3.POSTSTATUS = 0 AND H3.IS_APPROVED IS NULL
                            ) X) AS REVIEWEDBYS
                    FROM [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER] H
                    WHERE H.POSTSTATUS = 0 AND H.IS_APPROVED IS NULL
                    GROUP BY CAST(H.DATECREATED AS DATE)
                    ORDER BY CAST(H.DATECREATED AS DATE)`;

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
    const {dateCreated} = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const query = `;WITH DedupedHeader AS (
                        SELECT *,
                            ROW_NUMBER() OVER (PARTITION BY DATECREATED ORDER BY DATECREATED) AS RN
                        FROM [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER]
                        WHERE POSTSTATUS = 0 AND IS_APPROVED IS NULL
                    )
                    SELECT D.*, I.ITEMDESC
                    FROM [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] D
                    LEFT JOIN [IV00101] I ON D.ITEMNMBR = I.ITEMNMBR
                    INNER JOIN DedupedHeader H ON D.MIRNO = H.MIRNO
                    WHERE CAST(D.DATECREATED AS DATE) = CAST(@dateCreated AS DATE)
                    ORDER BY H.DATECREATED`;

    try {
        const result = await pool.request()
            .input('dateCreated', dateCreated)
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
    const userName = typeof user === 'string' ? user : user?.NAME || null;

    try {
        const result = await pool.request()
            .input('mirNo', mirNo)
            .input('user', userName)
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
                    .input('sender', userName || null)
                    .query(`INSERT INTO [SYSTEM.NOTIFICATIONMASTER] (RECEIVER, CATEGORY, FORM, REFERENCENO, SENDER, DATESENT)
                            VALUES (@receiver, @category, @form, @referenceNo, @sender, GETDATE())`);
            }
            emitNotification({ type: 'notification', data: { mirNo, receiver: 'PAWHRM', category: 'New Material Issuance Request', form: 'ERP MOBILE', referenceno: mirNo, sender: userName || null } });
        } catch (notifError) {
            console.error('Notification error:', notifError);
        }
    } catch (error) {
        console.error('Error approving material issuance request:', error);
        res.status(500).json({ success: false, message: 'Failed to approve material issuance request' });
    }
};

exports.approveRequestsBulk = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const { mirNos, user } = req.body || {};
    const userName = typeof user === 'string' ? user : user?.NAME || null;

    if (!Array.isArray(mirNos) || mirNos.length === 0) {
        return res.status(400).json({ success: false, message: 'mirNos array is required' });
    }

    try {
        const promises = mirNos.map((mirNo) =>
            pool.request()
                .input('mirNo', mirNo)
                .input('user', userName)
                .query(`UPDATE [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER]
                        SET POSTSTATUS = 1, IS_APPROVED = 1, MODIFIEDBY = @user, DATEMODIFIED = GETDATE()
                        WHERE MIRNO = @mirNo`)
        );
        await Promise.all(promises);

        res.json({ success: true, message: `Successfully approved ${mirNos.length} request(s)` });

        try {
            const notificationPool = await getPool('GDB');
            const usersResult = await notificationPool.request().query(`SELECT NAME FROM [SYSTEM.USERACCOUNT] WHERE NAME IN ('Jairus Valencia','Jayson Delos Reyes', 'Genesis Guinto', 'Lester A. Arceo')`);
            const users = usersResult.recordset;
            for (const recipient of users) {
                for (const mirNo of mirNos) {
                    await notificationPool.request()
                        .input('receiver', recipient.NAME)
                        .input('category', 'New Material Issuance Request')
                        .input('form', 'ERP MOBILE')
                        .input('referenceNo', mirNo)
                        .input('sender', userName || null)
                        .query(`INSERT INTO [SYSTEM.NOTIFICATIONMASTER] (RECEIVER, CATEGORY, FORM, REFERENCENO, SENDER, DATESENT)
                                VALUES (@receiver, @category, @form, @referenceNo, @sender, GETDATE())`);
                }
            }
            emitNotification({ type: 'notification', data: { mirNos, receiver: 'PAWHRM', category: 'New Material Issuance Request', form: 'ERP MOBILE', referenceno: mirNos, sender: userName || null } });
        } catch (notifError) {
            console.error('Notification error:', notifError);
        }
    } catch (error) {
        console.error('Error approving material issuance requests:', error);
        res.status(500).json({ success: false, message: 'Failed to approve material issuance requests' });
    }
};

exports.rejectRequest = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const { mirNo, user, remarks } = req.body || {};
    const userName = typeof user === 'string' ? user : user?.NAME || null;

    try {
        const result = await pool.request()
            .input('mirNo', mirNo)
            .input('user', userName)
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
                    .input('sender', userName || null)
                    .query(`INSERT INTO [SYSTEM.NOTIFICATIONMASTER] (RECEIVER, CATEGORY, FORM, REFERENCENO, SENDER, DATESENT)
                            VALUES (@receiver, @category, @form, @referenceNo, @sender, GETDATE())`);
            }
            emitNotification({ type: 'notification', data: { mirNo, receiver: 'PAWHRM', category: 'Material Issuance Request Rejected', form: 'ERP MOBILE', referenceno: mirNo, sender: userName || null } });
        } catch (notifError) {
            console.error('Notification error:', notifError);
        }
    } catch (error) {
        console.error('Error rejecting material issuance request:', error);
        res.status(500).json({ success: false, message: 'Failed to reject material issuance request' });
    }
};

exports.rejectRequestsBulk = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const { mirNos, user, remarks } = req.body || {};
    const userName = typeof user === 'string' ? user : user?.NAME || null;

    if (!Array.isArray(mirNos) || mirNos.length === 0) {
        return res.status(400).json({ success: false, message: 'mirNos array is required' });
    }

    try {
        const promises = mirNos.map((mirNo) =>
            pool.request()
                .input('mirNo', mirNo)
                .input('user', userName)
                .input('remarks', remarks)
                .query(`UPDATE [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER]
                        SET IS_APPROVED = 0, MODIFIEDBY = @user, REMARKS = @remarks, DATEMODIFIED = GETDATE()
                        WHERE MIRNO = @mirNo`)
        );
        await Promise.all(promises);

        res.json({ success: true, message: `Successfully rejected ${mirNos.length} request(s)` });
        emitMaterialIssuanceUpdate('rejected', { mirNos, company });

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
                for (const mirNo of mirNos) {
                    await notificationPool.request()
                        .input('receiver', recipient.NAME)
                        .input('category', category(remarks))
                        .input('form', 'ERP MOBILE')
                        .input('referenceNo', mirNo)
                        .input('sender', userName || null)
                        .query(`INSERT INTO [SYSTEM.NOTIFICATIONMASTER] (RECEIVER, CATEGORY, FORM, REFERENCENO, SENDER, DATESENT)
                                VALUES (@receiver, @category, @form, @referenceNo, @sender, GETDATE())`);
                }
            }
            emitNotification({ type: 'notification', data: { mirNos, receiver: 'PAWHRM', category: 'Material Issuance Request Rejected', form: 'ERP MOBILE', referenceno: mirNos, sender: userName || null } });
        } catch (notifError) {
            console.error('Notification error:', notifError);
        }
    } catch (error) {
        console.error('Error rejecting material issuance requests:', error);
        res.status(500).json({ success: false, message: 'Failed to reject material issuance requests' });
    }
};