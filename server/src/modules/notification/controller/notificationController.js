const { getPool } = require('../../../config/database');
const { getCompanyDbName } = require('../../../utils/companyDb');

exports.getNotifications = async (req, res) => {
    const { user } = req.query;
    const receiver = user || 'SYSTEM';
    const pool = await getPool('GDB');

    try {
        const result = await pool.request()
            .input('receiver', receiver)
            .query(`SELECT ROWID, RECEIVER, CATEGORY, FORM, REFERENCENO, SENDER, DATESENT
                    FROM [SYSTEM.NOTIFICATIONMASTER]
                    WHERE RECEIVER = @receiver AND FORM = 'ERP MOBILE'
                    ORDER BY DATESENT DESC`);
        res.json({ success: true, notifications: result.recordset });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
};

exports.setAcknowledged = async (req, res) => {
    const { user, rowId } = req.query;
    const pool = await getPool('GDB');
    const transaction = pool.transaction();

    try {
        await transaction.begin();

        const insertResult = await transaction.request()
            .input('rowId', rowId)
            .query(`
                INSERT INTO [SYSTEM.NOTIFICATIONMASTERHISTORY]
                    (RECEIVER, CATEGORY, FORM, REFERENCENO, SENDER, DATESENT, DATEACKNOWLEDGE, IS_ARCHIVEDBYSYSTEM)
                SELECT
                    RECEIVER, CATEGORY, FORM, REFERENCENO, SENDER, DATESENT, GETDATE(), 0
                FROM [SYSTEM.NOTIFICATIONMASTER]
                WHERE ROWID = @rowId
            `);

        await transaction.request()
            .input('rowId', rowId)
            .query(`DELETE FROM [SYSTEM.NOTIFICATIONMASTER] WHERE ROWID = @rowId`);

        await transaction.commit();

        res.json({ success: true, acknowledged: insertResult.rowsAffected[0] > 0 });
    } catch (error) {
        await transaction.rollback();
        console.error('Error acknowledgement: ', error);
        res.status(500).json({ success: false, message: 'Failed to Acknowledge notification' });
    }
}
