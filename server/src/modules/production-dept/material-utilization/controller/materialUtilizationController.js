const sql = require('mssql');
const { getPool } = require('../../../../config/database');
const { getCompanyDbName } = require('../../../../utils/companyDb');

exports.getNextUsageRefNo = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);
    try {
        const result = await pool.request().query('SELECT TOP 1 USAGENO + 1 as USAGENO FROM [PRODUCTION.USAGEHEADER] ORDER BY DATECREATED DESC');
        res.json({ success: true, usageRefNo: result.recordset[0]?.USAGENO });
    } catch (error) {
        console.error('Error fetching next usage ref no:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch next usage ref no' });
    }
}

exports.getMachineLines = async (req, res) => {
    const { company } = req.query;
    const pool = await getPool(getCompanyDbName(company));
    try {
        const result = await pool.request().query('SELECT DISTINCT MACHINELINE FROM [PRODUCTION.USAGEHEADER] ORDER BY MACHINELINE');
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Error fetching machine lines:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch machine lines' });
    }
}

exports.getFeedTypesAndVariant = async (req, res) => {
    const { company } = req.query;
    const pool = await getPool(getCompanyDbName(company));
    try {
        const result = await pool.request().query(`SELECT [SALES.VARIANTITEM].ITEMNMBR, RTRIM(IV00101.ITEMDESC) AS ITEMDESC, [SALES.VARIANTITEM].VARIANTCODE, [SALES.VARIANTITEM].KGSPERBAG
                                                    FROM [SALES.VARIANTITEM] INNER JOIN
                                                    IV00101 ON [SALES.VARIANTITEM].ITEMNMBR = IV00101.ITEMNMBR
                                                    WHERE [SALES.VARIANTITEM].IS_ACTIVE = 1
                                                    ORDER BY [SALES.VARIANTITEM].ITEMNMBR, [SALES.VARIANTITEM].VARIANTCODE`);
        res.json({ success: true, feedTypes: result.recordset });
    } catch (error) {
        console.error('Error fetching feed types:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch feed types' });
    }
}

exports.getFormulations = async (req, res) => {
    const { company, feedType, variant } = req.query;
    const pool = await getPool(getCompanyDbName(company));
    try {
        const result = await pool.request()
            .input('feedType', feedType)
            .input('variant', variant)
            .query(`SELECT FORMULATION_ID, FORMULATION_NO, FORMULATION_NAME FROM [PRODUCTION.FORMULATION] WHERE FEED_TYPE = @feedType AND VARIANT = @variant AND IS_ACTIVE = 1 ORDER BY FORMULATION_NO`);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Error fetching formulations:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch formulations' });
    }
}

exports.getFormulationMaterials = async (req, res) => {
    const { company } = req.query;
    const { formulationNo } = req.params;
    const pool = await getPool(getCompanyDbName(company));
    try {
        const result = await pool.request()
            .input('formulationNo', formulationNo)
            .query(`SELECT ITEM_NO, ITEM_DESCRIPTION, REQUIRED_WEIGHT FROM [PRODUCTION.FORMULATION_DETAILS] WHERE FORMULATION_NO = @formulationNo ORDER BY ITEM_NO`);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Error fetching formulation materials:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch formulation materials' });
    }
}

exports.saveMaterialUtilization = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    const { usageDate, usageRefNo, machineLineName, shift, feedType, variant, formulationNo, batchNo, remarks, validatedBy, weighedBy, details } = req.body;

    const headerQuery = `INSERT INTO [PRODUCTION.USAGEHEADER] (USAGENO, USAGEDATE, MACHINELINE, SHIFT, FEEDTYPE, VARIANT, FORMULATIONNO, BATCHNO, REMARKS, VALIDATEDBY, WEIGHEDBY, POSTSTATUS, DATECREATED)
                     VALUES (@usageRefNo, @usageDate, @machineLineName, @shift, @feedType, @variant, @formulationNo, @batchNo, @remarks, @validatedBy, @weighedBy, 1, GETDATE())`;

    const detailsQuery = `INSERT INTO [PRODUCTION.USAGEDETAILS] (USAGENO, ITEMNO, REQUIREDWEIGHT, WEIGHTLOADED, PROCESSTYPE, RANDOMSAMPLED, QANAME, DATECREATED)
                      VALUES (@usageRefNo, @itemNo, @requiredWeight, @weightLoaded, @processType, @randomSampled, @qaName, GETDATE())`;

    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        const headerRequest = new sql.Request(transaction);
        await headerRequest
            .input('usageRefNo', usageRefNo)
            .input('usageDate', usageDate)
            .input('machineLineName', machineLineName)
            .input('shift', shift)
            .input('feedType', feedType)
            .input('variant', variant)
            .input('formulationNo', formulationNo)
            .input('batchNo', batchNo)
            .input('remarks', remarks || '')
            .input('validatedBy', validatedBy)
            .input('weighedBy', weighedBy)
            .query(headerQuery);

        for (const detailItem of details) {
            const detailsRequest = new sql.Request(transaction);
            await detailsRequest
                .input('usageRefNo', usageRefNo)
                .input('itemNo', detailItem.itemNo)
                .input('requiredWeight', detailItem.requiredWeight)
                .input('weightLoaded', detailItem.weightLoaded)
                .input('processType', detailItem.processType)
                .input('randomSampled', detailItem.randomSampled ? 1 : 0)
                .input('qaName', detailItem.qaName || '')
                .query(detailsQuery);
        }

        await transaction.commit();
        res.json({
            success: true,
            message: 'Material utilization saved successfully',
            usageRefNo: usageRefNo
        });
    } catch (error) {
        try {
            if (transaction.active) {
                await transaction.rollback();
            }
        } catch (rollbackError) {
            console.error('Rollback failed:', rollbackError);
        }
        console.error('saveMaterialUtilization failed:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to save material utilization' });
    }
}

