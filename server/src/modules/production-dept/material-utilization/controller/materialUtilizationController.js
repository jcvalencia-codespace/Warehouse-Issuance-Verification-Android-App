const sql = require('mssql');
const { getPool } = require('../../../../config/database');
const { getCompanyDbName } = require('../../../../utils/companyDb');

function escapeXml(unsafe) {
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

exports.getNextUsageRefNo = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);
    try {
        const result = await pool.request().query('SELECT TOP 1 USAGENO + 1 as USAGENO FROM [PRODUCTION.USAGEHEADER] ORDER BY DATECREATED DESC');
        res.json({ success: true, usageNo: result.recordset[0]?.USAGENO });
    } catch (error) {
        console.error('Error fetching next usage no:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch next usage no' });
    }
}

exports.getMachineLines = async (req, res) => {
    const { company } = req.query;
    const pool = await getPool(getCompanyDbName(company));
    try {
        const result = await pool.request().query('SELECT MACHINELINE FROM [PRODUCTION.MACHINEMASTERLIST]');
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

exports.saveMaterialUtilization = async (req, res) => {
    try {
        const { company } = req.query;

        const dbName = getCompanyDbName(company);
        const pool = await getPool(dbName);

        const { usageDate, usageNo, usageRefNo, machineLineName, shift,
                feedType, variant, formulationNo, batchNo, remarks,
                validatedBy, weighedBy, user, details } = req.body;
            

        /* =====================================================
           VALIDATION
           ===================================================== */
           
        if (!details || !Array.isArray(details) || details.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Material utilization details are required.'
            });
        }


        /* =====================================================
           BUILD XML
           ===================================================== */

        const detailsXml = `
            <Details>
                ${details.map(detail => `
                    <Detail>
                        <itemNo>${escapeXml(detail.itemNo)}</itemNo>
                        <requiredWeight>${Number(detail.requiredWeight) || 0}</requiredWeight>
                        <weightLoaded>${Number(detail.weightLoaded) || 0}</weightLoaded>
                        <processType>${escapeXml(detail.processType)}</processType>
                        <randomSampled>${Number(detail.randomSampled) || 0}</randomSampled>
                        <qaName>${escapeXml(detail.qaName || '')}</qaName>
                        <remarks>${escapeXml(detail.remarks || '')}</remarks>
                    </Detail>
                `).join('')}
            </Details>
        `;


        /* =====================================================
           STORED PROCEDURE
           ===================================================== */

        const request = pool.request();

        request.input('UsageNo', Number(usageNo));
        request.input('UsageDate', usageDate);
        request.input('UsageRefNo', usageRefNo || null);
        request.input('MachineLineName', machineLineName);
        request.input('Shift', shift);
        request.input('FeedType', feedType);
        request.input('Variant', variant);
        request.input('FormulationNo', formulationNo);
        request.input('BatchNo', batchNo);
        request.input('Remarks', remarks || '' );
        request.input('ValidatedBy', validatedBy || null );
        request.input('WeighedBy', weighedBy || null);
        request.input('CreatedBy', user);
        request.input('Details', sql.Xml, detailsXml);


        const result = await request.execute(
            '[2026.spProducationMaterialUtilizationSave]'
        );


        /* =====================================================
           RESULT
           ===================================================== */

        const resultData = result.recordset?.[0];

        if (!resultData) {
            return res.status(500).json({
                success: false,
                message: 'No response received from stored procedure.'
            });
        }

        if (!resultData.Success) {
            console.error(
                'Material utilization SQL error:',
                resultData
            );

            return res.status(500).json({
                success: false,
                message: resultData.Message ||
                    'Failed to save material utilization.'
            });
        }


        return res.json({
            success: true,
            message: resultData.Message,
            usageNo: resultData.UsageNo,
            usageRefNo: resultData.UsageRefNo
        });

    } catch (error) {

        console.error(
            'saveMaterialUtilization failed:',
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                'Failed to save material utilization.'
        });
    }
};
