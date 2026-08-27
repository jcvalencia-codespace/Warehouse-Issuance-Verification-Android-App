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

exports.getMaterialUtilization = async (req, res) => {
    const { company } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);
    try {
        const result = await pool.request().query(`SELECT * FROM [PRODUCTION.USAGEHEADER] WHERE IS_DONE = 0`)
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Error fetching material utilization lists: ', error);
        res.json({ success: true, message: error.message || 'Failed to fetch material utilization lists' });
    }
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
                            WHERE H.LOCNCODE IN ('PAWHRM', 'PAWHPMX')
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
                             WHERE (H.LOCNCODE IN ('PAWHRM', 'PAWHPMX'))
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

exports.getBatchLists = async (req, res) => {
    const { company, usageNo } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);
    try {
        const parsedUsageNo = parseInt(usageNo, 10) || 0;

        const autoDosingResult = await pool.request()
            .input('UsageNo', sql.Int, parsedUsageNo)
            .query(`SELECT DISTINCT BATCHNO FROM [PRODUCTION.USAGEDETAILS] WHERE USAGENO = @UsageNo AND IS_DOSING_MACHINE = 1`);

        const notDosingResult = await pool.request()
            .input('UsageNo', sql.Int, parsedUsageNo)
            .query(`SELECT DISTINCT BATCHNO FROM [PRODUCTION.USAGEDETAILS] WHERE USAGENO = @UsageNo AND IS_DOSING_MACHINE = 0`);

        const totalDosingResult = await pool.request()
            .input('UsageNo', sql.Int, parsedUsageNo)
            .query(`SELECT COUNT(*) AS TotalCount FROM [PRODUCTION.USAGEBASEDETAILS] WHERE USAGENO = @UsageNo AND IS_DOSING_MACHINE = 1`);

        const totalNotDosingResult = await pool.request()
            .input('UsageNo', sql.Int, parsedUsageNo)
            .query(`SELECT COUNT(*) AS TotalCount FROM [PRODUCTION.USAGEBASEDETAILS] WHERE USAGENO = @UsageNo AND IS_DOSING_MACHINE = 0`);

        res.json({
            success: true,
            autoDosingBatchNos: autoDosingResult.recordset,
            notDosingBatchNos: notDosingResult.recordset,
            totalDosingItem: totalDosingResult.recordset[0]?.TotalCount || 0,
            totalNotDosingItem: totalNotDosingResult.recordset[0]?.TotalCount || 0,
        });
    } catch (error) {
        console.error('Error fetching batch lists:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch batch lists.' });
    }
};

exports.getMaterialUtilizationDetails = async (req, res) => {
    const { company, usageNo } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    try {
        const headerResult = await pool.request()
            .input('UsageNo', sql.Int, parseInt(usageNo, 10) || 0)
            .query(`SELECT * FROM [PRODUCTION.USAGEHEADER] WHERE USAGENO = @UsageNo`);

        const header = headerResult.recordset[0] || null;

        let details = [];
        try {
            const detailResult = await pool.request()
                .input('UsageNo', sql.Int, parseInt(usageNo, 10) || 0)
                .query(`SELECT ROWID, USAGENO, ITEMNMBR, KGSREQUIRED, IS_DOSING_MACHINE 
                        FROM [PRODUCTION.USAGEBASEDETAILS] WHERE USAGENO = @UsageNo AND IS_DOSING_MACHINE = 0
                        ORDER BY ROWID DESC`);
            details = detailResult.recordset;
        } catch (detailError) {
            console.error('Error fetching utilization details:', detailError.message);
            details = [];
        }

        if (!header) {
            return res.status(404).json({ success: false, message: 'Material utilization record not found.' });
        }

        res.json({ success: true, header, details });
    } catch (error) {
        console.error('Error fetching material utilization details:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch material utilization details' });
    }
};

exports.getMaterialUtilizationDosingMachineDetails = async (req, res) => {
    const { company, usageNo } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    try {
        const headerResult = await pool.request()
            .input('UsageNo', sql.Int, parseInt(usageNo, 10) || 0)
            .query(`SELECT * FROM [PRODUCTION.USAGEHEADER] WHERE USAGENO = @UsageNo`);

        const header = headerResult.recordset[0] || null;

        let details = [];
        try {
            const detailResult = await pool.request()
                .input('UsageNo', sql.Int, parseInt(usageNo, 10) || 0)
                .query(`SELECT ROWID, USAGENO, ITEMNMBR, KGSREQUIRED, IS_DOSING_MACHINE 
                        FROM [PRODUCTION.USAGEBASEDETAILS] WHERE USAGENO = @UsageNo AND IS_DOSING_MACHINE = 1
                        ORDER BY ROWID DESC`);
            details = detailResult.recordset;
        } catch (detailError) {
            console.error('Error fetching utilization dosing machine details:', detailError.message);
            details = [];
        }

        if (!header) {
            return res.status(404).json({ success: false, message: 'Material utilization record not found.' });
        }

        res.json({ success: true, header, details });
    } catch (error) {
        console.error('Error fetching material utilization details:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch material utilization details' });
    }
};

exports.getNextBatchNo = async (req, res) => {
    const { company, usageNo, isDosingMachine } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    try {
        const parsedUsageNo = parseInt(usageNo, 10) || 0;
        const parsedIsDosingMachine = isDosingMachine === 'true' || isDosingMachine === true ? 1 : 0;
        const result = await pool.request()
            .input('UsageNo', sql.Int, parsedUsageNo)
            .input('IsDosingMachine', sql.TinyInt, parsedIsDosingMachine)
            .query(`SELECT TOP 1 BATCHNO FROM [PRODUCTION.USAGEDETAILS] WHERE USAGENO = @UsageNo AND IS_DOSING_MACHINE = @IsDosingMachine ORDER BY PUDROWID DESC`);

        const latestBatchNo = result.recordset[0]?.BATCHNO || 0;
        res.json({ success: true, batchNo: latestBatchNo });
    } catch (error) {
        console.error('Error fetching next batch number:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch next batch number.' });
    }
};

exports.getBatchDetails = async (req, res) => {
    const { company, usageNo, batchNo, isDosingMachine } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    try {
        const parsedUsageNo = parseInt(usageNo, 10) || 0;
        const parsedBatchNo = parseInt(batchNo, 10) || 0;
        const parsedIsDosingMachine = isDosingMachine === 'true' || isDosingMachine === true ? 1 : 0;

        const result = await pool.request()
            .input('UsageNo', sql.Int, parsedUsageNo)
            .input('BatchNo', sql.Int, parsedBatchNo)
            .input('IsDosingMachine', sql.TinyInt, parsedIsDosingMachine)
            .query(`SELECT BATCHNO, ITEMNMBR, KGSREQUIRED, KGSUSED,
                           PROCESS, IS_DOSING_MACHINE, WEIGHEDBY, VALIDATEDBY,
                           IS_RANDOMSAMPLED, RANDOMSAMPLEDBY, PUDROWID
                    FROM [PRODUCTION.USAGEDETAILS]
                    WHERE USAGENO = @UsageNo AND BATCHNO = @BatchNo AND IS_DOSING_MACHINE = @IsDosingMachine
                    ORDER BY PUDROWID DESC`);

        res.json({
            success: true,
            batchDetails: result.recordset,
        });
    } catch (error) {
        console.error('Error fetching batch details:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch batch details.' });
    }
};

exports.getAllocation = async (req, res) => {
    const { company, itemNo, kgsUsed } = req.query;
    const dbName = getCompanyDbName(company);
    const pool = await getPool(dbName);

    try {
        const allocationQuery = `
            WITH Stock AS
            (
                SELECT
                    QM4D.QM4DROWID, QM4D.ITEMNMBR, QM4D.FROMISSUANCENOID, QM4D.LOTNUMBER,
                    QM4D.QUANTITY_RECV, QM4D.QUANTITY_PADJ, QM4D.QUANTITY_NADJ, QM4D.QUANTITY_OUT,
                    QM4D.BAG_TRANS, QM4D.BAGS_OUT, QM4H.DATERECEIVED,
                    ((QM4D.QUANTITY_RECV + QM4D.QUANTITY_PADJ) - (QM4D.QUANTITY_OUT + QM4D.QUANTITY_NADJ)) AS BALANCE,
                    -- only sum positive balances into the running total; negative lines don't add "available stock"
                    SUM(CASE WHEN ((QM4D.QUANTITY_RECV + QM4D.QUANTITY_PADJ) - (QM4D.QUANTITY_OUT + QM4D.QUANTITY_NADJ)) > 0
                            THEN ((QM4D.QUANTITY_RECV + QM4D.QUANTITY_PADJ) - (QM4D.QUANTITY_OUT + QM4D.QUANTITY_NADJ))
                            ELSE 0 END)
                        OVER (ORDER BY QM4H.DATERECEIVED, QM4D.QM4DROWID
                            ROWS UNBOUNDED PRECEDING) AS RUNNING_QTY
                FROM [INVENTORY.QUANTITYMASTER4.DETAILS] QM4D
                INNER JOIN [INVENTORY.QUANTITYMASTER4.HEADER] AS QM4H ON QM4D.TRANSREFNO = QM4H.TRANSREFNO
                WHERE QM4D.ITEMNMBR = @itemNo
            ),
            RawAllocation AS
            (
                SELECT *,
                    CASE WHEN BALANCE <= 0 THEN 0
                        WHEN RUNNING_QTY - BALANCE >= @kgsUsed THEN 0
                        WHEN RUNNING_QTY >= @kgsUsed THEN @kgsUsed - (RUNNING_QTY - BALANCE)
                        ELSE BALANCE END AS RAW_KGS_ALLOCATED
                FROM Stock
            ),
            Allocation AS
            (
                SELECT *,
                    CASE
                        -- if the leftover after a partial allocation is a tiny dust amount, just take the whole balance
                        WHEN RAW_KGS_ALLOCATED > 0
                            AND (BALANCE - RAW_KGS_ALLOCATED) BETWEEN 0.00001 AND 0.99999
                        THEN BALANCE
                        ELSE RAW_KGS_ALLOCATED
                    END AS KGS_ALLOCATED
                FROM RawAllocation
            )
            SELECT QM4DROWID, ITEMNMBR, FROMISSUANCENOID, LOTNUMBER,
                BALANCE, RUNNING_QTY, KGS_ALLOCATED, BAG_TRANS, BAGS_OUT,
                BALANCE - KGS_ALLOCATED AS REMAINING_QTY
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
            validatedBy, weighedBy, user, transType, baseDetails, details } = req.body;

        /* =====================================================
           VALIDATION
           ===================================================== */

        if (transType === 1) {
            if (!baseDetails || !Array.isArray(baseDetails) || baseDetails.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Base details are required.'
                });
            }
        } else if (transType === 2) {
            if (!details || !Array.isArray(details) || details.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Material utilization details are required.'
                });
            }
        }

        /* =====================================================
        BUILD BASEDETAILS XML (TRANSTYPE 1: header + base detail)
        ===================================================== */

        let baseDetailsXml = '<BaseDetails />';
        if (transType === 1) {
            baseDetailsXml = `
                <BaseDetails>
                    ${baseDetails.map(bd => `
                        <BaseDetail>
                            <itemNo>${escapeXml(bd.itemNo)}</itemNo>
                            <requiredWeight>${Number(bd.requiredWeight) || 0}</requiredWeight>
                             <isDosingMachine>${Number(bd.isAutoDosing) || 0}</isDosingMachine>
                        </BaseDetail>
                    `).join('')}
                </BaseDetails>
            `;
        }


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
        request.input('BaseDetails', sql.Xml, baseDetailsXml);
        // request.input('Details', sql.Xml, detailsXml);
        // request.input('SubDetails', sql.Xml, subDetailXml);
        request.input('TRANSTYPE', sql.Int, transType);

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

exports.saveBatchingMaterialUtilization = async (req, res) => {
    const { company } = req.query;
    const { usageNo, user, transType, details, subDetails } = req.body;

    if (!company) {
        return res.status(400).json({ success: false, message: 'company is required.' });
    }
    if (!user) {
        return res.status(400).json({ success: false, message: 'user is required.' });
    }

    try {
        const dbName = getCompanyDbName(company);
        const pool = await getPool(dbName);

        let detailsXml = '<Details />';
        if (transType === 2) {
            if (!Array.isArray(details) || details.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'details is required for transaction type 2.'
                });
            }

            detailsXml = `
                <Details>
                    ${details.map(detail => `
                        <Detail>
                            <itemNo>${escapeXml(detail.itemNo)}</itemNo>
                            <isDosingMachine>${Number(detail.isDosingMachine) || 0}</isDosingMachine>
                            <batchNo>${Number(detail.batchNo) || 0}</batchNo>
                            <requiredWeight>${Number(detail.requiredWeight) || 0}</requiredWeight>
                            <weightLoaded>${Number(detail.weightLoaded) || 0}</weightLoaded>
                            <processType>${escapeXml(detail.processType)}</processType>
                            <weighedBy>${escapeXml(detail.weighedBy)}</weighedBy>
                            <ValidatedBy>${escapeXml(detail.ValidatedBy)}</ValidatedBy>
                            <randomSampled>${Number(detail.randomSampled) || 0}</randomSampled>
                            <qaName>${escapeXml(detail.qaName || '')}</qaName>
                            <remarks>${escapeXml(detail.remarks || '')}</remarks>
                        </Detail>
                    `).join('')}
                </Details>
            `;

            console.log('data to insert:', JSON.stringify(details.map(d => ({
                itemNo: d.itemNo,
                isDosingMachine: d.isDosingMachine,
                batchNo: d.batchNo,
                requiredWeight: d.requiredWeight,
                weightLoaded: d.weightLoaded,
                processType: d.processType,
                randomSampled: d.randomSampled,
                qaName: d.qaName,
                remarks: d.remarks
            })), null, 2));
        }

        let allocated = 0;
        let subDetailXml = '<SubDetails />';
        const tagValue = await getTagValue(company);
        if (tagValue === 1) {
            if (!Array.isArray(subDetails) || subDetails.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Sub-detail allocation is required for transaction type 1.'
                });
            }
            allocated = 1;

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

        const request = pool.request();
        request.input('TRANSTYPE', transType);
        request.input('UsageNo', sql.NVarChar, usageNo);
        request.input('Details', sql.Xml, detailsXml);
        request.input('ALLOCATED', sql.Int, allocated);
        request.input('SubDetails', sql.Xml, subDetailXml);
        request.input('CreatedBy', sql.NVarChar, user);

        // Replace with your actual stored procedure name
        const result = await request.execute('[2026.spProducationMaterialUtilizationSave]');

        const row = result.recordset && result.recordset[0];

        if (!row || row.Success === false || row.Success === 0) {
            console.error('SP reported failure:', row);
            return res.status(400).json({
                success: false,
                message: row?.Message || 'Stored procedure reported failure with no message.',
                errorNumber: row?.ErrorNumber,
                errorLine: row?.ErrorLine,
                errorProcedure: row?.ErrorProcedure
            });
        }

        return res.status(200).json({ success: true, data: row });

    } catch (error) {
        console.error('saveBatchingMaterialUtilization error:', {
            message: error.message,
            number: error.number,
            originalError: error.originalError?.info || error.originalError,
            precedingErrors: error.precedingErrors
        });
        return res.status(500).json({
            success: false,
            message: error.originalError?.info?.message || error.message || 'Failed to save batching material utilization.'
        });
    }
};

exports.updateBatchingMaterialUtilization = async (req, res) => {
    const { company } = req.query;
    const { usageNo, user, transType, details } = req.body;

    try {
        const dbName = getCompanyDbName(company);
        const pool = await getPool(dbName);

        if (transType !== 3) {
            return res.status(400).json({
                success: false,
                message: 'Invalid transType for update operation. Expected 3.'
            });
        }

        if (!Array.isArray(details) || details.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'details is required for transaction type 3.'
            });
        }

        // Ensure every detail has a pudRowId, since update matches on it
        const missingPudRowId = details.some(d => d.pudRowId === undefined || d.pudRowId === null || d.pudRowId === '');
        if (missingPudRowId) {
            return res.status(400).json({
                success: false,
                message: 'pudRowId is required on every detail for update.'
            });
        }

        const detailsXml = `
            <Details>
                ${details.map(detail => `
                    <Detail>
                        <pudRowId>${Number(detail.pudRowId)}</pudRowId>
                        <itemNo>${escapeXml(detail.itemNo)}</itemNo>
                        <isDosingMachine>${Number(detail.isDosingMachine) || 0}</isDosingMachine>
                        <batchNo>${Number(detail.batchNo) || 0}</batchNo>
                        <requiredWeight>${Number(detail.requiredWeight) || 0}</requiredWeight>
                        <weightLoaded>${Number(detail.weightLoaded) || 0}</weightLoaded>
                        <processType>${escapeXml(detail.processType)}</processType>
                        <weighedBy>${escapeXml(detail.weighedBy)}</weighedBy>
                        <ValidatedBy>${escapeXml(detail.ValidatedBy)}</ValidatedBy>
                        <randomSampled>${Number(detail.randomSampled) || 0}</randomSampled>
                        <qaName>${escapeXml(detail.qaName || '')}</qaName>
                        <remarks>${escapeXml(detail.remarks || '')}</remarks>
                    </Detail>
                `).join('')}
            </Details>
        `;

        const request = pool.request();
        request.input('TRANSTYPE', sql.Int, transType);
        request.input('UsageNo', sql.NVarChar, usageNo);
        request.input('Details', sql.Xml, detailsXml);
        request.input('ModifiedBy', sql.NVarChar, user);

        const result = await request.execute('[2026.spProducationMaterialUtilizationSave]');

        const row = result.recordset && result.recordset[0];

        if (!row || row.Success === false || row.Success === 0) {
            console.error('SP reported failure:', row);
            return res.status(400).json({
                success: false,
                message: row?.Message || 'Stored procedure reported failure with no message.',
                errorNumber: row?.ErrorNumber,
                errorLine: row?.ErrorLine,
                errorProcedure: row?.ErrorProcedure
            });
        }

        return res.status(200).json({ success: true, data: row });
    } catch (error) {
        console.error('updateBatchingMaterialUtilization error:', {
            message: error.message,
            number: error.number,
            originalError: error.originalError?.info || error.originalError,
            precedingErrors: error.precedingErrors
        });
        return res.status(500).json({
            success: false,
            message: error.originalError?.info?.message || error.message || 'Failed to update batching material utilization.'
        });
    }
};
