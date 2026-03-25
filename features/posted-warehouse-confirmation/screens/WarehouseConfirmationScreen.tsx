import { DatePickerModal } from '@/components/DatePickerModal';
import { Colors } from '@/constants/theme';
import { warehouseMetricsService } from '@/features/home/services/warehouseMetricsService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TransactionDetailList } from '../components/TransactionDetailList';
import { TransactionDetail, TransactionHeader } from '../types/confirmation.types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH > 768;
const IS_PORTRAIT = SCREEN_HEIGHT > SCREEN_WIDTH;
const IS_LANDSCAPE = !IS_PORTRAIT;
const IS_SMALL_SCREEN = SCREEN_WIDTH < 380;

// Helper to ensure minimum font size of 14 in landscape mode
const fontSize = (portraitSize: number, tabletSize?: number) => {
  const baseSize = IS_TABLET && tabletSize ? tabletSize : portraitSize;
  return IS_LANDSCAPE ? Math.max(baseSize, 14) : baseSize;
};




interface WarehouseConfirmationScreenProps {
  navigation?: any;
  route?: any;
}

export function PostedWarehouseConfirmationScreen({ navigation, route }: WarehouseConfirmationScreenProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const router = useRouter();

  const [pendingTransactions, setPendingTransactions] = useState<TransactionHeader[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionHeader | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<TransactionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionHeader[]>([]);

  // Date range state
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    return new Date(); // Today
  });
  const [dateFilterVersion, setDateFilterVersion] = useState(0);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);


  // Fetch pending transactions on mount
  useEffect(() => {
    fetchPendingTransactions();
  }, []);

  // Update filtered transactions when search query or date filter changes
  useEffect(() => {
    let filtered = pendingTransactions;

    // Apply date filter when View button is clicked (version changes)
    if (dateFilterVersion > 0) {
      filtered = filtered.filter((transaction) => {
        const transDate = new Date(transaction.DATETRANS);
        // Normalize dates to compare only the date part (year, month, day)
        const transDateOnly = new Date(transDate.getFullYear(), transDate.getMonth(), transDate.getDate());
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        return transDateOnly >= startDateOnly && transDateOnly <= endDateOnly;
      });
    }

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.TRANSREFNO.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (transaction.ITEMNMBR || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          // Format date for search comparison (e.g., "Sep 2 2026" or "Sep 2")
          (() => {
            try {
              const date = new Date(transaction.DATETRANS);
              if (!isNaN(date.getTime())) {
                const formattedDate = date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                return formattedDate.toLowerCase().includes(searchQuery.toLowerCase());
              }
              return false;
            } catch {
              return false;
            }
          })() ||
          (transaction.TRANSTYPE || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (transaction.FROMLOCNCODE || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (transaction.ISSUEDBY || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Update filteredTransactions when View is clicked or search is active
    if (dateFilterVersion > 0 || searchQuery) {
      setFilteredTransactions(filtered);
    }
  }, [searchQuery, pendingTransactions, dateFilterVersion]);

  // Fetch transaction details when a transaction is selected
  useEffect(() => {
    if (selectedTransaction) {
      fetchTransactionDetails(selectedTransaction.TRANSREFNO);
    }
  }, [selectedTransaction]);

  const fetchPendingTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await warehouseMetricsService.getPostedTransactions(0, 999999);

      if (result && result.success) {
        setPendingTransactions(result.data || []);
      } else {
        setError('Failed to load pending transactions');
      }
    } catch (err) {
      console.error('Error fetching pending transactions:', err);
      setError('Failed to load pending transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTransactionDetails = async (transRefNo: string) => {
    try {
      setLoadingDetails(true);
      const result = await warehouseMetricsService.getPostedTransactionDetails(transRefNo);

      if (result && result.success) {
        setTransactionDetails(result.data || []);
      } else {
        setTransactionDetails([]);
      }
    } catch (err) {
      console.error('Error fetching transaction details:', err);
      setTransactionDetails([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleTransactionSelect = (transaction: TransactionHeader) => {
    setSelectedTransaction(transaction);
  };

  const handleBackToList = () => {
    setSelectedTransaction(null);
    setTransactionDetails([]);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPendingTransactions();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Date range navigation functions
  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  const goToPreviousMonth = () => {
    const newStart = new Date(startDate);
    newStart.setMonth(newStart.getMonth() - 1);
    newStart.setDate(1);

    const newEnd = new Date(newStart);
    newEnd.setMonth(newEnd.getMonth() + 1);
    newEnd.setDate(0); // Last day of previous month

    setStartDate(newStart);
    setEndDate(newEnd);
  };

  const goToNextMonth = () => {
    const newStart = new Date(startDate);
    newStart.setMonth(newStart.getMonth() + 1);

    let newEnd = new Date(newStart);
    newEnd.setMonth(newEnd.getMonth() + 1);
    newEnd.setDate(0); // Last day of next month

    // Don't go beyond today
    const today = new Date();
    if (newEnd > today) {
      newEnd = today;
    }

    setStartDate(newStart);
    setEndDate(newEnd);
  };

  const handleViewButton = () => {
    // Increment version to trigger filter re-application
    setDateFilterVersion(prev => prev + 1);
  };

  // Date picker functions
  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const openDatePicker = (mode: 'start' | 'end') => {
    if (mode === 'start') {
      setShowStartDatePicker(true);
    } else {
      setShowEndDatePicker(true);
    }
  };

  const resetDateFilter = () => {
    const date = new Date();
    date.setDate(1);
    setStartDate(date);
    setEndDate(new Date());
    setDateFilterVersion(0);
  };

  const formatDate = (dateString: string) => {
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

  // Table Header Component
  const renderTableHeader = () => (
    <View style={[styles.tableHeader, { backgroundColor: colors.primary + '12', borderBottomColor: colors.primary }]}>
      <View style={[styles.tableHeaderCell, styles.tableStatusCell]}>
        <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={14} color={colors.primary} />
      </View>
      <View style={[styles.tableHeaderCell, styles.tableRefNoCell]}>
        <Text style={[styles.tableHeaderText, { color: colors.primary }]}>ISS REF NO.</Text>
      </View>
      <View style={[styles.tableHeaderCell, styles.tableRefNoCell]}>
        <Text style={[styles.tableHeaderText, { color: colors.primary }]}>TRANS REF NO.</Text>
      </View>
      <View style={[styles.tableHeaderCell, styles.tableDateCell]}>
        <MaterialCommunityIcons name="calendar" size={14} color={colors.primary} />
        <Text style={[styles.tableHeaderText, { color: colors.primary }]}>DATE</Text>
      </View>
      <View style={[styles.tableHeaderCell, styles.tableTypeCell]}>
        <MaterialCommunityIcons name="tag-outline" size={14} color={colors.primary} />
        <Text style={[styles.tableHeaderText, { color: colors.primary }]}>TYPE</Text>
      </View>
      <View style={[styles.tableHeaderCell, styles.tableLocationCell]}>
        <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.primary} />
        <Text style={[styles.tableHeaderText, { color: colors.primary }]}>LOCATION</Text>
      </View>
      <View style={[styles.tableHeaderCell, styles.tableIssuedByCell]}>
        <MaterialCommunityIcons name="account-outline" size={14} color={colors.primary} />
        <Text style={[styles.tableHeaderText, { color: colors.primary }]}>ISSUED BY</Text>
      </View>
      <View style={[styles.tableHeaderCell, styles.tableActionCell]}>
        <MaterialCommunityIcons name="eye" size={14} color={colors.primary} />
      </View>
    </View>
  );

  const renderTransactionItem = ({ item, index }: { item: TransactionHeader; index: number }) => {
    const isSelected = selectedTransaction?.TRANSREFNO === item.TRANSREFNO;
    const isEven = index % 2 === 0;

    return (
      <TouchableOpacity
        style={[
          styles.tableRow,
          {
            backgroundColor: isEven ? colors.cardBackground : colors.background,
            borderBottomColor: colors.cardBorder,
          },
          isSelected && { backgroundColor: colors.primary + '08' },
        ]}
        onPress={() => handleTransactionSelect(item)}
        activeOpacity={0.7}
      >
        {/* Status Indicator */}
        <View style={[styles.tableCell, styles.tableStatusCell]}>
          <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
        </View>

        <View style={[styles.tableCell, styles.tableRefNoCell]}>
          <Text style={[styles.tableCellText, { color: colors.text }]} numberOfLines={1}>
            {item.FROMTRANSNO}
          </Text>
        </View>

        {/* Reference No */}
        <View style={[styles.tableCell, styles.tableRefNoCell]}>
          <Text style={[styles.tableCellText, { color: colors.text }]} numberOfLines={1}>
            {item.TRANSREFNO}
          </Text>
        </View>

        {/* Date */}
        <View style={[styles.tableCell, styles.tableDateCell]}>
          <Text style={[styles.tableCellText, { color: colors.text }]} numberOfLines={1}>
            {formatDate(item.DATETRANS)}
          </Text>
        </View>

        {/* Type */}
        <View style={[styles.tableCell, styles.tableTypeCell]}>
          <Text style={[styles.tableCellText, { color: colors.text }]} numberOfLines={2}>
            {item.TRANSTYPE || '-'}
          </Text>
        </View>

        {/* Location */}
        <View style={[styles.tableCell, styles.tableLocationCell]}>
          <Text style={[styles.tableCellText, { color: colors.text }]} numberOfLines={1}>
            {item.FROMLOCNCODE || '-'}
          </Text>
        </View>

        {/* Issued By */}
        <View style={[styles.tableCell, styles.tableIssuedByCell]}>
          <Text style={[styles.tableCellText, { color: colors.text }]} numberOfLines={1}>
            {item.ISSUEDBY || '-'}
          </Text>
        </View>

        {/* Action Chevron */}
        <View style={[styles.tableCell, styles.tableActionCell]}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={IS_TABLET ? 20 : 18}
            color={colors.textTertiary}
          />
        </View>
      </TouchableOpacity>
    );
  };

  // Show transaction details view when a transaction is selected
  if (selectedTransaction) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        {/* Details Header */}
        <View style={[styles.detailsHeader, { backgroundColor: colors.cardBackground, borderBottomColor: colors.cardBorder }]}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary + '10' }]}
            onPress={handleBackToList}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={IS_TABLET ? 26 : 22} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.detailsTitleContainer}>
            <Text style={[styles.detailsTitle, { color: colors.text }]} numberOfLines={1}>
              TRANSACTION DETAILS
            </Text>
          </View>
        </View>

        {loadingDetails ? (
          <View style={styles.loadingContainer}>
            <View style={[styles.loadingCard, { backgroundColor: colors.cardBackground }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading transaction details...
              </Text>
            </View>
          </View>
        ) : (
          <TransactionDetailList 
            details={transactionDetails} 
            fromTransNo={selectedTransaction?.FROMTRANSNO}
            transRefNo={selectedTransaction?.TRANSREFNO}
            issuedBy={selectedTransaction?.ISSUEDBY}
            transDate={selectedTransaction?.DATETRANS}
            receivedBy={selectedTransaction?.RECEIVEDBY}
          />
        )}
      </SafeAreaView>
    );
  }

  // Show pending transactions list
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.cardBorder }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary + '10' }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={IS_TABLET ? 26 : 22} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={IS_TABLET ? 32 : 28} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                POSTED TRANSACTION LIST
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Select a transaction to view and confirm details
            </Text>
          </View>
          {/* Total Issuance Stats - Emphasized */}
          <View style={[styles.totalIssuanceContainer, { backgroundColor: colors.success + '12' }]}>
            <MaterialCommunityIcons name="file-check-outline" size={24} color={colors.success} />
            <View style={styles.totalIssuanceContent}>
              <Text style={[styles.totalIssuanceLabel, { color: colors.textSecondary }]}>
                {dateFilterVersion > 0 || searchQuery ? 'FILTERED' : 'TOTAL'} ISSUANCE
              </Text>
              <Text style={[styles.totalIssuanceValue, { color: colors.success }]}>
                {dateFilterVersion > 0 || searchQuery ? filteredTransactions.length : pendingTransactions.length}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Date Range Picker - Outside Header */}
      <View style={[styles.dateRangeContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.dateRangeWrapper, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <TouchableOpacity
            style={[styles.dateArrowButton, { backgroundColor: colors.primary + '15' }]}
            onPress={goToPreviousMonth}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="chevron-left" size={22} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.dateRangeDisplay}>
            <TouchableOpacity
              style={styles.dateInputButton}
              onPress={() => openDatePicker('start')}
            >
              <MaterialCommunityIcons name="calendar" size={16} color={colors.primary} />
              <Text style={[styles.dateInputText, { color: colors.text }]}>
                {formatDateDisplay(startDate)}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.dateRangeSeparator, { color: colors.textTertiary }]}>to</Text>

            <TouchableOpacity
              style={styles.dateInputButton}
              onPress={() => openDatePicker('end')}
            >
              <MaterialCommunityIcons name="calendar" size={16} color={colors.primary} />
              <Text style={[styles.dateInputText, { color: colors.text }]}>
                {formatDateDisplay(endDate)}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.dateArrowButton, { backgroundColor: colors.primary + '15' }]}
            onPress={goToNextMonth}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.viewButton,
              { backgroundColor: colors.primary }
            ]}
            onPress={handleViewButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="eye"
              size={18}
              color="#ffffff"
            />
            <Text style={styles.viewButtonText}>
              View
            </Text>
          </TouchableOpacity>

          {dateFilterVersion > 0 && (
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: colors.error + '15' }]}
              onPress={resetDateFilter}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="close" size={18} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.searchInputWrapper, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by TRANS REF NO., TRANS DATE, ISSUED BY, RECEIVED BY"
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.searchHint, { color: colors.textTertiary }]}>
          Tap a row below to view transaction details
        </Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingCard, { backgroundColor: colors.cardBackground }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading pending transactions...
            </Text>
          </View>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <View style={[styles.errorCard, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.errorIconContainer, { backgroundColor: colors.error + '15' }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.error} />
            </View>
            <Text style={[styles.errorTitle, { color: colors.text }]}>Unable to Load</Text>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={fetchPendingTransactions}
            >
              <MaterialCommunityIcons name="refresh" size={20} color="#ffffff" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : pendingTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.success + '15' }]}>
              <MaterialCommunityIcons name="check-circle-outline" size={64} color={colors.success} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              All Caught Up!
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              No pending transactions to confirm
            </Text>
            <TouchableOpacity
              style={[styles.refreshButton, { backgroundColor: colors.primary + '10' }]}
              onPress={handleRefresh}
            >
              <MaterialCommunityIcons name="refresh" size={20} color={colors.primary} />
              <Text style={[styles.refreshButtonText, { color: colors.primary }]}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={searchQuery || dateFilterVersion > 0 ? filteredTransactions : pendingTransactions}
          keyExtractor={(item) => item.TRANSREFNO}
          renderItem={renderTransactionItem}
          ListHeaderComponent={renderTableHeader}
          contentContainerStyle={[
            styles.listContainer,
            IS_TABLET && styles.listContainerTablet,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            searchQuery ? (
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground }]}>
                  <View style={[styles.emptyIconContainer, { backgroundColor: colors.textTertiary + '15' }]}>
                    <MaterialCommunityIcons name="magnify-close" size={64} color={colors.textTertiary} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    No Results Found
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    Try adjusting your search query
                  </Text>
                  <TouchableOpacity
                    style={[styles.refreshButton, { backgroundColor: colors.primary + '10' }]}
                    onPress={clearSearch}
                  >
                    <MaterialCommunityIcons name="close" size={20} color={colors.primary} />
                    <Text style={[styles.refreshButtonText, { color: colors.primary }]}>Clear Search</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null
          }
        />
      )}

      {/* Date Picker Modals */}
      <DatePickerModal
        visible={showStartDatePicker}
        mode="start"
        selectedDate={startDate}
        onClose={() => setShowStartDatePicker(false)}
        onConfirm={(date) => setStartDate(date)}
        colors={{ primary: colors.primary, cardBackground: colors.cardBackground, divider: colors.divider, text: colors.text, textSecondary: colors.textSecondary }}
      />
      <DatePickerModal
        visible={showEndDatePicker}
        mode="end"
        selectedDate={endDate}
        onClose={() => setShowEndDatePicker(false)}
        onConfirm={(date) => setEndDate(date)}
        colors={{ primary: colors.primary, cardBackground: colors.cardBackground, divider: colors.divider, text: colors.text, textSecondary: colors.textSecondary }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  // Header styles
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: IS_TABLET ? 24 : 16,
    paddingVertical: IS_TABLET ? 20 : 16,
    width: '100%',
    alignSelf: 'stretch',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: IS_TABLET ? 26 : 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: fontSize(14, 15),
    marginTop: 4,
  },
  // Total Issuance Styles - Emphasized
  totalIssuanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 10,
  },
  totalIssuanceContent: {
    alignItems: 'center',
  },
  totalIssuanceValue: {
    fontSize: IS_TABLET ? 28 : 24,
    fontWeight: '800',
    lineHeight: IS_TABLET ? 32 : 28,
    textAlign: 'center',
  },
  totalIssuanceLabel: {
    fontSize: fontSize(14),
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: fontSize(13),
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  // Date range styles
  dateRangeContainer: {
    paddingHorizontal: IS_TABLET ? 24 : 16,
    paddingTop: 16,
    width: '100%',
    alignSelf: 'stretch',
  },
  dateRangeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IS_TABLET ? 16 : 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  dateArrowButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateRangeDisplay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  dateInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dateInputText: {
    fontSize: fontSize(13),
    fontWeight: '600',
  },
  dateRangeSeparator: {
    fontSize: fontSize(13),
    fontWeight: '500',
  },
  dateRangeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  viewButtonText: {
    color: '#ffffff',
    fontSize: fontSize(13),
    fontWeight: '600',
  },
  resetButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Search styles
  searchContainer: {
    paddingHorizontal: IS_TABLET ? 24 : 16,
    paddingTop: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  searchHint: {
    fontSize: fontSize(12),
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  // List styles
  listContainer: {
    padding: IS_TABLET ? 24 : 16,
    paddingBottom: 32,
    gap: IS_TABLET ? 16 : 12,
    width: '100%',
    alignSelf: 'stretch',
  },
  listContainerTablet: {
    width: '100%',
    alignSelf: 'stretch',
  },
  // Transaction item styles
  transactionItem: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    width: '100%',
  },
  transactionItemSelected: {
    borderWidth: 2,
    shadowOpacity: 0.15,
    elevation: 5,
  },
  statusIndicator: {
    width: 5,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  transactionContent: {
    marginLeft: 5,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: IS_TABLET ? 6 : 8,
    gap: 6,
  },
  transactionHeaderPortrait: {
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: IS_TABLET ? 6 : 6,
    gap: 6,
  },
  transactionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIconContainer: {
    width: IS_TABLET ? 36 : 32,
    height: IS_TABLET ? 36 : 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionMainInfo: {
    flex: 1,
  },
  transactionMainInfoPortrait: {
    flex: 1.2,
  },
  transactionRefNo: {
    fontSize: IS_TABLET ? 16 : 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  transactionItemCode: {
    fontSize: fontSize(10, 11),
    fontWeight: '500',
  },
  chevronContainer: {
    width: IS_TABLET ? 24 : 20,
    height: IS_TABLET ? 24 : 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginHorizontal: IS_TABLET ? 18 : 14,
  },
  transactionDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IS_TABLET ? 8 : 6,
  },
  transactionDetailsGridPortrait: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IS_TABLET ? 8 : 4,
    marginTop: 2,
  },
  detailItemCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 50,
    maxWidth: '25%',
    flex: 1,
  },
  detailValueCompact: {
    fontSize: fontSize(9),
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: IS_TABLET ? 110 : (IS_PORTRAIT ? '45%' : 90),
    minWidth: IS_PORTRAIT ? 60 : undefined,
  },
  detailLabel: {
    fontSize: fontSize(10, 11),
    fontWeight: '500',
  },
  detailValue: {
    fontSize: fontSize(10, 11),
    fontWeight: '600',
  },
  quantitySection: {
    paddingHorizontal: IS_TABLET ? 18 : 14,
    paddingBottom: IS_TABLET ? 18 : 14,
  },
  quantityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 8,
    alignSelf: 'flex-start',
  },
  quantityLabel: {
    fontSize: fontSize(13),
    fontWeight: '500',
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  quantityUnit: {
    fontSize: fontSize(12),
    fontWeight: '500',
  },
  // Loading & Error states
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    gap: 12,
    maxWidth: 320,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
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
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  refreshButtonText: {
    fontSize: fontSize(14),
    fontWeight: '600',
  },
  // Details view styles
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IS_TABLET ? 24 : 16,
    paddingVertical: IS_TABLET ? 18 : 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    width: IS_TABLET ? 44 : 40,
    height: IS_TABLET ? 44 : 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsTitleContainer: {
    flex: 1,
  },
  detailsTitle: {
    fontSize: IS_TABLET ? 20 : 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  detailsSubtitle: {
    fontSize: fontSize(13, 14),
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
    fontSize: fontSize(12),
    fontWeight: '600',
  },
  // Table styles
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: IS_TABLET ? 12 : 8,
    borderBottomWidth: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  tableHeaderCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tableHeaderText: {
    fontSize: fontSize(10, 11),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: IS_TABLET ? 14 : 12,
    paddingHorizontal: IS_TABLET ? 12 : 8,
    borderBottomWidth: 1,
  },
  tableCell: {
    justifyContent: 'center',
  },
  tableCellText: {
    fontSize: fontSize(12, 13),
    fontWeight: '500',
  },
  tableStatusCell: {
    width: IS_TABLET ? 40 : 32,
  },
  tableRefNoCell: {
    flex: IS_TABLET ? 1.2 : 1,
    minWidth: IS_TABLET ? 100 : 80,
  },
  tableDateCell: {
    flex: IS_TABLET ? 0.9 : 0.8,
    minWidth: IS_TABLET ? 80 : 70,
  },
  tableTypeCell: {
    flex: IS_TABLET ? 1.2 : 1,
    minWidth: IS_TABLET ? 90 : 80,
  },
  tableLocationCell: {
    flex: IS_TABLET ? 0.8 : 0.7,
    minWidth: IS_TABLET ? 70 : 60,
  },
  tableIssuedByCell: {
    flex: IS_TABLET ? 1 : 0.8,
    minWidth: IS_TABLET ? 90 : 70,
  },
  tableActionCell: {
    width: IS_TABLET ? 32 : 28,
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default PostedWarehouseConfirmationScreen;
