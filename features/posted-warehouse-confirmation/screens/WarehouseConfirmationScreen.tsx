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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH > 768;




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


  // Fetch pending transactions on mount
  useEffect(() => {
    fetchPendingTransactions();
  }, []);

  // Update filtered transactions when search query changes
  useEffect(() => {
    if (searchQuery) {
      const filtered = pendingTransactions.filter(
        (transaction) =>
          transaction.TRANSREFNO.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (transaction.ITEMNMBR || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (transaction.TRANSTYPE || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (transaction.FROMLOCNCODE || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (transaction.ISSUEDBY || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTransactions(filtered);
    } else {
      setFilteredTransactions([]);
    }
  }, [searchQuery, pendingTransactions]);

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
      const result = await warehouseMetricsService.getTransactionDetails(transRefNo);
      
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

  const renderTransactionItem = ({ item, index }: { item: TransactionHeader; index: number }) => {
    const isSelected = selectedTransaction?.TRANSREFNO === item.TRANSREFNO;

    
    return (
      <TouchableOpacity
        style={[
          styles.transactionItem,
          {
            backgroundColor: colors.cardBackground,
            borderColor: isSelected ? colors.primary : colors.cardBorder,
            shadowColor: colors.shadowColor,
          },
          isSelected && styles.transactionItemSelected,
        ]}
        onPress={() => handleTransactionSelect(item)}
        activeOpacity={0.8}
      >
        {/* Status Indicator */}
        <View style={[styles.statusIndicator, { backgroundColor: colors.success }]} />
        
        {/* Card Content */}
        <View style={styles.transactionContent}>
          {/* Header Section */}
          <View style={styles.transactionHeader}>
            <View style={[styles.transactionIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={IS_TABLET ? 32 : 28}
                color={colors.primary}
              />
            </View>
            <View style={styles.transactionMainInfo}>
              <Text style={[styles.transactionRefNo, { color: colors.text }]} numberOfLines={1}>
                {item.TRANSREFNO}
              </Text>
              <Text style={[styles.transactionItemCode, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.ITEMNMBR}
              </Text>
            </View>
            <View style={styles.chevronContainer}>
              <MaterialCommunityIcons
                name="chevron-right"
                size={IS_TABLET ? 28 : 24}
                color={colors.textTertiary}
              />
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* Details Grid */}
          <View style={styles.transactionDetailsGrid}>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="calendar" size={16} color={colors.textTertiary} />
              <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Date</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(item.DATETRANS)}</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="tag-outline" size={16} color={colors.textTertiary} />
              <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Type</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{item.TRANSTYPE || '-'}</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.textTertiary} />
              <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Location</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{item.FROMLOCNCODE || '-'}</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="account-outline" size={16} color={colors.textTertiary} />
              <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Issued By</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{item.ISSUEDBY || '-'}</Text>
            </View>
          </View>
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
              {selectedTransaction.TRANSREFNO}
            </Text>
            <Text style={[styles.detailsSubtitle, { color: colors.textSecondary }]}>
              Transaction Details • {transactionDetails.length} items
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
            <MaterialCommunityIcons name="check-circle-outline" size={14} color={colors.success} />
            <Text style={[styles.statusText, { color: colors.success }]}>Posted</Text>
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
          <TransactionDetailList details={transactionDetails} />
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
                Issuance Verification Lists
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Select a transaction to view and confirm details
            </Text>
          </View>
        </View>
        
        {/* Stats Bar */}
        <View style={[styles.statsBar, { backgroundColor: colors.background }]}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="file-check-outline" size={20} color={colors.success} />
            <Text style={[styles.statValue, { color: colors.text }]}>{searchQuery ? filteredTransactions.length : pendingTransactions.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{searchQuery ? 'Results' : 'Results'}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="refresh" size={20} color={colors.primary} />
            <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
              <Text style={[styles.statLabel, { color: colors.primary }]}>Pull to refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.searchInputWrapper, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search transactions..."
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
        </View>
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
          data={searchQuery ? filteredTransactions : pendingTransactions}
          keyExtractor={(item) => item.TRANSREFNO}
          renderItem={renderTransactionItem}
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
    fontSize: IS_TABLET ? 15 : 14,
    marginTop: 4,
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
    fontSize: 13,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  // Search styles
  searchContainer: {
    marginTop: 12,
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
  // List styles
  listContainer: {
    padding: IS_TABLET ? 24 : 16,
    paddingBottom: 32,
    gap: IS_TABLET ? 16 : 12,
  },
  listContainerTablet: {
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
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
    padding: IS_TABLET ? 18 : 14,
    gap: 14,
  },
  transactionIconContainer: {
    width: IS_TABLET ? 56 : 48,
    height: IS_TABLET ? 56 : 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionMainInfo: {
    flex: 1,
    gap: 4,
  },
  transactionRefNo: {
    fontSize: IS_TABLET ? 18 : 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  transactionItemCode: {
    fontSize: IS_TABLET ? 15 : 13,
    fontWeight: '500',
  },
  chevronContainer: {
    width: IS_TABLET ? 36 : 32,
    height: IS_TABLET ? 36 : 32,
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
    padding: IS_TABLET ? 18 : 14,
    gap: IS_TABLET ? 16 : 12,
  },
  detailItem: {
    width: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: IS_TABLET ? 13 : 12,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: IS_TABLET ? 13 : 12,
    fontWeight: '600',
    flex: 1,
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
    fontSize: 13,
    fontWeight: '500',
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  quantityUnit: {
    fontSize: 12,
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
    fontSize: 14,
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
    fontSize: IS_TABLET ? 14 : 13,
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
    fontSize: 12,
    fontWeight: '600',
  },
});

export default PostedWarehouseConfirmationScreen;
