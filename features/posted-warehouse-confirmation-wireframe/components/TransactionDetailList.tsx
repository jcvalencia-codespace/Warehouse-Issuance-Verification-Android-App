import { Colors } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View
} from 'react-native';
import { TransactionDetail } from '../types/confirmation.types';

interface TransactionDetailListProps {
  details: TransactionDetail[];
  loading?: boolean;
  // Header information
  transRefNo?: string;
  issuedBy?: string;
  transDate?: string;
  receivedBy?: string;
}

export function TransactionDetailList({ 
  details, 
  loading = false,
  transRefNo,
  issuedBy,
  transDate,
  receivedBy
}: TransactionDetailListProps) {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const IS_TABLET = SCREEN_WIDTH > 768;
  const IS_PORTRAIT = SCREEN_HEIGHT > SCREEN_WIDTH;
  const IS_LANDSCAPE = !IS_PORTRAIT;
  const IS_SMALL_SCREEN = SCREEN_WIDTH < 380;

  // Responsive column widths based on tablet and orientation
  // Maximize width in landscape by using wider columns
  const COL_WIDTHS = {
    colNo: IS_TABLET ? (IS_LANDSCAPE ? 55 : 50) : (IS_LANDSCAPE ? 45 : 35),
    colItemCode: IS_TABLET ? (IS_LANDSCAPE ? 180 : 160) : (IS_LANDSCAPE ? 150 : 120),
    colLotNumber: IS_TABLET ? (IS_LANDSCAPE ? 220 : 200) : (IS_LANDSCAPE ? 180 : 150),
    colUofm: IS_TABLET ? (IS_LANDSCAPE ? 80 : 70) : (IS_LANDSCAPE ? 65 : 50),
    colBagsIssued: IS_TABLET ? (IS_LANDSCAPE ? 90 : 80) : (IS_LANDSCAPE ? 75 : 60),
    colBagsReceived: IS_TABLET ? (IS_LANDSCAPE ? 100 : 90) : (IS_LANDSCAPE ? 80 : 65),
    colQtyIssued: IS_TABLET ? (IS_LANDSCAPE ? 110 : 100) : (IS_LANDSCAPE ? 90 : 70),
    colQtyReceived: IS_TABLET ? (IS_LANDSCAPE ? 110 : 100) : (IS_LANDSCAPE ? 90 : 70),
    colUnitCost: IS_TABLET ? (IS_LANDSCAPE ? 100 : 90) : (IS_LANDSCAPE ? 80 : 60),
    colActualCost: IS_TABLET ? (IS_LANDSCAPE ? 110 : 100) : (IS_LANDSCAPE ? 90 : 70),
  };

  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={[styles.loadingCard, { backgroundColor: colors.cardBackground }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading transaction details...
          </Text>
        </View>
      </View>
    );
  }

  if (details.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground }]}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.textTertiary + '15' }]}>
            <MaterialCommunityIcons
              name="clipboard-text-off-outline"
              size={56}
              color={colors.textTertiary}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Details Found
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            This transaction has no item details
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Transaction Header Information */}
      {(transRefNo || issuedBy || transDate || receivedBy) && (
        <View style={[styles.headerSection, { backgroundColor: colors.cardBackground, borderBottomColor: colors.divider, paddingHorizontal: IS_TABLET ? (IS_LANDSCAPE ? 12 : 20) : (IS_LANDSCAPE ? 8 : 12), paddingVertical: IS_TABLET ? (IS_LANDSCAPE ? 8 : 16) : (IS_LANDSCAPE ? 6 : 12) }]}>
          <View style={[styles.headerGrid, { flexWrap: IS_LANDSCAPE ? 'nowrap' : 'wrap', gap: IS_TABLET ? (IS_LANDSCAPE ? 12 : 16) : (IS_LANDSCAPE ? 8 : 12) }]}>
            {transRefNo && (
              <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 180 : 200) : (IS_LANDSCAPE ? 150 : (SCREEN_WIDTH - 48) / 2), flex: IS_TABLET ? 1 : undefined, maxWidth: IS_TABLET ? (IS_LANDSCAPE ? 280 : 280) : (IS_LANDSCAPE ? '48%' : '48%') }]}>
                <View style={[styles.headerIconContainer, { backgroundColor: colors.primary + '15', width: IS_TABLET ? (IS_LANDSCAPE ? 28 : 36) : (IS_LANDSCAPE ? 24 : 36), height: IS_TABLET ? (IS_LANDSCAPE ? 28 : 36) : (IS_LANDSCAPE ? 24 : 36), borderRadius: IS_TABLET ? (IS_LANDSCAPE ? 6 : 10) : (IS_LANDSCAPE ? 6 : 10), marginRight: IS_LANDSCAPE ? 6 : 10 }]}>
                  <MaterialCommunityIcons name="file-document-outline" size={IS_LANDSCAPE ? 14 : 18} color={colors.primary} />
                </View>
                <View style={styles.headerContent}>
                  <Text style={[styles.headerLabel, { color: colors.textTertiary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 9 : 11) : (IS_LANDSCAPE ? 8 : 10) }]}>TRANS REF NO.</Text>
                  <Text style={[styles.headerValue, { color: colors.text, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 13 : 15) : (IS_LANDSCAPE ? 11 : 13) }]} numberOfLines={1}>
                    {transRefNo}
                  </Text>
                </View>
              </View>
            )}
            
            {transDate && (
              <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 180 : 200) : (IS_LANDSCAPE ? 150 : (SCREEN_WIDTH - 48) / 2), flex: IS_TABLET ? 1 : undefined, maxWidth: IS_TABLET ? (IS_LANDSCAPE ? 280 : 280) : (IS_LANDSCAPE ? '48%' : '48%') }]}>
                <View style={[styles.headerIconContainer, { backgroundColor: colors.secondary + '15', width: IS_TABLET ? (IS_LANDSCAPE ? 28 : 36) : (IS_LANDSCAPE ? 24 : 36), height: IS_TABLET ? (IS_LANDSCAPE ? 28 : 36) : (IS_LANDSCAPE ? 24 : 36), borderRadius: IS_TABLET ? (IS_LANDSCAPE ? 6 : 10) : (IS_LANDSCAPE ? 6 : 10), marginRight: IS_LANDSCAPE ? 6 : 10 }]}>
                  <MaterialCommunityIcons name="calendar" size={IS_LANDSCAPE ? 14 : 18} color={colors.secondary} />
                </View>
                <View style={styles.headerContent}>
                  <Text style={[styles.headerLabel, { color: colors.textTertiary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 9 : 11) : (IS_LANDSCAPE ? 8 : 10) }]}>TRANS DATE</Text>
                  <Text style={[styles.headerValue, { color: colors.text, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 13 : 15) : (IS_LANDSCAPE ? 11 : 13) }]}>
                    {formatDate(transDate)}
                  </Text>
                </View>
              </View>
            )}
            
            {issuedBy && (
              <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 180 : 200) : (IS_LANDSCAPE ? 150 : (SCREEN_WIDTH - 48) / 2), flex: IS_TABLET ? 1 : undefined, maxWidth: IS_TABLET ? (IS_LANDSCAPE ? 280 : 280) : (IS_LANDSCAPE ? '48%' : '48%') }]}>
                <View style={[styles.headerIconContainer, { backgroundColor: colors.warning + '15', width: IS_TABLET ? (IS_LANDSCAPE ? 28 : 36) : (IS_LANDSCAPE ? 24 : 36), height: IS_TABLET ? (IS_LANDSCAPE ? 28 : 36) : (IS_LANDSCAPE ? 24 : 36), borderRadius: IS_TABLET ? (IS_LANDSCAPE ? 6 : 10) : (IS_LANDSCAPE ? 6 : 10), marginRight: IS_LANDSCAPE ? 6 : 10 }]}>
                  <MaterialCommunityIcons name="account-arrow-right" size={IS_LANDSCAPE ? 14 : 18} color={colors.warning} />
                </View>
                <View style={styles.headerContent}>
                  <Text style={[styles.headerLabel, { color: colors.textTertiary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 9 : 11) : (IS_LANDSCAPE ? 8 : 10) }]}>ISSUED BY</Text>
                  <Text style={[styles.headerValue, { color: colors.text, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 13 : 15) : (IS_LANDSCAPE ? 11 : 13) }]} numberOfLines={1}>
                    {issuedBy}
                  </Text>
                </View>
              </View>
            )}
            
            {receivedBy && (
              <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 180 : 200) : (IS_LANDSCAPE ? 150 : (SCREEN_WIDTH - 48) / 2), flex: IS_TABLET ? 1 : undefined, maxWidth: IS_TABLET ? (IS_LANDSCAPE ? 280 : 280) : (IS_LANDSCAPE ? '48%' : '48%') }]}>
                <View style={[styles.headerIconContainer, { backgroundColor: colors.success + '15', width: IS_TABLET ? (IS_LANDSCAPE ? 28 : 36) : (IS_LANDSCAPE ? 24 : 36), height: IS_TABLET ? (IS_LANDSCAPE ? 28 : 36) : (IS_LANDSCAPE ? 24 : 36), borderRadius: IS_TABLET ? (IS_LANDSCAPE ? 6 : 10) : (IS_LANDSCAPE ? 6 : 10), marginRight: IS_LANDSCAPE ? 6 : 10 }]}>
                  <MaterialCommunityIcons name="account-check" size={IS_LANDSCAPE ? 14 : 18} color={colors.success} />
                </View>
                <View style={styles.headerContent}>
                  <Text style={[styles.headerLabel, { color: colors.textTertiary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 9 : 11) : (IS_LANDSCAPE ? 8 : 10) }]}>RECEIVED BY</Text>
                  <Text style={[styles.headerValue, { color: colors.text, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 13 : 15) : (IS_LANDSCAPE ? 11 : 13) }]} numberOfLines={1}>
                    {receivedBy}
                  </Text>
                </View>
              </View>
            )}

          </View>
        </View>
      )}

      {/* Table Section */}
      <View style={styles.tableWrapper}>
        {/* Horizontal and Vertical Scroll Container */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={true}
          stickyHeaderIndices={[0]}
          scrollEventThrottle={16}
        >
          <ScrollView 
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            scrollEventThrottle={16}
          >
            {/* Table Header - Sticky */}
            <View style={[styles.tableHeader, { backgroundColor: colors.cardBackground, borderBottomColor: colors.divider, minHeight: IS_LANDSCAPE ? 40 : 48 }]}>
              <View style={[styles.headerCell, { width: COL_WIDTHS.colNo, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 8 : 12 }]}>
                <Text style={[styles.headerCellText, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 10 : 12) : (IS_LANDSCAPE ? 8 : 10) }]}>#</Text>
              </View>
              <View style={[styles.headerCell, { width: COL_WIDTHS.colItemCode, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 8 : 12 }]}>
                <Text style={[styles.headerCellText, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 10 : 12) : (IS_LANDSCAPE ? 8 : 10) }]}>ITEM CODE</Text>
              </View>
              <View style={[styles.headerCell, { width: COL_WIDTHS.colLotNumber, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 8 : 12 }]}>
                <Text style={[styles.headerCellText, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 10 : 12) : (IS_LANDSCAPE ? 8 : 10) }]}>LOT NUMBER</Text>
              </View>
              <View style={[styles.headerCell, { width: COL_WIDTHS.colUofm, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 8 : 12 }]}>
                <Text style={[styles.headerCellText, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 10 : 12) : (IS_LANDSCAPE ? 8 : 10) }]}>UOFM</Text>
              </View>
              <View style={[styles.headerCell, { width: COL_WIDTHS.colBagsIssued, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 8 : 12 }]}>
                <Text style={[styles.headerCellText, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 10 : 12) : (IS_LANDSCAPE ? 8 : 10) }]}>BAGS ISS.</Text>
              </View>
              <View style={[styles.headerCell, { width: COL_WIDTHS.colBagsReceived, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 8 : 12 }]}>
                <Text style={[styles.headerCellText, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 10 : 12) : (IS_LANDSCAPE ? 8 : 10) }]}>BAGS REC.</Text>
              </View>
              <View style={[styles.headerCell, { width: COL_WIDTHS.colQtyIssued, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 8 : 12 }]}>
                <Text style={[styles.headerCellText, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 10 : 12) : (IS_LANDSCAPE ? 8 : 10) }]}>QTY ISSUED</Text>
              </View>
              <View style={[styles.headerCell, { width: COL_WIDTHS.colQtyReceived, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 8 : 12 }]}>
                <Text style={[styles.headerCellText, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 10 : 12) : (IS_LANDSCAPE ? 8 : 10) }]}>QTY RECEIVED</Text>
              </View>
              <View style={[styles.headerCell, { width: COL_WIDTHS.colUnitCost, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 8 : 12 }]}>
                <Text style={[styles.headerCellText, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 10 : 12) : (IS_LANDSCAPE ? 8 : 10) }]}>UNIT COST</Text>
              </View>
              <View style={[styles.headerCell, { width: COL_WIDTHS.colActualCost, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 8 : 12 }]}>
                <Text style={[styles.headerCellText, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 10 : 12) : (IS_LANDSCAPE ? 8 : 10) }]}>ACTUAL COST</Text>
              </View>
            </View>

            {/* Table Body */}
            {details.map((detail, index) => {
              const isEvenRow = index % 2 === 0;
              return (
                <View
                  key={detail.QM4DROWID || index}
                  style={[
                    styles.tableRow,
                    {
                      backgroundColor: isEvenRow ? colors.cardBackground : colors.background + '50',
                      borderBottomColor: colors.divider,
                      minHeight: IS_LANDSCAPE ? 44 : 52,
                    },
                  ]}
                >
                  {/* Row Number - Sticky Left */}
                  <View style={[styles.cell, { width: COL_WIDTHS.colNo, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 6 : 8 }]}>
                    <View style={[styles.rowNumberBadge, { backgroundColor: isEvenRow ? colors.primary + '15' : colors.textTertiary + '10', width: IS_TABLET ? (IS_LANDSCAPE ? 24 : 28) : (IS_LANDSCAPE ? 20 : 28), height: IS_TABLET ? (IS_LANDSCAPE ? 24 : 28) : (IS_LANDSCAPE ? 20 : 28), borderRadius: IS_TABLET ? (IS_LANDSCAPE ? 12 : 14) : (IS_LANDSCAPE ? 10 : 14) }]}>
                      <Text style={[styles.rowNumberText, { color: isEvenRow ? colors.primary : colors.textTertiary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 10 : 12) : (IS_LANDSCAPE ? 8 : 10) }]}>
                        {index + 1}
                      </Text>
                    </View>
                  </View>

                  {/* Item Code - Sticky */}
                  <View style={[styles.cell, { width: COL_WIDTHS.colItemCode, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 6 : 8 }]}>
                    <View style={[styles.stickyCellContent, { backgroundColor: isEvenRow ? colors.primary + '08' : colors.textTertiary + '08', paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 4 : 6, borderRadius: IS_LANDSCAPE ? 4 : 6 }]}>
                      <Text style={[styles.cellText, { color: colors.text, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 11 : 13) : (IS_LANDSCAPE ? 9 : 11) }]} numberOfLines={1}>
                        {detail['ITEM CODE']}
                      </Text>
                    </View>
                  </View>

                  {/* Lot Number - Sticky */}
                  <View style={[styles.cell, { width: COL_WIDTHS.colLotNumber, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 6 : 8 }]}>
                    <View style={[styles.stickyCellContent, { backgroundColor: isEvenRow ? colors.secondary + '08' : colors.textTertiary + '08', paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 4 : 6, borderRadius: IS_LANDSCAPE ? 4 : 6 }]}>
                      <Text style={[styles.cellText, styles.lotNumberText, { color: colors.text, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 11 : 13) : (IS_LANDSCAPE ? 9 : 11) }]}>
                        {detail['LOT NUMBER'] || '-'}
                      </Text>
                    </View>
                  </View>

                  {/* UOFM */}
                  <View style={[styles.cell, { width: COL_WIDTHS.colUofm, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 6 : 8 }]}>
                    <Text style={[styles.cellText, styles.cellTextCenter, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 11 : 13) : (IS_LANDSCAPE ? 9 : 11) }]}>
                      {detail.UOFM || '-'}
                    </Text>
                  </View>

                  {/* Bags Issued */}
                  <View style={[styles.cell, { width: COL_WIDTHS.colBagsIssued, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 6 : 8 }]}>
                    <Text style={[styles.cellTextNumber, { color: colors.primary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 11 : 13) : (IS_LANDSCAPE ? 9 : 11) }]}>
                      {detail['BAGS ISS.']?.toFixed(0) || '0'}
                    </Text>
                  </View>

                  {/* Bags Received */}
                  <View style={[styles.cell, { width: COL_WIDTHS.colBagsReceived, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 6 : 8 }]}>
                    <Text style={[styles.cellTextNumber, { color: colors.success, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 11 : 13) : (IS_LANDSCAPE ? 9 : 11) }]}>
                      {detail['BAGS RECEIVED'] !== null && detail['BAGS RECEIVED'] !== undefined
                        ? detail['BAGS RECEIVED'].toFixed(0)
                        : '-'}
                    </Text>
                  </View>

                  {/* Quantity Issued */}
                  <View style={[styles.cell, { width: COL_WIDTHS.colQtyIssued, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 6 : 8 }]}>
                    <Text style={[styles.cellTextNumber, { color: colors.primary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 11 : 13) : (IS_LANDSCAPE ? 9 : 11) }]}>
                      {detail['QUANTITY ISS.']?.toFixed(3) || '0.000'}
                    </Text>
                  </View>

                  {/* Quantity Received */}
                  <View style={[styles.cell, { width: COL_WIDTHS.colQtyReceived, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 6 : 8 }]}>
                    <Text style={[styles.cellTextNumber, { color: colors.success, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 11 : 13) : (IS_LANDSCAPE ? 9 : 11) }]}>
                      {detail['QUANTITY RECEIVED'] !== null && detail['QUANTITY RECEIVED'] !== undefined
                        ? detail['QUANTITY RECEIVED'].toFixed(3)
                        : '-'}
                    </Text>
                  </View>

                  {/* Unit Cost */}
                  <View style={[styles.cell, { width: COL_WIDTHS.colUnitCost, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 6 : 8 }]}>
                    <Text style={[styles.cellTextNumber, { color: colors.text, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 11 : 13) : (IS_LANDSCAPE ? 9 : 11) }]}>
                      {detail.UNITCOST?.toFixed(3) || '-'}
                    </Text>
                  </View>

                  {/* Actual Cost */}
                  <View style={[styles.cell, { width: COL_WIDTHS.colActualCost, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 6 : 8 }]}>
                    <Text style={[styles.cellTextNumber, { color: colors.text, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 11 : 13) : (IS_LANDSCAPE ? 9 : 11) }]}>
                      {(() => {
                        const qtyIssued = detail['QUANTITY ISS.'] || 0;
                        const unitCost = detail.UNITCOST || 0;
                        const qtyReceived = detail['QUANTITY RECEIVED'] || 0;
                        if (qtyReceived === 0) return '-';
                        return ((qtyIssued * unitCost) / qtyReceived).toFixed(3);
                      })()}
                    </Text>
                  </View>
                </View>
              );
            })}

            {/* Bottom Padding */}
            <View style={{ height: 24 }} />
          </ScrollView>
        </ScrollView>
      </View>

      {/* Summary Footer */}
      <View style={[styles.footer, { backgroundColor: colors.cardBackground, borderTopColor: colors.divider, paddingHorizontal: IS_TABLET ? (IS_LANDSCAPE ? 16 : 20) : (IS_LANDSCAPE ? 8 : 12), paddingVertical: IS_TABLET ? (IS_LANDSCAPE ? 10 : 14) : (IS_LANDSCAPE ? 8 : 10) }]}>
        <View style={styles.footerContent}>
          <View style={styles.footerItem}>
            <MaterialCommunityIcons name="package-variant" size={16} color={colors.primary} />
            <Text style={[styles.footerLabel, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 11 : 13) : (IS_LANDSCAPE ? 9 : 11) }]}>Total Items:</Text>
            <Text style={[styles.footerValue, { color: colors.text, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 12 : 14) : (IS_LANDSCAPE ? 10 : 12) }]}>{details.length}</Text>
          </View>
          <View style={[styles.footerDivider, { backgroundColor: colors.divider, marginHorizontal: IS_TABLET ? (IS_LANDSCAPE ? 16 : 24) : (IS_LANDSCAPE ? 12 : 16) }]} />
          <View style={styles.footerItem}>
            <MaterialCommunityIcons name="scale" size={16} color={colors.secondary} />
            <Text style={[styles.footerLabel, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 11 : 13) : (IS_LANDSCAPE ? 9 : 11) }]}>Total Qty:</Text>
            <Text style={[styles.footerValue, { color: colors.text, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 12 : 14) : (IS_LANDSCAPE ? 10 : 12) }]}>
              {details.reduce((sum, d) => sum + (d['QUANTITY ISS.'] || 0), 0).toFixed(3)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    gap: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyCard: {
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    gap: 12,
    maxWidth: 320,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Header Section
  headerSection: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 140,
    flex: 1,
    maxWidth: '48%',
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerContent: {
    flex: 1,
    minWidth: 0,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  headerValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Table Section
  tableWrapper: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    minHeight: 48,
  },
  headerCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  headerCellText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    minHeight: 52,
  },
  cell: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  cellText: {
    fontSize: 11,
    fontWeight: '500',
  },
  cellTextCenter: {
    textAlign: 'center',
  },
  cellTextNumber: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
  },
  rowNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowNumberText: {
    fontSize: 10,
    fontWeight: '700',
  },
  stickyCellContent: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  lotNumberText: {
    fontSize: 11,
    fontWeight: '500',
  },
  // Footer
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  footerValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  footerDivider: {
    width: 1,
    height: 20,
    marginHorizontal: 16,
  },
});

