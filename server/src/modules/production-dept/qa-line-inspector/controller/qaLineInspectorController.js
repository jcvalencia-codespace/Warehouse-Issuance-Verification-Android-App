const sql = require('mssql');
const { getPool } = require('../../../../config/database');
const { getCompanyDbName } = require('../../../../utils/companyDb');

exports.getMobileAppNames = async (req, res) => {
    const { company } = 'GDB';
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);
    try {
        const result = await pool.request().query(`SELECT * FROM [SYSTEM.MOBILEAPPNAMES] WHERE LOCNCODE = 'QALINE'`);
        res.json({ success: true, mobileAppNames: result.recordset });
    } catch (err) {
        console.error('Error fetching QA approvers:', err);
        res.status(500).json({ success: false, message: 'Error fetching QA approvers' });
    }
};

exports.getMobileAppNamesByLocnCode = async (req, res) => {
    const { company } = 'GDB';
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);
    try {
        const result = await pool.request().query(`SELECT DISTINCT LOCNCODE FROM [SYSTEM.USERACCOUNT] WHERE LOCNCODE = 'QALINE'`);
        res.json({ success: true, locnCodes: result.recordset });
    } catch (err) {
        console.error('Error fetching location codes:', err);
        res.status(500).json({ success: false, message: 'Error fetching location codes' });
    }
}

exports.saveMobileAppName = async (req, res) => {
    const { company } = 'GDB';
    const { name, locnCode, createdBy } = req.body;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);
    try {
        await pool.request()
            .input('name', name)
            .input('active', 1)
            .input('locnCode', locnCode)
            .input('createdBy', createdBy || 'SYSTEM')
            .input('dateCreated', new Date())
            .query(`INSERT INTO [SYSTEM.MOBILEAPPNAMES] (NAME, ACTIVE, LOCNCODE, CREATEDBY, DATECREATED) VALUES (@name, @active, @locnCode, @createdBy, @dateCreated)`);
        res.json({ success: true, message: 'Mobile app name saved successfully' });


        const notifReceiver = ['Joenas De Guzman', 'Cesar Tolentino'];

        //----------------------------- MIS NOTIF RECEIVERS ---------------------------------
        const getNotifMisReceiversQuery = `SELECT NAME FROM [SYSTEM.USERACCOUNT] WHERE USERLEVEL = 'ADMINISTRATOR' AND ACTIVE = 1`;

        const notifMisReceiversResult = await pool.request().query(getNotifMisReceiversQuery);
        const notifMisReceivers = notifMisReceiversResult.recordset.map(row => row.NAME);

        // Combine predefined receivers and MIS receivers, removing duplicates
        const allNotifReceivers = [
            ...new Set([...notifReceiver, ...notifMisReceivers])
        ];
        //---------------------------------------------------------------------------------

        const notifMessage = `New mobile app name added for ${locnCode} by ${createdBy || 'SYSTEM'}. Name: ${name}`;

        const request = pool.request()
            .input('name', name)
            .input('message', notifMessage)
            .input('dateCreated', new Date())
            .input('createdBy', createdBy || 'SYSTEM');

        // Generate one parameter per recipient
        const receiverValues = allNotifReceivers.map((receiver, index) => {
            request.input(`receiver${index}`, receiver);
            return `(@receiver${index}, @message, 'ERP MOBILE', 'Name: ' + @name, @createdBy, @dateCreated)`;
        });

        // Insert one row per recipient
        if (receiverValues.length > 0) {
            await request.query(`INSERT INTO [SYSTEM.NOTIFICATIONMASTER]
                                (RECEIVER, CATEGORY, FORM, REFERENCENO, SENDER, DATESENT)
                                VALUES${receiverValues.join(', ')}`);
        }
    } catch (err) {
        console.error('Error saving mobile app name:', err);
        res.status(500).json({ success: false, message: 'Error saving mobile app name' });
    }
}

exports.deactivateMobileAppName = async (req, res) => {
    const { company, id, modifiedBy } = req.body;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);
    try {
        await pool.request()
            .input('id', id)
            .input('dateModified', new Date())
            .input('modifiedBy', modifiedBy || 'SYSTEM')
            .query(`UPDATE [SYSTEM.MOBILEAPPNAMES] SET ACTIVE = 0, DATEMODIFIED = @dateModified, MODIFIEDBY = @modifiedBy WHERE ROWID = @id`);
        res.json({ success: true, message: 'Mobile app name deactivated successfully' });
    } catch (err) {
        console.error('Error deactivating mobile app name:', err);
        res.status(500).json({ success: false, message: 'Error deactivating mobile app name' });
    }
}

exports.activateMobileAppName = async (req, res) => {
    const { company, id, modifiedBy } = req.body;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);
    try {
        await pool.request()
            .input('id', id)
            .input('dateModified', new Date())
            .input('modifiedBy', modifiedBy || 'SYSTEM')
            .query(`UPDATE [SYSTEM.MOBILEAPPNAMES] SET ACTIVE = 1, DATEMODIFIED = @dateModified, MODIFIEDBY = @modifiedBy WHERE ROWID = @id`);
        res.json({ success: true, message: 'Mobile app name activated successfully' });
    } catch (err) {
        console.error('Error activating mobile app name:', err);
        res.status(500).json({ success: false, message: 'Error activating mobile app name' });
    }
}

exports.updateMobileAppName = async (req, res) => {
    const { company, id, name, locnCode, modifiedBy } = req.body;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);
    try {
        await pool.request()
            .input('id', id)
            .input('name', name)
            .input('locnCode', locnCode)
            .input('dateModified', new Date())
            .input('modifiedBy', modifiedBy || 'SYSTEM')
            .query(`UPDATE [SYSTEM.MOBILEAPPNAMES] SET NAME = @name, LOCNCODE = @locnCode, DATEMODIFIED = @dateModified, MODIFIEDBY = @modifiedBy WHERE ROWID = @id`);
        res.json({ success: true, message: 'Mobile app name updated successfully' });
    } catch (err) {
        console.error('Error updating mobile app name:', err);
        res.status(500).json({ success: false, message: 'Error updating mobile app name' });
    }
}