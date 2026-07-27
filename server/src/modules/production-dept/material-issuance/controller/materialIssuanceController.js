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

exports.saveMaterialIssuanceRequest = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const { mirNo, shift, reviewedBy, createdBy,
        itemCode, quantity, dateCreated, details
    } = req.body;

    const headerQuery = `INSERT INTO [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER] (MIRNO, SHIFT, REVIEWEDBY, CREATEDBY, DATECREATED)
                     VALUES (@mirNo, @shift, @reviewedBy, @createdBy, GETDATE())`;

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

exports.postMaterialIssuance = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const { mirNo, shift, reviewedBy, modifiedBy, createdBy } = req.body;
    const postedBy = modifiedBy || createdBy || '';

    const query = `UPDATE [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER] 
                   SET MODIFIEDBY = @modifiedBy, 
                       DATEMODIFIED = GETDATE(), POSTSTATUS = 1 
                   WHERE MIRNO = @mirNo`;

    try {
        const result = await pool.request()
            .input('mirNo', mirNo)
            .input('shift', shift)
            .input('reviewedBy', reviewedBy)
            .input('modifiedBy', postedBy)
            .query(query);

        if (result.rowsAffected[0] > 0) {
            res.json({ success: true, message: 'Material issuance posted successfully', mirNo });
        } else {
            res.status(404).json({ success: false, message: 'Material issuance not found' });
        }
    } catch (error) {
        console.error('Error posting material issuance:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to post material issuance' });
    }
}

exports.updateMaterialRequest = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const { mirNo, shift, reviewedBy, modifiedBy, details } = req.body;

    if (!mirNo) {
        return res.status(400).json({ success: false, message: 'mirNo is required' });
    }

    const headerQuery = `UPDATE [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER]
                             SET SHIFT = @shift,
                                 REVIEWEDBY = @reviewedBy,
                                 MODIFIEDBY = @modifiedBy,
                                 DATEMODIFIED = GETDATE()
                             WHERE MIRNO = @mirNo`;

    const deleteDetailsQuery = `DELETE FROM [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] WHERE MIRNO = @mirNo`;

    const insertDetailsQuery = `INSERT INTO [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] (MIRNO, ITEMNMBR, QUANTITY, SERVEDBY, CREATEDBY, DATECREATED, DATEMODIFIED)
                                VALUES (@mirNo, @itemCode, @quantity, '', @createdBy, @dateCreated, GETDATE())`;

    let items = [];
    if (Array.isArray(details)) {
        items = details.map(item => ({
            itemCode: item.itemCode || item.ITEMNMBR,
            quantity: item.quantity || item.QUANTITY
        }));
    }

    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        const fetchDatesQuery = `SELECT ITEMNMBR, DATECREATED FROM [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] WHERE MIRNO = @mirNo`;
        const existingDetails = await transaction.request()
            .input('mirNo', mirNo)
            .query(fetchDatesQuery);

        const dateCreatedMap = {};
        for (const row of existingDetails.recordset) {
            dateCreatedMap[row.ITEMNMBR] = row.DATECREATED;
        }

        const headerRequest = new sql.Request(transaction);
        await headerRequest
            .input('mirNo', mirNo)
            .input('shift', shift)
            .input('reviewedBy', reviewedBy)
            .input('modifiedBy', modifiedBy || '')
            .query(headerQuery);

        const deleteRequest = new sql.Request(transaction);
        await deleteRequest
            .input('mirNo', mirNo)
            .query(deleteDetailsQuery);

        const createdBy = modifiedBy || '';

        for (const detailItem of items) {
            const detailsRequest = new sql.Request(transaction);
            await detailsRequest
                .input('mirNo', mirNo)
                .input('itemCode', detailItem.itemCode)
                .input('quantity', detailItem.quantity)
                .input('createdBy', createdBy)
                .input('dateCreated', dateCreatedMap[detailItem.itemCode] || new Date())
                .query(insertDetailsQuery);
        }

        await transaction.commit();

        return res.status(200).json({ success: true, message: 'Material issuance updated successfully', mirNo });

    } catch (error) {
        console.error('Error updating material issuance:', error);
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            console.error('Rollback failed:', rollbackError);
        }
        return res.status(500).json({ success: false, message: error.message || 'Failed to update material issuance' });
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

exports.deleteMaterialRequest = async (req, res) => {
    const { company, mirNo } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const headerQuery = `DELETE FROM [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER] WHERE MIRNO = @mirNo`;
    const detailsQuery = `DELETE FROM [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] WHERE MIRNO = @mirNo`;

    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        const headerRequest = new sql.Request(transaction);
        await headerRequest
            .input('mirNo', mirNo)
            .query(headerQuery);

        const detailsRequest = new sql.Request(transaction);
        await detailsRequest
            .input('mirNo', mirNo)
            .query(detailsQuery);

        await transaction.commit();

        return res.status(200).json({ success: true, message: 'Material issuance deleted successfully', mirNo });
    } catch (error) {
        console.error('Error deleting material issuance:', error);
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            console.error('Rollback failed:', rollbackError);
        }
        return res.status(500).json({ success: false, message: error.message || 'Failed to delete material issuance' });
    }

}
