import { Colors } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { TransactionDetail } from '../types/confirmation.types';

interface TransactionDetailListProps {
  details: TransactionDetail[];
  loading?: boolean;
  // Header information
  fromTransNo?: string;
  transRefNo?: string;
  issuedBy?: string;
  transDate?: string;
  receivedBy?: string;
}

export function TransactionDetailList({
  details,
  loading = false,
  fromTransNo,
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
  const [showCostColumns, setShowCostColumns] = useState(false);

  // Dynamic column widths as percentage of screen width (now 6 columns = 100% since # removed)
  const COL_WIDTHS = {
    colNo: SCREEN_WIDTH * (IS_TABLET ? (IS_LANDSCAPE ? 0.05 : 0.06) : (IS_LANDSCAPE ? 0.05 : 0.06)),
    colItemCode: SCREEN_WIDTH * (IS_TABLET ? (IS_LANDSCAPE ? 0.14 : 0.16) : (IS_LANDSCAPE ? 0.16 : 0.18)),
    colLotNumber: SCREEN_WIDTH * (IS_TABLET ? (IS_LANDSCAPE ? 0.22 : 0.35) : (IS_LANDSCAPE ? 0.28 : 0.35)),
    colBagsIssued: SCREEN_WIDTH * (IS_TABLET ? (IS_LANDSCAPE ? 0.10 : 0.11) : (IS_LANDSCAPE ? 0.10 : 0.11)),
    colQtyIssued: SCREEN_WIDTH * (IS_TABLET ? (IS_LANDSCAPE ? 0.20 : 0.20) : (IS_LANDSCAPE ? 0.18 : 0.20)),
    colBagsReceived: SCREEN_WIDTH * (IS_TABLET ? (IS_LANDSCAPE ? 0.11 : 0.12) : (IS_LANDSCAPE ? 0.11 : 0.12)),
    colQtyReceived: SCREEN_WIDTH * (IS_TABLET ? (IS_LANDSCAPE ? 0.20 : 0.18) : (IS_LANDSCAPE ? 0.18 : 0.18)),
    colUnitCost: SCREEN_WIDTH * (IS_TABLET ? (IS_LANDSCAPE ? 0.14 : 0.12) : (IS_LANDSCAPE ? 0.12 : 0.10)),
    colActualCost: SCREEN_WIDTH * (IS_TABLET ? (IS_LANDSCAPE ? 0.14 : 0.12) : (IS_LANDSCAPE ? 0.12 : 0.10)),
  };

  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  // Refs for synchronized scrolling
  const leftScrollRef = useRef<ScrollView>(null);
  const rightScrollRef = useRef<ScrollView>(null);
  const rightBodyScrollRef = useRef<ScrollView>(null);
  const headerScrollRef = useRef<ScrollView>(null);
  const [horizontalScrollOffset, setHorizontalScrollOffset] = useState(0);

  // Flag to prevent recursive scrolling between left and right sections
  const isScrollingRef = useRef(false);

  // Handle horizontal scroll sync for sticky columns
  const handleHorizontalScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    setHorizontalScrollOffset(offsetX);
  };

  // Handle left section scroll (sync with right section)
  const handleLeftScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isScrollingRef.current) return;
    const offsetY = event.nativeEvent.contentOffset.y;
    // Sync the right section body vertical scroll
    isScrollingRef.current = true;
    rightBodyScrollRef.current?.scrollTo({ y: offsetY, animated: false });
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 10);
  };

  // Handle right section horizontal scroll (sync with header)
  const handleRightScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Capture horizontal offset for right scroll
    const offsetX = event.nativeEvent.contentOffset.x;
    setHorizontalScrollOffset(offsetX);
    // Sync header horizontal scroll
    headerScrollRef.current?.scrollTo({ x: offsetX, animated: false });
  };

  // Handle right section body vertical scroll (sync with left section)
  const handleRightBodyScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isScrollingRef.current) return;
    const offsetY = event.nativeEvent.contentOffset.y;
    // Sync the left section vertical scroll
    isScrollingRef.current = true;
    leftScrollRef.current?.scrollTo({ y: offsetY, animated: false });
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 50);
  };

  // Format number with thousands separator
  const formatNumber = (value: number | undefined, decimals: number = 0): string => {
    if (value === undefined || value === null) return '-';
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

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

  // Single detail card view
  if (details.length === 1) {
    const detail = details[0];
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Transaction Header Information */}
        <View style={[styles.headerSection, { backgroundColor: colors.cardBackground, borderBottomColor: colors.divider, paddingHorizontal: IS_TABLET ? (IS_LANDSCAPE ? 12 : 20) : (IS_LANDSCAPE ? 8 : 12), paddingVertical: IS_TABLET ? (IS_LANDSCAPE ? 8 : 16) : (IS_LANDSCAPE ? 6 : 12) }]}>
          <View style={[styles.headerGrid, { flexWrap: 'wrap', gap: IS_TABLET ? (IS_LANDSCAPE ? 8 : 12) : 8 }]}>

            <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 150 : 160) : (SCREEN_WIDTH - 48) / (IS_PORTRAIT ? 3 : 2), flex: IS_LANDSCAPE ? 1 : undefined, maxWidth: IS_LANDSCAPE ? '20%' : (IS_PORTRAIT ? '33%' : '48%') }]}>
              <View style={[styles.headerIconContainer, { backgroundColor: colors.primary + '15', width: 32, height: 32, borderRadius: 8, marginRight: 8 }]}>
                <MaterialCommunityIcons name="file-document-outline" size={16} color={colors.primary} />
              </View>
              <View style={styles.headerContent}>
                <Text style={[styles.headerLabel, { color: colors.textTertiary, fontSize: 14 }]}>ISSUANCE REF NO.</Text>
                <Text style={[styles.headerValue, { color: colors.text, fontSize: 14 }]} numberOfLines={1}>
                  {fromTransNo}
                </Text>
              </View>
            </View>

            <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 150 : 160) : (SCREEN_WIDTH - 48) / (IS_PORTRAIT ? 3 : 2), flex: IS_LANDSCAPE ? 1 : undefined, maxWidth: IS_LANDSCAPE ? '20%' : (IS_PORTRAIT ? '33%' : '48%') }]}>
              <View style={[styles.headerIconContainer, { backgroundColor: colors.primary + '15', width: 32, height: 32, borderRadius: 8, marginRight: 8 }]}>
                <MaterialCommunityIcons name="file-document-outline" size={16} color={colors.primary} />
              </View>
              <View style={styles.headerContent}>
                <Text style={[styles.headerLabel, { color: colors.textTertiary, fontSize: 14 }]}>TRANS REF NO.</Text>
                <Text style={[styles.headerValue, { color: colors.text, fontSize: 14 }]} numberOfLines={1}>
                  {transRefNo}
                </Text>
              </View>
            </View>

            <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 150 : 160) : (SCREEN_WIDTH - 48) / (IS_PORTRAIT ? 3 : 2), flex: IS_LANDSCAPE ? 1 : undefined, maxWidth: IS_LANDSCAPE ? '20%' : (IS_PORTRAIT ? '33%' : '48%') }]}>
              <View style={[styles.headerIconContainer, { backgroundColor: colors.secondary + '15', width: 32, height: 32, borderRadius: 8, marginRight: 8 }]}>
                <MaterialCommunityIcons name="calendar" size={16} color={colors.secondary} />
              </View>
              <View style={styles.headerContent}>
                <Text style={[styles.headerLabel, { color: colors.textTertiary, fontSize: 14 }]}>TRANS DATE</Text>
                <Text style={[styles.headerValue, { color: colors.text, fontSize: 14 }]} numberOfLines={1}>
                  {formatDate(transDate)}
                </Text>
              </View>
            </View>

            <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 150 : 160) : (SCREEN_WIDTH - 48) / (IS_PORTRAIT ? 3 : 2), flex: IS_LANDSCAPE ? 1 : undefined, maxWidth: IS_LANDSCAPE ? '20%' : (IS_PORTRAIT ? '33%' : '48%') }]}>
              <View style={[styles.headerIconContainer, { backgroundColor: colors.warning + '15', width: 32, height: 32, borderRadius: 8, marginRight: 8 }]}>
                <MaterialCommunityIcons name="account-arrow-right" size={16} color={colors.warning} />
              </View>
              <View style={styles.headerContent}>
                <Text style={[styles.headerLabel, { color: colors.textTertiary, fontSize: 14 }]}>ISSUED BY</Text>
                <Text style={[styles.headerValue, { color: colors.text, fontSize: 14 }]} numberOfLines={1}>
                  {issuedBy}
                </Text>
              </View>
            </View>

            <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 150 : 160) : (SCREEN_WIDTH - 48) / (IS_PORTRAIT ? 3 : 2), flex: IS_LANDSCAPE ? 1 : undefined, maxWidth: IS_LANDSCAPE ? '20%' : (IS_PORTRAIT ? '33%' : '48%') }]}>
              <View style={[styles.headerIconContainer, { backgroundColor: colors.success + '15', width: 32, height: 32, borderRadius: 8, marginRight: 8 }]}>
                <MaterialCommunityIcons name="account-check" size={16} color={colors.success} />
              </View>
              <View style={styles.headerContent}>
                <Text style={[styles.headerLabel, { color: colors.textTertiary, fontSize: 14 }]}>RECEIVED BY</Text>
                <Text style={[styles.headerValue, { color: colors.text, fontSize: 14 }]} numberOfLines={1}>
                  {receivedBy}
                </Text>
              </View>
            </View>

          </View>
        </View>

        {/* Single Detail Card */}
        <View style={styles.singleCardContainer}>
          <View style={[styles.singleDetailCard, { backgroundColor: colors.cardBackground, borderColor: colors.divider }]}>
            {/* Item Code and Lot Number */}
            <View style={styles.singleCardHeader}>
              <View style={[styles.singleCardItemCode, { backgroundColor: colors.primary + '12' }]}>
                <MaterialCommunityIcons name="package-variant" size={IS_TABLET ? 20 : 18} color={colors.primary} />
                <Text style={[styles.singleCardItemCodeText, { color: colors.primary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 16 : 16) : (IS_LANDSCAPE ? 16 : 14) }]}>
                  {detail['ITEM CODE']}
                </Text>
              </View>
              <View style={[styles.singleCardLotNumber, { backgroundColor: colors.secondary + '12' }]}>
                <MaterialCommunityIcons name="barcode" size={IS_TABLET ? 18 : 16} color={colors.secondary} />
                <Text style={[styles.singleCardLotNumberText, { color: colors.secondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 16 : 16) : (IS_LANDSCAPE ? 16 : 16) }]}>
                  {detail['LOT NUMBER'] || '-'}
                </Text>
              </View>
            </View>

            {/* Issued Details */}
            <View style={styles.singleCardSection}>
              <Text style={[styles.singleCardSectionTitle, { color: colors.textTertiary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 14 : 14) : (IS_LANDSCAPE ? 14 : 14) }]}>ISSUED</Text>
              <View style={styles.singleCardRow}>
                <View style={styles.singleCardStat}>
                  <Text style={[styles.singleCardStatLabel, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 14 : 14) : (IS_LANDSCAPE ? 14 : 14) }]}>QTY BAGS</Text>
                  <Text style={[styles.singleCardStatValue, { color: colors.primary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 18 : 18) : (IS_LANDSCAPE ? 18 : 18) }]}>
                    {formatNumber(detail['BAGS ISS.'] || 0, 0)}
                  </Text>
                </View>
                <View style={[styles.singleCardStatDivider, { backgroundColor: colors.divider }]} />
                <View style={styles.singleCardStat}>
                  <Text style={[styles.singleCardStatLabel, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 14 : 14) : (IS_LANDSCAPE ? 14 : 14) }]}>WEIGHT (KG)</Text>
                  <Text style={[styles.singleCardStatValue, { color: colors.primary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 18 : 18) : (IS_LANDSCAPE ? 18 : 18) }]}>
                    {formatNumber(detail['QUANTITY ISS.'] || 0, 3)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Verified/Received Details */}
            <View style={[styles.singleCardSection, { borderTopColor: colors.divider }]}>
              <Text style={[styles.singleCardSectionTitle, { color: colors.textTertiary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 14 : 14) : (IS_LANDSCAPE ? 14 : 14) }]}>VERIFIED</Text>
              <View style={styles.singleCardRow}>
                <View style={styles.singleCardStat}>
                  <Text style={[styles.singleCardStatLabel, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 14 : 14) : (IS_LANDSCAPE ? 14 : 14) }]}>QTY BAGS</Text>
                  <Text style={[styles.singleCardStatValue, { color: colors.success, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 18 : 18) : (IS_LANDSCAPE ? 18 : 18) }]}>
                    {detail['BAGS RECEIVED'] !== null && detail['BAGS RECEIVED'] !== undefined
                      ? formatNumber(detail['BAGS RECEIVED'], 0)
                      : '-'}
                  </Text>
                </View>
                <View style={[styles.singleCardStatDivider, { backgroundColor: colors.divider }]} />
                <View style={styles.singleCardStat}>
                  <Text style={[styles.singleCardStatLabel, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 14 : 14) : (IS_LANDSCAPE ? 14 : 14) }]}>WEIGHT (KG)</Text>
                  <Text style={[styles.singleCardStatValue, { color: colors.success, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 18 : 18) : (IS_LANDSCAPE ? 18 : 18) }]}>
                    {detail['QUANTITY RECEIVED'] !== null && detail['QUANTITY RECEIVED'] !== undefined
                      ? formatNumber(detail['QUANTITY RECEIVED'], 3)
                      : '-'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Cost Details (if enabled) */}
            {showCostColumns && (
              <View style={[styles.singleCardSection, { borderTopColor: colors.divider }]}>
                <Text style={[styles.singleCardSectionTitle, { color: colors.textTertiary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 14 : 14) : (IS_LANDSCAPE ? 14 : 14) }]}>COST</Text>
                <View style={styles.singleCardRow}>
                  <View style={styles.singleCardStat}>
                    <Text style={[styles.singleCardStatLabel, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 14 : 14) : (IS_LANDSCAPE ? 14 : 14) }]}>UNIT COST</Text>
                    <Text style={[styles.singleCardStatValue, { color: colors.text, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 18 : 18) : (IS_LANDSCAPE ? 18 : 18) }]}>
                      {formatNumber(detail.UNITCOST, 3) || '-'}
                    </Text>
                  </View>
                  <View style={[styles.singleCardStatDivider, { backgroundColor: colors.divider }]} />
                  <View style={styles.singleCardStat}>
                    <Text style={[styles.singleCardStatLabel, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 14 : 14) : (IS_LANDSCAPE ? 14 : 14) }]}>ACTUAL COST</Text>
                    <Text style={[styles.singleCardStatValue, { color: colors.text, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 18 : 18) : (IS_LANDSCAPE ? 18 : 18) }]}>
                      {(() => {
                        const qtyIssued = detail['QUANTITY ISS.'] || 0;
                        const unitCost = detail.UNITCOST || 0;
                        const qtyReceived = detail['QUANTITY RECEIVED'] || 0;
                        if (qtyReceived === 0) return '-';
                        return formatNumber((qtyIssued * unitCost) / qtyReceived, 3);
                      })()}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Toggle Button for single item */}
        <View style={[styles.toggleContainer, { backgroundColor: colors.cardBackground, borderBottomColor: colors.divider }]}>
          <TouchableOpacity
            onPress={() => setShowCostColumns(!showCostColumns)}
            style={styles.toggleButton}
          >
            <Text style={[styles.toggleLabel, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 10 : 12) : (IS_LANDSCAPE ? 8 : 10) }]}>
              {showCostColumns ? '✓ UNIT/ACTUAL COST' : '☐ SHOW COST COLUMNS'}
            </Text>
          </TouchableOpacity>
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
                {formatNumber(details.reduce((sum, d) => sum + (d['QUANTITY ISS.'] || 0), 0), 3)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Transaction Header Information */}
      <View style={[styles.headerSection, { backgroundColor: colors.cardBackground, borderBottomColor: colors.divider, paddingHorizontal: IS_TABLET ? (IS_LANDSCAPE ? 12 : 20) : (IS_LANDSCAPE ? 8 : 12), paddingVertical: IS_TABLET ? (IS_LANDSCAPE ? 8 : 16) : (IS_LANDSCAPE ? 6 : 12) }]}>
        <View style={[styles.headerGrid, { flexWrap: 'wrap', gap: IS_TABLET ? (IS_LANDSCAPE ? 8 : 12) : 8 }]}>
          <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 150 : 160) : (SCREEN_WIDTH - 48) / (IS_PORTRAIT ? 3 : 2), flex: IS_LANDSCAPE ? 1 : undefined, maxWidth: IS_LANDSCAPE ? '20%' : (IS_PORTRAIT ? '33%' : '48%') }]}>
            <View style={[styles.headerIconContainer, { backgroundColor: colors.primary + '15', width: 32, height: 32, borderRadius: 8, marginRight: 8 }]}>
              <MaterialCommunityIcons name="file-document-outline" size={16} color={colors.primary} />
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.headerLabel, { color: colors.textTertiary, fontSize: 14 }]}>ISSUANCE REF NO.</Text>
              <Text style={[styles.headerValue, { color: colors.text, fontSize: 14 }]} numberOfLines={1}>
                {fromTransNo}
              </Text>
            </View>
          </View>

          <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 150 : 160) : (SCREEN_WIDTH - 48) / (IS_PORTRAIT ? 3 : 2), flex: IS_LANDSCAPE ? 1 : undefined, maxWidth: IS_LANDSCAPE ? '20%' : (IS_PORTRAIT ? '33%' : '48%') }]}>
            <View style={[styles.headerIconContainer, { backgroundColor: colors.primary + '15', width: 32, height: 32, borderRadius: 8, marginRight: 8 }]}>
              <MaterialCommunityIcons name="file-document-outline" size={16} color={colors.primary} />
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.headerLabel, { color: colors.textTertiary, fontSize: 14 }]}>TRANS REF NO.</Text>
              <Text style={[styles.headerValue, { color: colors.text, fontSize: 14 }]} numberOfLines={1}>
                {transRefNo}
              </Text>
            </View>
          </View>

          <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 150 : 160) : (SCREEN_WIDTH - 48) / (IS_PORTRAIT ? 3 : 2), flex: IS_LANDSCAPE ? 1 : undefined, maxWidth: IS_LANDSCAPE ? '20%' : (IS_PORTRAIT ? '33%' : '48%') }]}>
            <View style={[styles.headerIconContainer, { backgroundColor: colors.secondary + '15', width: 32, height: 32, borderRadius: 8, marginRight: 8 }]}>
              <MaterialCommunityIcons name="calendar" size={16} color={colors.secondary} />
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.headerLabel, { color: colors.textTertiary, fontSize: 14 }]}>TRANS DATE</Text>
              <Text style={[styles.headerValue, { color: colors.text, fontSize: 14 }]} numberOfLines={1}>
                {formatDate(transDate)}
              </Text>
            </View>
          </View>

          <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 150 : 160) : (SCREEN_WIDTH - 48) / (IS_PORTRAIT ? 3 : 2), flex: IS_LANDSCAPE ? 1 : undefined, maxWidth: IS_LANDSCAPE ? '20%' : (IS_PORTRAIT ? '33%' : '48%') }]}>
            <View style={[styles.headerIconContainer, { backgroundColor: colors.warning + '15', width: 32, height: 32, borderRadius: 8, marginRight: 8 }]}>
              <MaterialCommunityIcons name="account-arrow-right" size={16} color={colors.warning} />
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.headerLabel, { color: colors.textTertiary, fontSize: 14 }]}>ISSUED BY</Text>
              <Text style={[styles.headerValue, { color: colors.text, fontSize: 14 }]} numberOfLines={1}>
                {issuedBy}
              </Text>
            </View>
          </View>

          <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 150 : 160) : (SCREEN_WIDTH - 48) / (IS_PORTRAIT ? 3 : 2), flex: IS_LANDSCAPE ? 1 : undefined, maxWidth: IS_LANDSCAPE ? '20%' : (IS_PORTRAIT ? '33%' : '48%') }]}>
            <View style={[styles.headerIconContainer, { backgroundColor: colors.success + '15', width: 32, height: 32, borderRadius: 8, marginRight: 8 }]}>
              <MaterialCommunityIcons name="account-check" size={16} color={colors.success} />
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.headerLabel, { color: colors.textTertiary, fontSize: 14 }]}>RECEIVED BY</Text>
              <Text style={[styles.headerValue, { color: colors.text, fontSize: 14 }]} numberOfLines={1}>
                {receivedBy}
              </Text>
            </View>
          </View>

        </View>
      </View>

      {/* Table Section */}
      <View style={styles.tableWrapper}>
        {/* Toggle Button */}
        <View style={[styles.toggleContainer, { backgroundColor: colors.cardBackground, borderBottomColor: colors.divider }]}>
          <TouchableOpacity
            onPress={() => setShowCostColumns(!showCostColumns)}
            style={styles.toggleButton}
          >
            <Text style={[styles.toggleLabel, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 10 : 12) : (IS_LANDSCAPE ? 8 : 10) }]}>
              {showCostColumns ? '✓ UNIT/ACTUAL COST' : '☐ SHOW COST COLUMNS'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Freeze Pane Table Container */}
        <View style={styles.freezePaneContainer}>
          {/* Sticky Header Row - Stays fixed at top, scrolls vertically */}
          <View style={[styles.tableHeader, { backgroundColor: colors.cardBackground, borderBottomColor: colors.divider, minHeight: IS_LANDSCAPE ? 40 : 48 }]}>
            {/* Left Sticky Columns Header */}
            <View style={styles.stickyHeaderContainer}>
              {/* <View style={[styles.headerCell, { width: COL_WIDTHS.colNo, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 8 : 12 }]}>
                <Text style={[styles.headerCellText, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 10 : 12) : (IS_LANDSCAPE ? 8 : 10) }]}>#</Text>
              </View> */}
              <View style={[styles.headerCell, { width: COL_WIDTHS.colItemCode, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 8 : 12 }]}>
                <Text style={[styles.headerCellText, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 10 : 12) : (IS_LANDSCAPE ? 8 : 10), textAlign: 'left' }]}>ITEM CODE</Text>
              </View>
              <View style={[styles.headerCell, { width: COL_WIDTHS.colLotNumber, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 8 : 12, borderRightWidth: 2, borderRightColor: colors.divider }]}>
                <Text style={[styles.headerCellText, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 10 : 12) : (IS_LANDSCAPE ? 8 : 10), textAlign: 'left' }]}>LOT NUMBER</Text>
              </View>
            </View>
            {/* Right Scrollable Columns Header - Horizontal ScrollView */}
            <ScrollView
              ref={headerScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEnabled={false}
              scrollEventThrottle={16}
              contentContainerStyle={styles.scrollableHeaderContent}
            >
              <View style={[styles.headerCell, { width: COL_WIDTHS.colBagsIssued, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 8 : 12 }]}>
                <Text style={[styles.headerCellText, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 10 : 12) : (IS_LANDSCAPE ? 8 : 10), textAlign: 'left' }]}>QTY BAGS</Text>
              </View>
              <View style={[styles.headerCell, { width: COL_WIDTHS.colQtyIssued, paddingHorizontal: IS_LANDSCAPE ? 4 : 12, paddingVertical: IS_LANDSCAPE ? 8 : 14 }]}>
                <Text style={[styles.headerCellText, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 10 : 12) : (IS_LANDSCAPE ? 8 : 10), textAlign: 'left' }]}>WEIGHT (KG)</Text>
              </View>
              <View style={[styles.headerCell, { width: COL_WIDTHS.colBagsReceived, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 8 : 12 }]}>
                <Text style={[styles.headerCellText, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 10 : 12) : (IS_LANDSCAPE ? 8 : 10), textAlign: 'left' }]}>VERIFIED QTY BAGS</Text>
              </View>
              <View style={[styles.headerCell, { width: COL_WIDTHS.colQtyReceived, paddingHorizontal: IS_LANDSCAPE ? 8 : 12, paddingVertical: IS_LANDSCAPE ? 8 : 12 }]}>
                <Text style={[styles.headerCellText, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 10 : 12) : (IS_LANDSCAPE ? 8 : 10), textAlign: 'left' }]}>VERIFIED WEIGHT (KG)</Text>
              </View>
              {showCostColumns && (
                <>
                  <View style={[styles.headerCell, { width: COL_WIDTHS.colUnitCost, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 8 : 12 }]}>
                    <Text style={[styles.headerCellText, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 10 : 12) : (IS_LANDSCAPE ? 8 : 10), textAlign: 'left' }]}>UNIT COST</Text>
                  </View>
                  <View style={[styles.headerCell, { width: COL_WIDTHS.colActualCost, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 8 : 12 }]}>
                    <Text style={[styles.headerCellText, { color: colors.textSecondary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 10 : 12) : (IS_LANDSCAPE ? 8 : 10), textAlign: 'left' }]}>ACTUAL COST</Text>
                  </View>
                </>
              )}
            </ScrollView>
          </View>

          {/* Table Body Container - Split into sticky left and scrollable right */}
          <View style={styles.tableBodyContainer}>
            {/* Sticky Left Columns - Fixed position on left */}
            <View style={[styles.stickyLeftOverlay, { width: COL_WIDTHS.colItemCode + COL_WIDTHS.colLotNumber }]}>
              <ScrollView
                ref={leftScrollRef}
                showsVerticalScrollIndicator={false}
                onScroll={handleLeftScroll}
                scrollEventThrottle={16}
                style={styles.stickyLeftScroll}
                contentContainerStyle={{ flexGrow: 1 }}
              >
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
                          height: IS_LANDSCAPE ? 44 : 52,
                        },
                      ]}
                    >
                      {/* Row Number - Sticky */}
                      {/* <View style={[styles.cell, { width: COL_WIDTHS.colNo, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 6 : 8 }]}>
                        <View style={[styles.rowNumberBadge, { backgroundColor: isEvenRow ? colors.primary + '15' : colors.textTertiary + '10', width: IS_TABLET ? (IS_LANDSCAPE ? 24 : 28) : (IS_LANDSCAPE ? 20 : 28), height: IS_TABLET ? (IS_LANDSCAPE ? 24 : 28) : (IS_LANDSCAPE ? 20 : 28), borderRadius: IS_TABLET ? (IS_LANDSCAPE ? 12 : 14) : (IS_LANDSCAPE ? 10 : 14) }]}>
                          <Text style={[styles.rowNumberText, { color: isEvenRow ? colors.primary : colors.textTertiary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 10 : 14) : (IS_LANDSCAPE ? 8 : 14) }]}>
                            {index + 1}
                          </Text>
                        </View>
                      </View> */}

                      {/* Item Code - Sticky */}
                      <View style={[styles.cell, styles.stickyLeftCell, { width: COL_WIDTHS.colItemCode, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 6 : 8 }]}>
                        <View style={[styles.stickyCellContent, { backgroundColor: isEvenRow ? colors.primary + '08' : colors.textTertiary + '08', paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 4 : 6, borderRadius: IS_LANDSCAPE ? 4 : 6 }]}>
                          <Text style={[styles.cellText, { color: colors.text, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 11 : 14) : (IS_LANDSCAPE ? 9 : 14) }]} numberOfLines={1}>
                            {detail['ITEM CODE']}
                          </Text>
                        </View>
                      </View>

                      {/* Lot Number - Sticky */}
                      <View style={[styles.cell, styles.stickyRightCell, { width: COL_WIDTHS.colLotNumber, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 6 : 8, borderRightColor: colors.divider }]}>
                        <View style={[styles.stickyCellContent, { backgroundColor: isEvenRow ? colors.secondary + '08' : colors.textTertiary + '08', paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 4 : 6, borderRadius: IS_LANDSCAPE ? 4 : 6 }]}>
                          <Text style={[styles.cellText, styles.lotNumberText, { color: colors.text, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 11 : 14) : (IS_LANDSCAPE ? 9 : 14) }]}>
                            {detail['LOT NUMBER'] || '-'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
                {/* Bottom Padding */}
                <View style={{ height: 24 }} />
              </ScrollView>
            </View>

            {/* Scrollable Right Columns */}
            <ScrollView
              ref={rightScrollRef}
              horizontal
              showsHorizontalScrollIndicator={true}
              showsVerticalScrollIndicator={false}
              onScroll={handleRightScroll}
              scrollEventThrottle={16}
              style={[styles.scrollableRightContainer, { marginLeft: COL_WIDTHS.colItemCode + COL_WIDTHS.colLotNumber }]}
            >
              <ScrollView
                ref={rightBodyScrollRef}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={handleRightBodyScroll}
                style={styles.scrollableBodyScroll}
                contentContainerStyle={{ flexGrow: 1 }}
              >
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
                          height: IS_LANDSCAPE ? 44 : 52,
                        },
                      ]}
                    >
                      {/* Bags Issued */}
                      <View style={[styles.cell, { width: COL_WIDTHS.colBagsIssued, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 6 : 8 }]}>
                        <Text style={[styles.cellTextNumber, { color: colors.primary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 11 : 14) : (IS_LANDSCAPE ? 9 : 14) }]}>
                          {formatNumber(detail['BAGS ISS.'] || 0, 0)}
                        </Text>
                      </View>

                      {/* Quantity Issued */}
                      <View style={[styles.cell, { width: COL_WIDTHS.colQtyIssued, paddingLeft: 4, paddingRight: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 6 : 8 }]}>
                        <Text style={[styles.cellTextNumber, { color: colors.primary, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 11 : 14) : (IS_LANDSCAPE ? 9 : 14) }]}>
                          {formatNumber(detail['QUANTITY ISS.'] || 0, 3)}
                        </Text>
                      </View>

                      {/* Bags Received */}
                      <View style={[styles.cell, { width: COL_WIDTHS.colBagsReceived, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 6 : 8 }]}>
                        <Text style={[styles.cellTextNumber, { color: colors.success, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 11 : 14) : (IS_LANDSCAPE ? 9 : 14) }]}>
                          {detail['BAGS RECEIVED'] !== null && detail['BAGS RECEIVED'] !== undefined
                            ? formatNumber(detail['BAGS RECEIVED'], 0)
                            : '-'}
                        </Text>
                      </View>

                      {/* Quantity Received */}
                      <View style={[styles.cell, { width: COL_WIDTHS.colQtyReceived, paddingLeft: 4, paddingRight: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 6 : 8 }]}>
                        <Text style={[styles.cellTextNumber, { color: colors.success, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 11 : 14) : (IS_LANDSCAPE ? 9 : 14) }]}>
                          {detail['QUANTITY RECEIVED'] !== null && detail['QUANTITY RECEIVED'] !== undefined
                            ? formatNumber(detail['QUANTITY RECEIVED'], 3)
                            : '-'}
                        </Text>
                      </View>

                      {/* Unit Cost */}
                      {showCostColumns && (
                        <View style={[styles.cell, { width: COL_WIDTHS.colUnitCost, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 6 : 8 }]}>
                          <Text style={[styles.cellTextNumber, { color: colors.text, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 11 : 14) : (IS_LANDSCAPE ? 9 : 14) }]}>
                            {formatNumber(detail.UNITCOST, 3) || '-'}
                          </Text>
                        </View>
                      )}

                      {/* Actual Cost */}
                      {showCostColumns && (
                        <View style={[styles.cell, { width: COL_WIDTHS.colActualCost, paddingHorizontal: IS_LANDSCAPE ? 4 : 8, paddingVertical: IS_LANDSCAPE ? 6 : 8 }]}>
                          <Text style={[styles.cellTextNumber, { color: colors.text, fontSize: IS_TABLET ? (IS_LANDSCAPE ? 11 : 14) : (IS_LANDSCAPE ? 9 : 14) }]}>
                            {(() => {
                              const qtyIssued = detail['QUANTITY ISS.'] || 0;
                              const unitCost = detail.UNITCOST || 0;
                              const qtyReceived = detail['QUANTITY RECEIVED'] || 0;
                              if (qtyReceived === 0) return '-';
                              return formatNumber((qtyIssued * unitCost) / qtyReceived, 3);
                            })()}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
                {/* Bottom Padding */}
                <View style={{ height: 24 }} />
              </ScrollView>
            </ScrollView>
          </View>
        </View>
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
              {formatNumber(details.reduce((sum, d) => sum + (d['QUANTITY ISS.'] || 0), 0), 3)}
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
    fontSize: 14,
    fontWeight: '700',
  },
  // Table Section
  tableWrapper: {
    flex: 1,
    width: '100%',
  },
  // Freeze Pane Container
  freezePaneContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  // Table Body Container (holds sticky left and scrollable right)
  tableBodyContainer: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
  },
  // Sticky Left Overlay - positioned absolutely over the scrollable content
  stickyLeftOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  // Sticky Left Section (#, Item Code, Lot Number)
  stickyLeftContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  stickyLeftScroll: {
    flex: 1,
  },
  stickyHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    minHeight: 48,
    zIndex: 2,
  },
  stickyHeaderContainer: {
    flexDirection: 'row',
  },
  scrollableHeaderContent: {
    flexDirection: 'row',
  },
  stickyHeaderCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  stickyRightCell: {
    borderRightWidth: 2,
    borderRightColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  stickyLeftCell: {
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  // Scrollable Right Section
  scrollableRightContainer: {
    flex: 1,
    marginLeft: 0,
  },
  scrollableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    minHeight: 48,
  },
  scrollableBodyScroll: {
    flex: 1,
  },
  // Original styles kept for compatibility
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
    fontSize: 14,
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
    fontSize: 14,
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
  // Toggle Button
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  toggleButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Single Detail Card Styles
  singleCardContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',  // centers vertically
  },
  singleDetailCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  singleCardHeader: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  singleCardItemCode: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  singleCardItemCodeText: {
    fontWeight: '700',
    flex: 1,
  },
  singleCardLotNumber: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  singleCardLotNumberText: {
    fontWeight: '600',
    flex: 1,
  },
  singleCardSection: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  singleCardSectionTitle: {
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  singleCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  singleCardStat: {
    flex: 1,
    alignItems: 'center',
  },
  singleCardStatLabel: {
    fontWeight: '500',
    marginBottom: 4,
  },
  singleCardStatValue: {
    fontWeight: '700',
  },
  singleCardStatDivider: {
    width: 1,
    height: '100%',
    minHeight: 40,
  },
});


