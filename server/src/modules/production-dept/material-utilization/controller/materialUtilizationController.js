const sql = require('mssql');
const { getPool } = require('../../../../config/database');
const { getCompanyDbName } = require('../../../../utils/companyDb');
const { getTagValue } = require('../../material-utilization-tag/controller/materialUtilizationTagController');

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

exports.getFeedTypes = async (req, res) => {
    const { company } = req.query;
    const pool = await getPool(getCompanyDbName(company));
    try {
        const result = await pool.request().query(`SELECT DISTINCT U.ITEMNMBR, ITEMDESC
                                                    FROM [SALES.VARIANTITEM] AS U
                                                    INNER JOIN IV00101 AS I ON U.ITEMNMBR = I.ITEMNMBR
                                                    WHERE U.IS_ACTIVE = 1
                                                    ORDER BY U.ITEMNMBR`);
        const data = result.recordset.map(r => ({ ITEMNMBR: r.ITEMNMBR, ITEMDESC: r.ITEMDESC ? r.ITEMDESC.trimEnd() : r.ITEMDESC }));
        res.json({ success: true, data });
        console.log('total feed types:', data.length);
    } catch (error) {
        console.error('Error fetching feed types:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch feed types' });
    }
}

exports.getVariantsByFeedType = async (req, res) => {
    const { company } = req.query;
    const { feedType } = req.query;
    const pool = await getPool(getCompanyDbName(company));
    try {
        const result = await pool.request()
            .input('ItemNmbr', feedType)
            .query(`SELECT VARIANTCODE, KGSPERBAG
                    FROM [SALES.VARIANTITEM]
                    WHERE IS_ACTIVE = 1 AND ITEMNMBR = @ItemNmbr
                    ORDER BY VARIANTCODE`);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Error fetching variants:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch variants' });
    }
}

exports.getItemCode = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    try {

        let tagTrueQuery = `SELECT DISTINCT D.ITEMNMBR AS 'ITEM CODE', I.ITEMDESC AS 'ITEM DESCRIPTION'
                            FROM [INVENTORY.QUANTITYMASTER3.HEADER] AS H 
                            INNER JOIN [INVENTORY.QUANTITYMASTER3.DETAILS] AS D ON H.QM_IDNUMBER = D.QM_IDNUMBER
                            INNER JOIN [IV00101] AS I ON D.ITEMNMBR = I.ITEMNMBR
                            WHERE H.LOCNCODE = 'PAWHRM'
                              AND EXISTS (
                                    SELECT *
                                    FROM [INVENTORY.QUANTITYMASTER4.DETAILS] QM4D
                                    WHERE QM4D.ITEMNMBR = D.ITEMNMBR
                                    GROUP BY QM4D.ITEMNMBR
                                    HAVING SUM(ISNULL(QM4D.QUANTITY_RECV,0) + ISNULL(QM4D.QUANTITY_PADJ,0))
                                         - SUM(ISNULL(QM4D.QUANTITY_OUT,0)  + ISNULL(QM4D.QUANTITY_NADJ,0)) > 0
                                  )
                            ORDER BY D.ITEMNMBR`;

        let tagFalseQuery = `SELECT DISTINCT D.ITEMNMBR AS 'ITEM CODE', I.ITEMDESC 'ITEM DESCRIPTION'
                             FROM [INVENTORY.QUANTITYMASTER3.HEADER] AS H 
                             INNER JOIN [INVENTORY.QUANTITYMASTER3.DETAILS] AS D ON H.QM_IDNUMBER = D.QM_IDNUMBER
                             INNER JOIN [IV00101] AS I ON D.ITEMNMBR = I.ITEMNMBR
                             WHERE (H.LOCNCODE IN ('PAWHRM'))
                             ORDER BY D.ITEMNMBR`;

        let result = '';
        const tagValue = await getTagValue(company);
        console.log('Tag Value: ' + tagValue);
        if (tagValue === 1) {
            result = await pool.request().query(tagTrueQuery);
        } else {
            result = await pool.request().query(tagFalseQuery);
        }
        console.log('total items: ' + result.recordset.length + 'tag Value: ' + tagValue);
        res.json({ success: true, items: result.recordset });
    } catch (error) {
        console.error('Error fetching item codes:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch item codes' });
    }

}

exports.getAllocation = async (req, res) => {
    const { company, itemNo, kgsUsed } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    try {
        const allocationQuery = `
            WITH Stock AS
            (
                SELECT
                    QM4D.QM4DROWID, QM4D.ITEMNMBR, QM4D.FROMISSUANCENOID, QM4D.LOTNUMBER, QM4D.QUANTITY_TRANS, QM4D.BAG_TRANS,
                    QM4D.BAGS_OUT, QM4H.DATERECEIVED,
                    SUM(QM4D.QUANTITY_TRANS) OVER (ORDER BY QM4H.DATERECEIVED, QM4D.QM4DROWID
                        ROWS UNBOUNDED PRECEDING) AS RUNNING_QTY
                FROM [INVENTORY.QUANTITYMASTER4.DETAILS] QM4D
                INNER JOIN [INVENTORY.QUANTITYMASTER4.HEADER] AS QM4H ON QM4D.TRANSREFNO = QM4H.TRANSREFNO
                WHERE QM4D.ITEMNMBR = @itemNo
            ),
            Allocation AS
            (
                SELECT *, CASE
                    WHEN RUNNING_QTY - QUANTITY_TRANS >= @kgsUsed THEN 0
                    WHEN RUNNING_QTY >= @kgsUsed THEN @kgsUsed - (RUNNING_QTY - QUANTITY_TRANS)
                    ELSE QUANTITY_TRANS END AS KGS_ALLOCATED
                FROM Stock
            )
            SELECT QM4DROWID, ITEMNMBR, FROMISSUANCENOID, LOTNUMBER,
                QUANTITY_TRANS, KGS_ALLOCATED, BAG_TRANS, BAGS_OUT,
                QUANTITY_TRANS - KGS_ALLOCATED AS REMAINING_QTY
            FROM Allocation
            WHERE KGS_ALLOCATED > 0
            ORDER BY DATERECEIVED, QM4DROWID`;

        const result = await pool.request()
            .input('itemNo', sql.VarChar(50), itemNo)
            .input('kgsUsed', sql.Int, parseInt(kgsUsed, 10) || 0)
            .query(allocationQuery);

        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Error fetching allocation:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch allocation' });
    }
};

exports.saveMaterialUtilization = async (req, res) => {
    try {
        const { company } = req.query;

        const dbName = getCompanyDbName(company);
        const pool = await getPool(dbName);

        const { usageDate, usageNo, usageRefNo, machineLineName, shift,
            feedType, variant, formulationNo, batchNo, remarks,
            validatedBy, weighedBy, user, details, subDetails } = req.body;

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
        BUILD XML FOR SUB DETAILS IF TAG VALUE IS 1 
        ===================================================== */

        let subDetailXml = '<SubDetails />';
        let transType = 0;
        const tagValue = await getTagValue(company);
        if (tagValue === 1) {
            transType = 1;

            if (!subDetails || !Array.isArray(subDetails) || subDetails.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Sub-detail allocation is required for transaction type 1.'
                });
            }

            subDetailXml = `
                <SubDetails>
                    ${subDetails.map(subDetail => `
                        <SubDetail>
                            <qm4dRowId>${Number(subDetail.qm4dRowId) || 0}</qm4dRowId>
                            <fromIssuanceNoId>${Number(subDetail.fromIssuanceNoId) || 0}</fromIssuanceNoId>
                            <itemNo>${escapeXml(subDetail.itemNo || '')}</itemNo>
                            <lotNumber>${escapeXml(subDetail.lotNumber || '')}</lotNumber>
                            <qtyOut>${Number(subDetail.qtyOut) || 0}</qtyOut>
                            <bagsOut>${Number(subDetail.bagsOut) || 0}</bagsOut>
                        </SubDetail>
                    `).join('')}
                </SubDetails>
            `;
        }


        console.log('SubDetail XML:', subDetailXml);


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
        request.input('Remarks', remarks || '');
        request.input('ValidatedBy', validatedBy || null);
        request.input('WeighedBy', weighedBy || null);
        request.input('CreatedBy', user);
        request.input('Details', sql.Xml, detailsXml);
        request.input('TRANSTYPE', sql.Int, transType);
        request.input('SubDetails', sql.Xml, subDetailXml);

        const result = await request.execute('[2026.spProducationMaterialUtilizationSave]');

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
            console.error('Material utilization SQL error:', resultData);
            return res.status(500).json({ success: false, message: resultData.Message || 'Failed to save material utilization.' });
        }


        return res.json({
            success: true,
            message: resultData.Message,
            usageNo: resultData.UsageNo,
            usageRefNo: resultData.UsageRefNo
        });

    } catch (error) {
        console.error('saveMaterialUtilization failed:', error);
        return res.status(500).json({
            success: false, message:
                error.message ||
                'Failed to save material utilization.'
        });
    }
};
