const sql = require('mssql');
const { getPool } = require('../../../config/database');
const { sendExpoPush } = require('../../../utils/notificationService');

const TABLE_INIT_QUERY = `
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PUSHNOTIFICATION' AND TABLE_SCHEMA = 'dbo')
BEGIN
    CREATE TABLE dbo.PUSHNOTIFICATION (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        USERNAME NVARCHAR(100) NOT NULL,
        DEVICE_TOKEN NVARCHAR(500) NOT NULL,
        DEVICE_TYPE NVARCHAR(50),
        COMPANY NVARCHAR(100),
        IS_ACTIVE BIT DEFAULT 1,
        CREATED_DATE DATETIME DEFAULT GETDATE(),
        MODIFIED_DATE DATETIME DEFAULT GETDATE()
    );
    CREATE UNIQUE INDEX UX_PUSHNOTIFICATION_TOKEN ON dbo.PUSHNOTIFICATION (DEVICE_TOKEN);
END`;

const INSERT_TOKEN_QUERY = `
MERGE dbo.PUSHNOTIFICATION AS target
USING (SELECT @username AS USERNAME, @deviceToken AS DEVICE_TOKEN, @deviceType AS DEVICE_TYPE, @company AS COMPANY) AS source
ON target.DEVICE_TOKEN = source.DEVICE_TOKEN
WHEN MATCHED THEN
    UPDATE SET USERNAME = source.USERNAME, DEVICE_TYPE = source.DEVICE_TYPE, COMPANY = source.COMPANY, IS_ACTIVE = 1, MODIFIED_DATE = GETDATE()
WHEN NOT MATCHED THEN
    INSERT (USERNAME, DEVICE_TOKEN, DEVICE_TYPE, COMPANY, IS_ACTIVE, CREATED_DATE, MODIFIED_DATE)
    VALUES (source.USERNAME, source.DEVICE_TOKEN, source.DEVICE_TYPE, source.COMPANY, 1, GETDATE(), GETDATE());`;

const GET_TOKENS_QUERY = `
SELECT DEVICE_TOKEN, DEVICE_TYPE FROM dbo.PUSHNOTIFICATION WHERE IS_ACTIVE = 1`;

exports.initializeTable = async (req, res) => {
  try {
    const pool = await getPool('GDB');
    await pool.request().query(TABLE_INIT_QUERY);
    res.json({ success: true, message: 'PUSHNOTIFICATION table initialized in GDB.' });
  } catch (error) {
    console.error('Error initializing push notification table:', error);
    res.status(500).json({ success: false, message: 'Failed to initialize push notification table.' });
  }
};

exports.registerToken = async (req, res) => {
  const { username, deviceToken, deviceType, company } = req.body;

  if (!username || !deviceToken) {
    return res.status(400).json({ success: false, message: 'username and deviceToken are required.' });
  }

  try {
    const pool = await getPool('GDB');
    await pool.request().query(TABLE_INIT_QUERY);
    await pool.request()
      .input('username', sql.NVarChar, username)
      .input('deviceToken', sql.NVarChar, deviceToken)
      .input('deviceType', sql.NVarChar, deviceType || 'unknown')
      .input('company', sql.NVarChar, company || '')
      .query(INSERT_TOKEN_QUERY);
    res.json({ success: true, message: 'Push token registered successfully in GDB.' });
  } catch (error) {
    console.error('Error registering push token:', error);
    res.status(500).json({ success: false, message: 'Failed to register push token.' });
  }
};

exports.getAllTokens = async (req, res) => {
  try {
    const pool = await getPool('GDB');
    const result = await pool.request().query(GET_TOKENS_QUERY);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('Error fetching push tokens:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch push tokens.' });
  }
};

exports.sendNotification = async (req, res) => {
  const { title, body, data: extraData = {} } = req.body || {};

  if (!title || !body) {
    return res.status(400).json({ success: false, message: 'title and body are required.' });
  }

  try {
    const pool = await getPool('GDB');
    const result = await pool.request().query(GET_TOKENS_QUERY);
    const tokens = result.recordset;

    if (!tokens.length) {
      return res.json({ success: true, message: 'No active push tokens found.', sent: 0 });
    }

    const promises = tokens.map((t) =>
      sendExpoPush(t.DEVICE_TOKEN, title, body, extraData).catch((err) => {
        console.error('Push send error for token', t.DEVICE_TOKEN, err.message || err);
        return null;
      })
    );

    const results = await Promise.all(promises);
    const sentCount = results.filter((r) => r !== null).length;

    res.json({ success: true, message: `Sent to ${sentCount} devices.`, sent: sentCount });
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to send notifications.' });
  }
};
