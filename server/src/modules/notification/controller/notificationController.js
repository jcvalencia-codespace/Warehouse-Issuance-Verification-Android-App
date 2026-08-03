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
