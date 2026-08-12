const sql = require('mssql');
const { getPool } = require('../../../../config/database');
const { getCompanyDbName } = require('../../../../utils/companyDb');

exports.getTag = async (req, res) => {
    const company = req.query.company;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    try {
        const result = await pool.request().query(
             'SELECT IS_TAGGED_IN_QM4D, MODIFIEDBY, DATEMODIFIED FROM [PRODUCTION.USAGETAG]'
        );
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch tags' });
    }
};

exports.getTagValue = async (company) => {
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);
    const result = await pool.request().query(
        'SELECT TOP 1 IS_TAGGED_IN_QM4D FROM [PRODUCTION.USAGETAG]'
    );
    return result.recordset[0]?.IS_TAGGED_IN_QM4D;
};

exports.updateTag = async (req, res) => {
    const company = req.query.company;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    try {
        const { tagId, newTagValue, user } = req.body;
        await pool.request()
            .input('newTagValue', newTagValue)
            .input('user', user)
            .query(
                'UPDATE [PRODUCTION.USAGETAG] SET IS_TAGGED_IN_QM4D = @newTagValue, MODIFIEDBY = @user, DATEMODIFIED = GETDATE()'
            );
        res.json({ success: true, message: 'Tag updated successfully' });
    } catch (error) {
        console.error('Error updating tag:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to update tag' });
    }
};
