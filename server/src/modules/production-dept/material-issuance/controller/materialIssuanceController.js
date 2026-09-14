const sql = require('mssql');
const { getPool } = require('../../../../config/database');
const { getCompanyDbName } = require('../../../../utils/companyDb');
const { emitMaterialIssuanceUpdate, emitNotification } = require('../../../../utils/socketEvents');
const { sendExpoPush } = require('../../../../utils/notificationService');

exports.getItemCode = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    try {
        const result = await pool.request().query(`SELECT DISTINCT D.ITEMNMBR AS 'ITEM CODE', I.ITEMDESC 'ITEM DESCRIPTION'
                                                    FROM [INVENTORY.QUANTITYMASTER3.HEADER] AS H 
                                                    INNER JOIN [INVENTORY.QUANTITYMASTER3.DETAILS] AS D ON H.QM_IDNUMBER = D.QM_IDNUMBER
                                                    INNER JOIN [IV00101] AS I ON D.ITEMNMBR = I.ITEMNMBR
                                                    WHERE (H.LOCNCODE IN ('PAWHRM'))
                                                    ORDER BY D.ITEMNMBR`);
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

exports.getMIRForEdit = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    try {
        const result = await pool.request().query(`SELECT MIRNO, SHIFT, REVIEWEDBY, CREATEDBY, DATECREATED, 
                                                   IS_APPROVED, REMARKS, POSTSTATUS 
                                                   FROM [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER] WHERE IS_APPROVED = 0 AND POSTSTATUS = 0`);
        res.json({success: true, forEdit: result.recordset})
    } catch (error) {
        console.error('Error fetching MIR for edit:', error);
        res.status(500).json({success: false, message: 'Failed to fetch MIR for edit'});
    }
}

exports.getMIRDetailsForEdit = async (req, res) => {
    const { company } = req.query;
    const { mirNo } = req.params;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    try {
        const headerResult = await pool.request()
            .input('mirNo', mirNo)
            .query(`SELECT MIRNO, SHIFT, REVIEWEDBY, CREATEDBY, DATECREATED, IS_APPROVED, REMARKS, POSTSTATUS 
                    FROM [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER] WHERE MIRNO = @mirNo`);

        if (headerResult.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'MIR not found' });
        }

        const detailsResult = await pool.request()
            .input('mirNo', mirNo)
            .query(`SELECT D.MIRNO, D.ITEMNMBR,I.ITEMDESC, D.QUANTITY, D.CREATEDBY, D.DATECREATED
                    FROM [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] D
                    LEFT JOIN [IV00101] I ON D.ITEMNMBR = I.ITEMNMBR
                    WHERE D.MIRNO = @mirNo`);

        res.json({
            success: true,
            header: headerResult.recordset[0],
            details: detailsResult.recordset
        });
    } catch (error) {
        console.error('Error fetching MIR details for edit:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch MIR details for edit' });
    }
}

exports.saveMaterialIssuanceRequest = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const { mirNo, shift, reviewedBy, createdBy,
        itemCode, quantity, dateCreated, details
    } = req.body;

    const headerQuery = `INSERT INTO [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER] (MIRNO, SHIFT, REVIEWEDBY, CREATEDBY, POSTSTATUS, DATECREATED)
                     VALUES (@mirNo, @shift, @reviewedBy, @createdBy, 0, GETDATE())`;

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
        emitMaterialIssuanceUpdate('posted', { mirNo: finalMirNo, shift, reviewedBy, createdBy, company });
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

exports.updateMaterialIssuanceRequest = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const { mirNo, shift, reviewedBy, createdBy, remarks, details } = req.body;

    if (!mirNo) {
        return res.status(400).json({ success: false, message: 'MIR No. is required for update' });
    }

    let items = [];
    if (Array.isArray(details)) {
        items = details.map(item => ({
            itemCode: item.itemCode || item.ITEMNMBR,
            quantity: item.quantity || item.QUANTITY
        }));
    }

    const headerQuery = `UPDATE [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER]
                         SET SHIFT = @shift,
                             REVIEWEDBY = @reviewedBy,
                             REMARKS = @remarks,
                             IS_APPROVED = NULL,
                             MODIFIEDBY = @createdBy,
                             DATEMODIFIED = GETDATE()
                         WHERE MIRNO = @mirNo`;

    const deleteDetailsQuery = `DELETE FROM [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] WHERE MIRNO = @mirNo`;

    const insertDetailsQuery = `INSERT INTO [PRODUCTION.MATERIALISSUANCEREQUEST.DETAILS] (MIRNO, ITEMNMBR, QUANTITY, SERVEDBY, CREATEDBY, DATECREATED)
                                VALUES (@mirNo, @itemCode, @quantity, '', @createdBy, @dateCreated)`;

    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        const dateCreatedResult = await pool.request()
            .input('mirNo', mirNo)
            .query(`SELECT DATECREATED FROM [PRODUCTION.MATERIALISSUANCEREQUEST.HEADER] WHERE MIRNO = @mirNo`);

        const originalDateCreated = dateCreatedResult.recordset[0]?.DATECREATED || null;

        const headerRequest = new sql.Request(transaction);
        await headerRequest
            .input('mirNo', mirNo)
            .input('shift', shift)
            .input('reviewedBy', reviewedBy)
            .input('remarks', remarks || null)
            .input('createdBy', createdBy)
            .query(headerQuery);

        const deleteRequest = new sql.Request(transaction);
        await deleteRequest
            .input('mirNo', mirNo)
            .query(deleteDetailsQuery);

        for (const detailItem of items) {
            const detailsRequest = new sql.Request(transaction);
            await detailsRequest
                .input('mirNo', mirNo)
                .input('itemCode', detailItem.itemCode)
                .input('quantity', detailItem.quantity)
                .input('createdBy', createdBy)
                .input('dateCreated', originalDateCreated)
                .query(insertDetailsQuery);
        }

        await transaction.commit();
        res.json({
            success: true,
            message: 'Material issuance request updated successfully',
            mirNo: mirNo
        });
        emitMaterialIssuanceUpdate('updated', { mirNo, shift, reviewedBy, createdBy, company });
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
        console.error('updateMaterialIssuanceRequest failed:', error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ success: false, message: error.message || 'Failed to update material issuance request' });
    }
}
