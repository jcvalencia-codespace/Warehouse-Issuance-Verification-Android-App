const sql = require('mssql');
const { getPool } = require('../../../../config/database');
const { getCompanyDbName } = require('../../../../utils/companyDb');

exports.getItemCode = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    try {
        const result = await pool.request().query(`SELECT ITEMNMBR AS 'ITEM CODE', ITEMDESC AS 'ITEM DESCRIPTION' FROM IV00101 WHERE LOCNCODE IN ('PAWHRM', 'PAWHPMX', 'SFG')`);
        res.json({ success: true, items: result.recordset });
    } catch (error) {
        console.error('Error fetching item codes:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch item codes' });
    }

}

exports.getNextMIRNo = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    try {
        const result = await pool.request().query(`SELECT ISNULL(MAX(CAST(SUBSTRING(MIRNO, LEN('MIR-') + 1, LEN(MIRNO)) AS INT)), 0) + 1 AS nextNumber
                                                    FROM [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER] 
                                                    WHERE MIRNO LIKE 'MIR-' + '%'`);
        const nextNumber = result.recordset[0]?.nextNumber || '1';
        res.json({ success: true, mirNos: [`MIR-${nextNumber}`] });
    } catch (error) {
        console.error('Error fetching next MIR number:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch next MIR number' });
    }
}

exports.postMaterialIssuanceRequest = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const { mirNo, shift, reviewedBy, createdBy,
        itemCode, quantity, dateCreated, details
    } = req.body;

    const postStatus = req.method === 'PUT' ? 0 : 1;

    const headerQuery = `INSERT INTO [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER] (MIRNO, SHIFT, REVIEWEDBY, CREATEDBY, DATECREATED, POSTSTATUS)
                     VALUES (@mirNo, @shift, @reviewedBy, @createdBy, GETDATE(), @postStatus)`;

    const detailsQuery = `INSERT INTO [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] (MIRNO, ITEMNMBR, QUANTITY, SERVEDBY, CREATEDBY, DATECREATED)
                     VALUES (@mirNo, @itemCode, @quantity, '', @createdBy, GETDATE())`;

    let items = [];
    if (Array.isArray(details)) {
        items = details.map(item => ({
            itemCode: item.itemCode || item.ITEMNMBR,
            quantity: item.quantity || item.QUANTITY
        }));
    } else if (itemCode && quantity) {
        items = [{ itemCode, quantity }];
    }

    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        let finalMirNo = mirNo;
        let mirNoSkipped = false;

        if (mirNo) {
            const match = String(mirNo).match(/^MIR-(\d+)$/);
            if (match) {
                const baseNumber = parseInt(match[1], 10);
                let candidate = baseNumber;
                let existsResult = await pool.request()
                    .input('mirNo', `MIR-${candidate}`)
                    .query(`SELECT 1 FROM [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER] WHERE MIRNO = @mirNo`);

                while (existsResult.recordset.length > 0) {
                    mirNoSkipped = true;
                    candidate += 1;
                    existsResult = await pool.request()
                        .input('mirNo', `MIR-${candidate}`)
                        .query(`SELECT 1 FROM [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER] WHERE MIRNO = @mirNo`);
                }
                finalMirNo = `MIR-${candidate}`;
            }
        }

        const headerRequest = new sql.Request(transaction);
        await headerRequest
            .input('mirNo', finalMirNo)
            .input('shift', shift)
            .input('reviewedBy', reviewedBy)
            .input('createdBy', createdBy)
            .input('postStatus', postStatus)
            .query(headerQuery);

        for (const detailItem of items) {
            const detailsRequest = new sql.Request(transaction);
            await detailsRequest
                .input('mirNo', finalMirNo)
                .input('itemCode', detailItem.itemCode)
                .input('quantity', detailItem.quantity)
                .input('createdBy', createdBy)
                .query(detailsQuery);
        }

        await transaction.commit();
        res.json({
            success: true,
            message: mirNoSkipped ? `MIR No. ${mirNo} already exists. Saved as ${finalMirNo}.` : 'Material issuance request saved successfully',
            mirNo: finalMirNo
        });
    } catch (error) {
        try {
            if (transaction.active) {
                await transaction.rollback();
            }
        } catch (rollbackError) {
            if ((rollbackError)?.code !== 'EABORT') {
                console.error('Rollback failed:', rollbackError);
            }
        }
        console.error('materialIssuanceRequest failed:', error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ success: false, message: error.message || 'Failed to material issuance request' });
    }
}

exports.getMaterialsIssuanceRequestHeader = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const query = `SELECT * FROM [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER] WHERE POSTSTATUS = 0 ORDER BY DATECREATED DESC`;

    try {
        const result = await pool.request().query(query);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Error fetching material issuance request headers:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch material issuance request headers' });
    }
}

exports.getMaterialsIssuanceRequestDetails = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const query = `SELECT * FROM [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] WHERE MIRNO = @mirNo ORDER BY DATECREATED DESC`;

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

exports.putMaterialIssuanceRequest = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const headerQuery = `UPDATE [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER] SET SHIFT = @shift, REVIEWEDBY = @reviewedBy, MODIFIEDBY = @modifiedBy, DATEMODIFIED = @dateModified WHERE MIRNO = @mirNo`;
    
    const detailsQuery = `UPDATE [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] SET QUANTITY = @quantity, SERVEDBY = @servedBy, MODIFIEDBY = @modifiedBy, DATEMODIFIED = @dateModified WHERE MIRNO = @mirNo AND ITEMNMBR = @itemCode`;
//TODO

}
