import { Colors } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View
} from 'react-native';
import { IssuanceDetail } from '../types/posted-issuance.types';

interface PostedIssuanceDetailListProps {
  details: IssuanceDetail[];
  loading?: boolean;
  referenceNo?: number | string;
  transactionType?: string;
  issuanceType?: string;
  dateIssued?: string;
  shift?: string;
  contactPerson?: string;
  transferLocnCode?: string;
  projectName?: string;
  areaTransfer?: string;
  issuedBy?: string;
  approvedBy?: string;
  timeRequest?: string;
  timeIssued?: string;
  onBack?: () => void;
}

export function PostedIssuanceDetailList({
  details,
  loading = false,
  referenceNo,
  transactionType,
  issuanceType,
  dateIssued,
  shift,
  contactPerson,
  transferLocnCode,
  projectName,
  areaTransfer,
  issuedBy,
  approvedBy,
  timeRequest,
  timeIssued,
  onBack,
}: PostedIssuanceDetailListProps) {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const IS_TABLET = SCREEN_WIDTH > 768;
  const IS_PORTRAIT = SCREEN_HEIGHT > SCREEN_WIDTH;
  const IS_LANDSCAPE = !IS_PORTRAIT;
  const IS_SMALL_SCREEN = SCREEN_WIDTH < 380;

  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

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
      return dateString || '-';
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateString || '-';
    }
  };

  const formatNumber = (value: number | undefined, decimals: number = 0): string => {
    if (value === undefined || value === null) return '-';
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={[styles.loadingCard, { backgroundColor: colors.cardBackground }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading issuance details...
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
            This issuance has no item details
          </Text>
          {onBack && (
            <TouchableOpacity
              style={[styles.backToListButton, { backgroundColor: colors.primary + '10' }]}
              onPress={onBack}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.primary} />
              <Text style={[styles.backToListText, { color: colors.primary }]}>Back to List</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: 24 + (IS_TABLET ? 32 : 16) }
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.detailsHeader, { backgroundColor: colors.cardBackground, borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary + '10' }]}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={IS_TABLET ? 26 : 22} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.detailsTitleContainer}>
          <Text style={[styles.detailsTitle, { color: colors.text }]} numberOfLines={1}>
            ISSUANCE DETAILS
          </Text>
          <Text style={[styles.detailsSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {referenceNo}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: colors.success + '15' }]}>
          <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.success} />
          <Text style={[styles.statusText, { color: colors.success }]}>Posted</Text>
        </View>
      </View>

      <View style={[styles.headerSection, { backgroundColor: colors.cardBackground, borderBottomColor: colors.divider }]}>
        <View style={[styles.headerGrid, { flexWrap: 'wrap', gap: IS_TABLET ? (IS_LANDSCAPE ? 12 : 16) : 12 }]}>
          <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 160 : 180) : (SCREEN_WIDTH - 48) / (IS_PORTRAIT ? 2 : 3), maxWidth: IS_LANDSCAPE ? '25%' : (IS_PORTRAIT ? '48%' : '32%') }]}>
            <View style={[styles.headerIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <MaterialCommunityIcons name="file-document-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.headerLabel, { color: colors.textTertiary }]}>REF NO.</Text>
              <Text style={[styles.headerValue, { color: colors.text }]} numberOfLines={1}>
                {referenceNo || '-'}
              </Text>
            </View>
          </View>

          <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 160 : 180) : (SCREEN_WIDTH - 48) / (IS_PORTRAIT ? 2 : 3), maxWidth: IS_LANDSCAPE ? '25%' : (IS_PORTRAIT ? '48%' : '32%') }]}>
            <View style={[styles.headerIconContainer, { backgroundColor: colors.secondary + '15' }]}>
              <MaterialCommunityIcons name="tag-outline" size={18} color={colors.secondary} />
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.headerLabel, { color: colors.textTertiary }]}>TRANS TYPE</Text>
              <Text style={[styles.headerValue, { color: colors.text }]} numberOfLines={1}>
                {transactionType || '-'}
              </Text>
            </View>
          </View>

          <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 160 : 180) : (SCREEN_WIDTH - 48) / (IS_PORTRAIT ? 2 : 3), maxWidth: IS_LANDSCAPE ? '25%' : (IS_PORTRAIT ? '48%' : '32%') }]}>
            <View style={[styles.headerIconContainer, { backgroundColor: colors.warning + '15' }]}>
              <MaterialCommunityIcons name="package-variant" size={18} color={colors.warning} />
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.headerLabel, { color: colors.textTertiary }]}>ISS TYPE</Text>
              <Text style={[styles.headerValue, { color: colors.text }]} numberOfLines={1}>
                {issuanceType || '-'}
              </Text>
            </View>
          </View>

          <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 160 : 180) : (SCREEN_WIDTH - 48) / (IS_PORTRAIT ? 2 : 3), maxWidth: IS_LANDSCAPE ? '25%' : (IS_PORTRAIT ? '48%' : '32%') }]}>
            <View style={[styles.headerIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <MaterialCommunityIcons name="calendar" size={18} color={colors.primary} />
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.headerLabel, { color: colors.textTertiary }]}>DATE ISSUED</Text>
              <Text style={[styles.headerValue, { color: colors.text }]} numberOfLines={1}>
                {formatDate(dateIssued)}
              </Text>
            </View>
          </View>

          <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 160 : 180) : (SCREEN_WIDTH - 48) / (IS_PORTRAIT ? 2 : 3), maxWidth: IS_LANDSCAPE ? '25%' : (IS_PORTRAIT ? '48%' : '32%') }]}>
            <View style={[styles.headerIconContainer, { backgroundColor: colors.secondary + '15' }]}>
              <MaterialCommunityIcons name="clock-outline" size={18} color={colors.secondary} />
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.headerLabel, { color: colors.textTertiary }]}>TIME ISSUED</Text>
              <Text style={[styles.headerValue, { color: colors.text }]} numberOfLines={1}>
                {formatTime(timeIssued)}
              </Text>
            </View>
          </View>

          <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 160 : 180) : (SCREEN_WIDTH - 48) / (IS_PORTRAIT ? 2 : 3), maxWidth: IS_LANDSCAPE ? '25%' : (IS_PORTRAIT ? '48%' : '32%') }]}>
            <View style={[styles.headerIconContainer, { backgroundColor: colors.textTertiary + '15' }]}>
              <MaterialCommunityIcons name="clock-outline" size={18} color={colors.textTertiary} />
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.headerLabel, { color: colors.textTertiary }]}>TIME REQUEST</Text>
              <Text style={[styles.headerValue, { color: colors.text }]} numberOfLines={1}>
                {formatTime(timeRequest)}
              </Text>
            </View>
          </View>

          <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 160 : 180) : (SCREEN_WIDTH - 48) / (IS_PORTRAIT ? 2 : 3), maxWidth: IS_LANDSCAPE ? '25%' : (IS_PORTRAIT ? '48%' : '32%') }]}>
            <View style={[styles.headerIconContainer, { backgroundColor: colors.warning + '15' }]}>
              <MaterialCommunityIcons name="account-arrow-right" size={18} color={colors.warning} />
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.headerLabel, { color: colors.textTertiary }]}>ISSUED BY</Text>
              <Text style={[styles.headerValue, { color: colors.text }]} numberOfLines={1}>
                {issuedBy || '-'}
              </Text>
            </View>
          </View>

          <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 160 : 180) : (SCREEN_WIDTH - 48) / (IS_PORTRAIT ? 2 : 3), maxWidth: IS_LANDSCAPE ? '25%' : (IS_PORTRAIT ? '48%' : '32%') }]}>
            <View style={[styles.headerIconContainer, { backgroundColor: colors.success + '15' }]}>
              <MaterialCommunityIcons name="account-check" size={18} color={colors.success} />
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.headerLabel, { color: colors.textTertiary }]}>APPROVED BY</Text>
              <Text style={[styles.headerValue, { color: colors.text }]} numberOfLines={1}>
                {approvedBy || '-'}
              </Text>
            </View>
          </View>

          <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 160 : 180) : (SCREEN_WIDTH - 48) / (IS_PORTRAIT ? 2 : 3), maxWidth: IS_LANDSCAPE ? '25%' : (IS_PORTRAIT ? '48%' : '32%') }]}>
            <View style={[styles.headerIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <MaterialCommunityIcons name="account" size={18} color={colors.primary} />
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.headerLabel, { color: colors.textTertiary }]}>CONTACT PERSON</Text>
              <Text style={[styles.headerValue, { color: colors.text }]} numberOfLines={1}>
                {contactPerson || '-'}
              </Text>
            </View>
          </View>

          <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 160 : 180) : (SCREEN_WIDTH - 48) / (IS_PORTRAIT ? 2 : 3), maxWidth: IS_LANDSCAPE ? '25%' : (IS_PORTRAIT ? '48%' : '32%') }]}>
            <View style={[styles.headerIconContainer, { backgroundColor: colors.secondary + '15' }]}>
              <MaterialCommunityIcons name="map-marker-outline" size={18} color={colors.secondary} />
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.headerLabel, { color: colors.textTertiary }]}>TRANSFER LOCN</Text>
              <Text style={[styles.headerValue, { color: colors.text }]} numberOfLines={1}>
                {transferLocnCode || '-'}
              </Text>
            </View>
          </View>

          <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 160 : 180) : (SCREEN_WIDTH - 48) / (IS_PORTRAIT ? 2 : 3), maxWidth: IS_LANDSCAPE ? '25%' : (IS_PORTRAIT ? '48%' : '32%') }]}>
            <View style={[styles.headerIconContainer, { backgroundColor: colors.warning + '15' }]}>
              <MaterialCommunityIcons name="office-building-outline" size={18} color={colors.warning} />
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.headerLabel, { color: colors.textTertiary }]}>PROJECT</Text>
              <Text style={[styles.headerValue, { color: colors.text }]} numberOfLines={1}>
                {projectName || '-'}
              </Text>
            </View>
          </View>

          <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 160 : 180) : (SCREEN_WIDTH - 48) / (IS_PORTRAIT ? 2 : 3), maxWidth: IS_LANDSCAPE ? '25%' : (IS_PORTRAIT ? '48%' : '32%') }]}>
            <View style={[styles.headerIconContainer, { backgroundColor: colors.textTertiary + '15' }]}>
              <MaterialCommunityIcons name="map-outline" size={18} color={colors.textTertiary} />
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.headerLabel, { color: colors.textTertiary }]}>AREA TRANSFER</Text>
              <Text style={[styles.headerValue, { color: colors.text }]} numberOfLines={1}>
                {areaTransfer || '-'}
              </Text>
            </View>
          </View>

          {shift && (
            <View style={[styles.headerItem, { minWidth: IS_TABLET ? (IS_LANDSCAPE ? 160 : 180) : (SCREEN_WIDTH - 48) / (IS_PORTRAIT ? 2 : 3), maxWidth: IS_LANDSCAPE ? '25%' : (IS_PORTRAIT ? '48%' : '32%') }]}>
              <View style={[styles.headerIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <MaterialCommunityIcons name="weather-night" size={18} color={colors.primary} />
              </View>
              <View style={styles.headerContent}>
                <Text style={[styles.headerLabel, { color: colors.textTertiary }]}>SHIFT</Text>
                <Text style={[styles.headerValue, { color: colors.text }]} numberOfLines={1}>
                  {shift}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.tableSection, { backgroundColor: colors.background }]}>
        <View style={[styles.tableHeader, { backgroundColor: colors.cardBackground, borderBottomColor: colors.divider }]}>
          <View style={[styles.tableHeaderCell, { width: IS_TABLET ? (IS_LANDSCAPE ? 60 : 80) : 70 }]}>
            <Text style={[styles.tableHeaderText, { color: colors.textSecondary }]}>#</Text>
          </View>
          <View style={[styles.tableHeaderCell, { flex: 1.5, minWidth: 100 }]}>
            <Text style={[styles.tableHeaderText, { color: colors.textSecondary }]}>ITEM CODE</Text>
          </View>
          <View style={[styles.tableHeaderCell, { flex: 2, minWidth: 120 }]}>
            <Text style={[styles.tableHeaderText, { color: colors.textSecondary }]}>LOT NUMBER</Text>
          </View>
          <View style={[styles.tableHeaderCell, { flex: 1, minWidth: 80 }]}>
            <Text style={[styles.tableHeaderText, { color: colors.textSecondary }]}>QTY</Text>
          </View>
          <View style={[styles.tableHeaderCell, { flex: 0.8, minWidth: 60 }]}>
            <Text style={[styles.tableHeaderText, { color: colors.textSecondary }]}>UOFM</Text>
          </View>
          <View style={[styles.tableHeaderCell, { flex: 1.5, minWidth: 100 }]}>
            <Text style={[styles.tableHeaderText, { color: colors.textSecondary }]}>REMARKS</Text>
          </View>
        </View>

        {details.map((detail, index) => {
          const isEven = index % 2 === 0;
          return (
            <View
              key={`${detail.REFERENCENO}-${detail.LINENUMRECV}-${index}`}
              style={[
                styles.tableRow,
                {
                  backgroundColor: isEven ? colors.cardBackground : colors.background + '50',
                  borderBottomColor: colors.divider,
                },
              ]}
            >
              <View style={[styles.tableCell, { width: IS_TABLET ? (IS_LANDSCAPE ? 60 : 80) : 70 }]}>
                <View style={[styles.rowNumberBadge, { backgroundColor: isEven ? colors.primary + '15' : colors.textTertiary + '10' }]}>
                  <Text style={[styles.rowNumberText, { color: isEven ? colors.primary : colors.textTertiary }]}>
                    {index + 1}
                  </Text>
                </View>
              </View>
              <View style={[styles.tableCell, { flex: 1.5, minWidth: 100 }]}>
                <Text style={[styles.cellText, { color: colors.text }]} numberOfLines={1}>
                  {detail.ITEMNMBR || '-'}
                </Text>
              </View>
              <View style={[styles.tableCell, { flex: 2, minWidth: 120 }]}>
                <Text style={[styles.cellText, { color: colors.text }]} numberOfLines={1}>
                  {detail.LOTNUMBER || '-'}
                </Text>
              </View>
              <View style={[styles.tableCell, { flex: 1, minWidth: 80 }]}>
                <Text style={[styles.cellTextNumber, { color: colors.primary }]} numberOfLines={1}>
                  {formatNumber(detail.QUANTITY, 3)}
                </Text>
              </View>
              <View style={[styles.tableCell, { flex: 0.8, minWidth: 60 }]}>
                <Text style={[styles.cellText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {detail.UOFM || '-'}
                </Text>
              </View>
              <View style={[styles.tableCell, { flex: 1.5, minWidth: 100 }]}>
                <Text style={[styles.cellText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {detail.REMARKS || '-'}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={[styles.footer, { backgroundColor: colors.cardBackground, borderTopColor: colors.divider }]}>
        <View style={styles.footerContent}>
          <View style={styles.footerItem}>
            <MaterialCommunityIcons name="package-variant" size={16} color={colors.primary} />
            <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>Total Items:</Text>
            <Text style={[styles.footerValue, { color: colors.text }]}>{details.length}</Text>
          </View>
          <View style={[styles.footerDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.footerItem}>
            <MaterialCommunityIcons name="scale" size={16} color={colors.secondary} />
            <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>Total Qty:</Text>
            <Text style={[styles.footerValue, { color: colors.text }]}>
              {formatNumber(details.reduce((sum, d) => sum + (d.QUANTITY || 0), 0), 3)}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    maxWidth: 340,
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
  backToListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  backToListText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsTitleContainer: {
    flex: 1,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  detailsSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  headerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  tableSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  tableHeaderCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    minHeight: 52,
  },
  tableCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  cellText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  cellTextNumber: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  rowNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowNumberText: {
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  footerValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  footerDivider: {
    width: 1,
    height: 20,
  },
});
