import { Colors } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { stockBalanceService } from '../services/stockBalanceService';
import { StockBalanceItem } from '../types/stockBalance.types';

const ITEMS_PER_PAGE = 20;

interface StockBalanceScreenProps {
  navigation?: any;
  route?: any;
}

export function StockBalanceScreen({ navigation, route }: StockBalanceScreenProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  const [stockData, setStockData] = useState<StockBalanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<StockBalanceItem[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch stock balance on mount
  useEffect(() => {
    fetchStockBalance();
  }, []);

  // Filter data when search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = stockData.filter(
        (item) =>
          (item.AREA || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.ITEMNMBR || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.LOTNUMBER || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.REMARKS || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredData(filtered);
      setCurrentPage(1); // Reset to first page on search
    } else {
      setFilteredData(stockData);
    }
    setTotalItems(searchQuery.trim() ? filteredData.length : stockData.length);
  }, [searchQuery, stockData]);

  const fetchStockBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await stockBalanceService.getStockBalance();
      
      if (result && result.success) {
        setStockData(result.data || []);
        setTotalItems(result.data?.length || 0);
      } else {
        setError(result.message || 'Failed to load stock balance');
      }
    } catch (err) {
      console.error('Error fetching stock balance:', err);
      setError('Failed to load stock balance');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setSearchQuery('');
    setCurrentPage(1);
    fetchStockBalance();
  }, []);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  // Get items for current page
  const paginatedItems = filteredData.slice(startItem - 1, endItem);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Render table header
  const renderTableHeader = () => (
    <View style={[styles.tableHeader, { backgroundColor: colors.primary + '10', borderBottomColor: colors.cardBorder }]}>
      <Text style={[styles.tableHeaderText, { color: colors.primary }]}>Area</Text>
      <Text style={[styles.tableHeaderTextItem, { color: colors.primary }]}>Item #</Text>
      <Text style={[styles.tableHeaderTextLot, { color: colors.primary }]}>Lot #</Text>
      <Text style={[styles.tableHeaderTextUofm, { color: colors.primary }]}>UOFM</Text>
      <Text style={[styles.tableHeaderTextWt, { color: colors.primary }]}>Ave Wt</Text>
      <Text style={[styles.tableHeaderTextBags, { color: colors.primary }]}>Avail Bags</Text>
      <Text style={[styles.tableHeaderTextKgs, { color: colors.primary }]}>Avail KGS</Text>
    </View>
  );

  // Render table row
  const renderTableRow = (item: StockBalanceItem, index: number) => (
    <View
      key={`${item.ITEMNMBR}-${item.LOTNUMBER}-${index}`}
      style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? colors.background : colors.cardBackground, borderBottomColor: colors.cardBorder }]}
    >
      <Text style={[styles.tableCell, { color: colors.text }]}>{String(item.AREA || '-').trim()}</Text>
      <Text style={[styles.tableCellItem, { color: colors.text }]}>{String(item.ITEMNMBR || '-').trim()}</Text>
      <Text style={[styles.tableCellLot, { color: colors.text }]}>{String(item.LOTNUMBER || '-').trim()}</Text>
      <Text style={[styles.tableCell, { color: colors.text }]}>{String(item.UOFM || '-').trim()}</Text>
      <Text style={[styles.tableCell, { color: colors.text }]}>{Number(item.AVEWT).toFixed(3)}</Text>
      <Text style={[styles.tableCellNumber, { color: item['AVAILABLE BAGS'] > 0 ? colors.success : colors.error }]}>
        {item['AVAILABLE BAGS']}
      </Text>
      <Text style={[styles.tableCellNumber, { color: item['AVAILABLE KGS'] > 0 ? colors.success : colors.error }]}>
        {Number(item['AVAILABLE KGS']).toFixed(2)}
      </Text>
    </View>
  );

  // Render card for mobile
  const renderCard = (item: StockBalanceItem, index: number) => (
    <View
      key={`${item.ITEMNMBR}-${item.LOTNUMBER}-${index}`}
      style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.cardBadge, { backgroundColor: (item['AVAILABLE BAGS'] > 0 ? colors.success : colors.error) + '20' }]}>
          <Text style={[styles.cardBadgeText, { color: item['AVAILABLE BAGS'] > 0 ? colors.success : colors.error }]}>
            {item['AVAILABLE BAGS'] > 0 ? '✓ In Stock' : '✗ Empty'}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.cardRow}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Area</Text>
          <Text style={[styles.cardValue, { color: colors.text }]}>{String(item.AREA || '-').trim()}</Text>
        </View>
        
        <View style={styles.cardRow}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Item #</Text>
          <Text style={[styles.cardValue, { color: colors.text }]}>{String(item.ITEMNMBR || '-').trim()}</Text>
        </View>
        
        <View style={styles.cardRow}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Lot #</Text>
          <Text style={[styles.cardValue, { color: colors.text }]}>{String(item.LOTNUMBER || '-').trim()}</Text>
        </View>
        
        <View style={styles.cardRow}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>UOFM</Text>
          <Text style={[styles.cardValue, { color: colors.text }]}>{String(item.UOFM || '-').trim()}</Text>
        </View>
        
        <View style={styles.cardRow}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Average Weight</Text>
          <Text style={[styles.cardValue, { color: colors.text }]}>{Number(item.AVEWT).toFixed(3)}</Text>
        </View>
        
        <View style={styles.cardRow}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Available Bags</Text>
          <Text style={[styles.cardValue, { color: item['AVAILABLE BAGS'] > 0 ? colors.success : colors.error, fontWeight: '700' }]}>
            {item['AVAILABLE BAGS']}
          </Text>
        </View>
        
        <View style={styles.cardRow}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Available KGS</Text>
          <Text style={[styles.cardValue, { color: item['AVAILABLE KGS'] > 0 ? colors.success : colors.error, fontWeight: '700' }]}>
            {Number(item['AVAILABLE KGS']).toFixed(2)}
          </Text>
        </View>

        {item.REMARKS && (
          <View style={styles.cardRow}>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Remarks</Text>
            <Text style={[styles.cardValue, { color: colors.text }]}>{String(item.REMARKS || '-').trim()}</Text>
          </View>
        )}
      </View>
    </View>
  );

  // Render pagination
  const renderPagination = () => (
    <View style={[
      styles.paginationContainer, 
      { 
        backgroundColor: colors.primary + '08', 
        borderTopColor: colors.cardBorder,
        flexDirection: isTablet ? 'row' : 'column',
        gap: isTablet ? 0 : 12,
        paddingVertical: isTablet ? 16 : 12,
        paddingHorizontal: isTablet ? 20 : 16,
      }
    ]}>
      <Text style={[
        styles.paginationInfo, 
        { color: colors.textSecondary },
        isTablet && styles.paginationInfoTablet
      ]}>
        Showing {totalItems > 0 ? startItem : 0}-{endItem} of {totalItems}
      </Text>

      <View style={[
        styles.paginationControls,
        isTablet && styles.paginationControlsTablet
      ]}>
        <TouchableOpacity
          style={[styles.paginationNavButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
          onPress={() => handlePageChange(1)}
          disabled={currentPage === 1}
        >
          <MaterialCommunityIcons
            name="page-first"
            size={isTablet ? 20 : 18}
            color={currentPage === 1 ? colors.textTertiary : colors.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.paginationNavButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
          onPress={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={isTablet ? 20 : 18}
            color={currentPage === 1 ? colors.textTertiary : colors.primary}
          />
        </TouchableOpacity>

        <View style={[styles.pageIndicator, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[styles.pageIndicatorText, { color: colors.primary }]}>
            {currentPage} / {totalPages}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.paginationNavButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
          onPress={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <MaterialCommunityIcons
            name="chevron-right"
            size={isTablet ? 20 : 18}
            color={currentPage === totalPages ? colors.textTertiary : colors.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.paginationNavButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
          onPress={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <MaterialCommunityIcons
            name="page-last"
            size={isTablet ? 20 : 18}
            color={currentPage === totalPages ? colors.textTertiary : colors.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading Stock Balance...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="alert-circle" size={64} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={fetchStockBalance}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Stock Balance</Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground, borderBottomColor: colors.cardBorder }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by Area, Item #, Lot #..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Summary */}
      <View style={[
        styles.summaryContainer, 
        { backgroundColor: colors.primary + '10' },
        isTablet && styles.summaryContainerTablet
      ]}>
        <View style={[
          styles.summaryItem,
          isTablet && styles.summaryItemTablet
        ]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Records</Text>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>{totalItems}</Text>
        </View>
        <View style={[
          styles.summaryItem,
          isTablet && styles.summaryItemTablet
        ]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Bags</Text>
          <Text style={[styles.summaryValue, { color: colors.success }]}>
            {stockData.reduce((sum, item) => sum + (item['AVAILABLE BAGS'] || 0), 0).toLocaleString()}
          </Text>
        </View>
        <View style={[
          styles.summaryItem,
          isTablet && styles.summaryItemTablet
        ]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total KGS</Text>
          <Text style={[styles.summaryValue, { color: colors.success }]}>
            {stockData.reduce((sum, item) => sum + (item['AVAILABLE KGS'] || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={[styles.contentContainer, isTablet && styles.contentContainerTablet]}>
        {isTablet ? (
          // Table View for Tablets
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
              {renderTableHeader()}
              <FlatList
                data={paginatedItems}
                renderItem={({ item, index }) => renderTableRow(item, index)}
                keyExtractor={(item, index) => `${item.ITEMNMBR}-${item.LOTNUMBER}-${index}`}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                  />
                }
                showsVerticalScrollIndicator={true}
                stickyHeaderIndices={[]}
              />
            </View>
          </ScrollView>
        ) : (
          // Card View for Phones
          <FlatList
            data={paginatedItems}
            renderItem={({ item, index }) => renderCard(item, index)}
            keyExtractor={(item, index) => `${item.ITEMNMBR}-${item.LOTNUMBER}-${index}`}
            contentContainerStyle={styles.cardListContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="package-variant" size={64} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {searchQuery ? 'No matching records found' : 'No stock balance data available'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Pagination */}
      {totalItems > ITEMS_PER_PAGE && (
        <View style={{ paddingBottom: insets.bottom }}>
          {renderPagination()}
        </View>
      )}
    </SafeAreaView>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  summaryContainerTablet: {
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryItemTablet: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  contentContainer: {
    flex: 1,
  },
  contentContainerTablet: {
    paddingHorizontal: 20,
  },
  // Table Styles
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  tableHeaderTextArea: {
    minWidth: 60,
  },
  tableHeaderTextItem: {
    minWidth: 100,
    flex: 1,
  },
  tableHeaderTextLot: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 100,
    textAlign: 'center',
  },
  tableHeaderTextUofm: {
    minWidth: 50,
  },
  tableHeaderTextWt: {
    minWidth: 60,
  },
  tableHeaderTextBags: {
    minWidth: 80,
  },
  tableHeaderTextKgs: {
    minWidth: 80,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    minHeight: 48,
  },
  tableCell: {
    fontSize: 13,
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  tableCellItem: {
    fontSize: 13,
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  tableCellLot: {
    fontSize: 13,
    flex: 1.5,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  tableCellNumber: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  // Card Styles for Mobile
  cardListContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  cardBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  cardBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardContent: {
    gap: 10,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  cardValue: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  // Pagination Styles
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  paginationInfo: {
    fontSize: 15,
    fontWeight: '500',
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paginationControlsTablet: {
    marginLeft: 'auto',
  },
  paginationInfoTablet: {
    marginRight: 'auto',
  },
  paginationNavButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pageIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  pageIndicatorText: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
