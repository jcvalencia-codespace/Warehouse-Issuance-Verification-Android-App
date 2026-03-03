import { Colors } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View
} from 'react-native';
import { TransactionDetail } from '../types/confirmation.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH > 768;

interface TransactionDetailListProps {
  details: TransactionDetail[];
  loading?: boolean;
  onQuantityReceivedChange?: (rowId: number, value: number) => void;
  onBagsReceivedChange?: (rowId: number, value: number) => void;
}

interface DetailFieldProps {
  icon: string;
  label: string;
  value: string | number | null;
  highlight?: boolean;
  color?: string;
}

function DetailField({ icon, label, value, highlight = false, color }: DetailFieldProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  return (
    <View style={styles.detailField}>
      <View style={styles.detailLabelRow}>
        <MaterialCommunityIcons
          name={icon as any}
          size={16}
          color={colors.textTertiary}
        />
        <Text style={[styles.detailLabelText, { color: colors.textTertiary }]}>
          {label}
        </Text>
      </View>
      <Text
        style={[
          styles.detailValueText,
          { color: highlight ? (color || colors.primary) : colors.text },
          highlight && styles.detailValueHighlight,
        ]}
      >
        {value ?? '-'}
      </Text>
    </View>
  );
}

export function TransactionDetailList({ details, loading = false }: TransactionDetailListProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

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
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Summary Header */}
      <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons name="package-variant-closed" size={24} color={colors.primary} />
            <View style={styles.summaryTextContainer}>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{details.length}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Items</Text>
            </View>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons name="scale-balance" size={24} color={colors.success} />
            <View style={styles.summaryTextContainer}>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {details.reduce((sum, d) => sum + (d['QUANTITY ISS.'] || 0), 0).toFixed(3)}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Qty Issued</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Detail Cards */}
      {details.map((detail, index) => (
        <View
          key={detail.QM4DROWID || index}
          style={[
            styles.detailCard,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.cardBorder,
              shadowColor: colors.shadowColor,
            },
          ]}
        >
          {/* Card Header */}
          <View style={[styles.cardHeader, { borderBottomColor: colors.divider }]}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.itemNumberBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.itemNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.itemCodeSection}>
                <Text style={[styles.itemCodeLabel, { color: colors.textTertiary }]}>ITEM CODE</Text>
                <Text style={[styles.itemCodeValue, { color: colors.text }]}>
                  {detail['ITEM CODE']}
                </Text>
              </View>
            </View>
            <View style={styles.cardHeaderRight}>
            </View>
          </View>

          {/* Card Body */}
          <View style={styles.cardBody}>
            {/* Primary Info Row */}
            <View style={styles.primaryInfoRow}>
              <View style={styles.primaryInfoItem}>
                <MaterialCommunityIcons name="barcode" size={20} color={colors.primary} />
                <View style={styles.primaryInfoContent}>
                  <Text style={[styles.primaryInfoLabel, { color: colors.textTertiary }]}>Lot Number</Text>
                  <Text style={[styles.primaryInfoValue, { color: colors.text }]}>
                    {detail['LOT NUMBER'] || '-'}
                  </Text>
                </View>
              </View>
              <View style={styles.primaryInfoItem}>
                <MaterialCommunityIcons name="cube-outline" size={20} color={colors.secondary} />
                <View style={styles.primaryInfoContent}>
                  <Text style={[styles.primaryInfoLabel, { color: colors.textTertiary }]}>Unit of Measure</Text>
                  <Text style={[styles.primaryInfoValue, { color: colors.text }]}>
                    {detail.UOFM || '-'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Divider */}
            <View style={[styles.fieldDivider, { backgroundColor: colors.divider }]} />


            {/* Quantity Section */}
            <View style={styles.quantitySection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                <MaterialCommunityIcons name="scale" size={16} color={colors.textSecondary} /> Quantity Details
              </Text>
              <View style={styles.bagsGridRow}>
                  <View style={[styles.quantityCard, { backgroundColor: colors.primary + '08' }]}>
                    <Text style={[styles.quantityLabel, { color: colors.textSecondary }]}>Bags Issued</Text>
                    <Text style={[styles.quantityValue, { color: colors.primary }]}>
                      {detail['BAGS ISS.']?.toFixed(0) || '0'}
                    </Text>
                  </View>
                  <View style={[styles.quantityCard, { backgroundColor: colors.success + '08' }]}>
                    <Text style={[styles.quantityLabel, { color: colors.textSecondary }]}>Bags Received</Text>
                    <Text style={[styles.quantityValue, { color: colors.success }]}>
                      {detail['BAGS RECEIVED'] !== null && detail['BAGS RECEIVED'] !== undefined 
                        ? detail['BAGS RECEIVED'].toFixed(0) 
                        : '-'}
                    </Text>
                  </View>
                </View>
              <View style={styles.bagsGrid}>
                <View style={styles.bagsGridRow}>
                  <View style={[styles.quantityCard, { backgroundColor: colors.primary + '08' }]}>
                    <Text style={[styles.quantityLabel, { color: colors.textSecondary }]}>Qty Issued</Text>
                    <Text style={[styles.quantityValue, { color: colors.primary }]}>
                      {detail['QUANTITY ISS.']?.toFixed(3) || '0.000'}
                    </Text>
                  </View>
                  <View style={[styles.quantityCard, { backgroundColor: colors.success + '08' }]}>
                    <Text style={[styles.quantityLabel, { color: colors.textSecondary }]}>Qty Received</Text>
                    <Text style={[styles.quantityValue, { color: colors.success }]}>
                      {detail['QUANTITY RECEIVED'] !== null && detail['QUANTITY RECEIVED'] !== undefined 
                        ? detail['QUANTITY RECEIVED'].toFixed(3) 
                        : '-'}
                    </Text>
                  </View>
                </View>
                
              </View>
            </View>

            {/* Divider */}
            <View style={[styles.fieldDivider, { backgroundColor: colors.divider }]} />

            {/* Cost Section */}
            <View style={styles.costSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                <MaterialCommunityIcons name="currency-usd" size={16} color={colors.textSecondary} /> Cost Details
              </Text>
              <View style={styles.costGrid}>
                <View style={styles.costItem}>
                  <Text style={[styles.costLabel, { color: colors.textTertiary }]}>Unit Cost</Text>
                  <Text style={[styles.costValue, { color: colors.text }]}>
                    {detail.UNITCOST?.toFixed(3) || '-'}
                  </Text>
                </View>
                <View style={styles.costItem}>
                  <Text style={[styles.costLabel, { color: colors.textTertiary }]}>Actual Cost</Text>
                  <Text style={[styles.costValue, { color: colors.text }]}>
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
            </View>
          </View>

          {/* Card Footer */}
          <View style={[styles.cardFooter, { borderTopColor: colors.divider, backgroundColor: colors.background + '50' }]}>
            <MaterialCommunityIcons name="identifier" size={14} color={colors.textTertiary} />
            <Text style={[styles.rowIdText, { color: colors.textTertiary }]}>
              Row ID: {detail.QM4DROWID}
            </Text>
          </View>
        </View>
      ))}

      {/* Bottom Padding */}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: IS_TABLET ? 24 : 16,
    paddingBottom: 24,
  },
  // Loading state
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
  // Empty state
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
  // Summary Card
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: IS_TABLET ? 20 : 16,
    padding: IS_TABLET ? 20 : 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryTextContainer: {
    gap: 2,
  },
  summaryValue: {
    fontSize: IS_TABLET ? 26 : 22,
    fontWeight: '800',
  },
  summaryLabel: {
    fontSize: IS_TABLET ? 13 : 12,
    fontWeight: '500',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
  },
  // Detail Card
  detailCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: IS_TABLET ? 20 : 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  // Card Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: IS_TABLET ? 20 : 16,
    paddingVertical: IS_TABLET ? 16 : 14,
    borderBottomWidth: 1,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemNumberBadge: {
    width: IS_TABLET ? 36 : 32,
    height: IS_TABLET ? 36 : 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemNumberText: {
    color: '#ffffff',
    fontSize: IS_TABLET ? 16 : 14,
    fontWeight: '700',
  },
  itemCodeSection: {
    gap: 2,
  },
  itemCodeLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  itemCodeValue: {
    fontSize: IS_TABLET ? 18 : 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  actionText: {
    fontSize: IS_TABLET ? 13 : 12,
    fontWeight: '600',
  },
  // Card Body
  cardBody: {
    padding: IS_TABLET ? 20 : 16,
  },
  primaryInfoRow: {
    flexDirection: 'row',
    gap: IS_TABLET ? 24 : 16,
  },
  primaryInfoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  primaryInfoContent: {
    flex: 1,
    gap: 2,
  },
  primaryInfoLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  primaryInfoValue: {
    fontSize: IS_TABLET ? 16 : 14,
    fontWeight: '600',
  },
  fieldDivider: {
    height: 1,
    marginVertical: IS_TABLET ? 18 : 14,
  },
  sectionTitle: {
    fontSize: IS_TABLET ? 14 : 13,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  // Quantity Section
  quantitySection: {
    gap: 12,
  },
  quantityGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  bagsGrid: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    gap: 12,
  },
  bagsGridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  receivedColumn: {
    flex: 1,
    gap: 8,
  },
  quantityCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  quantityValue: {
    fontSize: IS_TABLET ? 22 : 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  quantityValueSmall: {
    fontSize: IS_TABLET ? 18 : 14,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  quantityInput: {
    fontSize: IS_TABLET ? 22 : 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 100,
  },
  sameQuantityButton: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  sameQuantityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  sameQuantityBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  // Cost Section
  costSection: {
    marginBottom: 4,
  },
  costGrid: {
    flexDirection: 'row',
    gap: IS_TABLET ? 24 : 16,
  },
  costItem: {
    flex: 1,
    gap: 4,
  },
  costLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  costValue: {
    fontSize: IS_TABLET ? 18 : 16,
    fontWeight: '700',
  },
  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IS_TABLET ? 20 : 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 6,
  },
  rowIdText: {
    fontSize: 11,
    fontWeight: '500',
  },
  // Detail Field (legacy support)
  detailField: {
    marginBottom: 12,
  },
  detailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  detailLabelText: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailValueText: {
    fontSize: 15,
    fontWeight: '600',
  },
  detailValueHighlight: {
    fontSize: 17,
  },
});
