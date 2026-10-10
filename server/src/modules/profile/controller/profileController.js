const sql = require('mssql');
const { getPool } = require('../../../config/database');
const { getCompanyDbName } = require('../../../utils/companyDb');

exports.getMobileAppNames = async (req, res) => {
    const { company } = 'GDB';
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);
    try {
        const result = await pool.request().query(`SELECT * FROM [SYSTEM.MOBILEAPPNAMES] WHERE ACTIVE = '1'`);
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
        const result = await pool.request().query(`SELECT DISTINCT LOCNCODE FROM [SYSTEM.USERACCOUNT]`);
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
    } catch (err) {
        console.error('Error saving mobile app name:', err);
        res.status(500).json({ success: false, message: 'Error saving mobile app name' });
    }
}

exports.deactivateMobileAppName = async (req, res) => {
    const { company, id } = req.body;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);
    try {
       await pool.request()
            .input('id', id)
            .query(`UPDATE [SYSTEM.MOBILEAPPNAMES] SET ACTIVE = 0 WHERE ROWID = @id`);
        res.json({ success: true, message: 'Mobile app name deactivated successfully' });
    } catch (err) {
        console.error('Error deactivating mobile app name:', err);
        res.status(500).json({ success: false, message: 'Error deactivating mobile app name' });
    }
}