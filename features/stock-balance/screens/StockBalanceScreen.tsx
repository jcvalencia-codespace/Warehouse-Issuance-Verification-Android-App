import { Colors } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
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
  
  // Filter type: 'all' | 'item' | 'area'
  const [filterType, setFilterType] = useState<'all' | 'item' | 'area'>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // Fetch stock balance on mount
  useEffect(() => {
    fetchStockBalance();
  }, []);

  // Filter data when search query or filter type changes
  useEffect(() => {
    let filtered = stockData;
    
    // Apply search query filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (item) =>
          (item.AREA || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.ITEMNMBR || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.LOTNUMBER || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.REMARKS || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply sorting based on filter type
    if (filterType === 'item') {
      // Sort by Item #
      filtered = [...filtered].sort((a, b) => 
        (a.ITEMNMBR || '').localeCompare(b.ITEMNMBR || '')
      );
    } else if (filterType === 'area') {
      // Sort by Area
      filtered = [...filtered].sort((a, b) => 
        (a.AREA || '').localeCompare(b.AREA || '')
      );
    } else {
      // Default: Sort by Area then Item #
      filtered = [...filtered].sort((a, b) => {
        const areaCompare = (a.AREA || '').localeCompare(b.AREA || '');
        if (areaCompare !== 0) return areaCompare;
        return (a.ITEMNMBR || '').localeCompare(b.ITEMNMBR || '');
      });
    }
    
    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page on filter change
    setTotalItems(filtered.length);
  }, [searchQuery, stockData, filterType]);

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
      scrollToTop();
    }
  };

  // Render table
  const renderTable = () => (
    <View style={[styles.tableContainer, { borderColor: colors.cardBorder }]}>
      {/* Table Header */}
      <View style={[styles.tableRow, styles.tableHeaderRow, { backgroundColor: colors.primary + '10', borderBottomColor: colors.cardBorder }]}>
        <View style={styles.colArea}><Text style={[styles.tableHeaderText, { color: colors.primary }]}>Area</Text></View>
        <View style={styles.colItem}><Text style={[styles.tableHeaderText, { color: colors.primary }]}>Item #</Text></View>
        <View style={styles.colLot}><Text style={[styles.tableHeaderText, { color: colors.primary }]}>Lot #</Text></View>
        {/* <View style={styles.colUofm}><Text style={[styles.tableHeaderText, { color: colors.primary }]}>UOFM</Text></View> */}
        <View style={styles.colWt}><Text style={[styles.tableHeaderTextRight, { color: colors.primary }]}>Ave Wt</Text></View>
        <View style={styles.colBags}><Text style={[styles.tableHeaderTextRight, { color: colors.primary }]}>Avail Bags</Text></View>
        <View style={styles.colKgs}><Text style={[styles.tableHeaderTextRight, { color: colors.primary }]}>Avail KGS</Text></View>
      </View>
      
      {/* Table Body */}
      <FlatList
        ref={flatListRef}
        data={paginatedItems}
        renderItem={({ item, index }) => (
          <View style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? colors.background : colors.cardBackground, borderBottomColor: colors.cardBorder }]}>
            <View style={styles.colArea}><Text style={[styles.tableCellText, { color: colors.text }]}>{String(item.AREA || '-').trim()}</Text></View>
            <View style={styles.colItem}><Text style={[styles.tableCellText, { color: colors.text }]}>{String(item.ITEMNMBR || '-').trim()}</Text></View>
            <View style={styles.colLot}><Text style={[styles.tableCellText, { color: colors.text }]}>{String(item.LOTNUMBER || '-').trim()}</Text></View>
            {/* <View style={styles.colUofm}><Text style={[styles.tableCellText, { color: colors.text }]}>{String(item.UOFM || '-').trim()}</View> */}
            <View style={styles.colWt}><Text style={[styles.tableCellNumber, { color: colors.text }]}>{Number(item.AVEWT).toFixed(3)}</Text></View>
            <View style={styles.colBags}><Text style={[styles.tableCellNumber, { color: item['AVAILABLE BAGS'] > 0 ? colors.success : colors.error }]}>{item['AVAILABLE BAGS']}</Text></View>
            <View style={styles.colKgs}><Text style={[styles.tableCellNumber, { color: item['AVAILABLE KGS'] > 0 ? colors.success : colors.error }]}>{Number(item['AVAILABLE KGS']).toFixed(2)}</Text></View>
          </View>
        )}
        keyExtractor={(item, index) => `${item.ITEMNMBR}-${item.LOTNUMBER}-${index}`}
        contentContainerStyle={styles.tableListContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={true}
        snapToInterval={48}
        decelerationRate="fast"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="package-variant" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? 'No matching records found' : 'No stock balance data available'}
            </Text>
          </View>
        }
      />
    </View>
  );

  // Render pagination
  const renderPagination = () => (
    <View style={[
      styles.paginationContainer, 
      { 
        backgroundColor: colors.cardBackground, 
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
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading Current Balance...</Text>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Current Balance</Text>
      </View>

      {/* Filter Type Radio Buttons */}
      <View style={[styles.filterContainer, { backgroundColor: colors.cardBackground, borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity 
          style={[styles.filterOption, filterType === 'all' && { backgroundColor: colors.primary + '20' }]}
          onPress={() => setFilterType('all')}
        >
          <View style={[styles.radioOuter, { borderColor: colors.primary }]}>
            {filterType === 'all' && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
          </View>
          <Text style={[styles.filterLabel, { color: colors.text }]}>View All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterOption, filterType === 'item' && { backgroundColor: colors.primary + '20' }]}
          onPress={() => setFilterType('item')}
        >
          <View style={[styles.radioOuter, { borderColor: colors.primary }]}>
            {filterType === 'item' && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
          </View>
          <Text style={[styles.filterLabel, { color: colors.text }]}>View Per Item</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterOption, filterType === 'area' && { backgroundColor: colors.primary + '20' }]}
          onPress={() => setFilterType('area')}
        >
          <View style={[styles.radioOuter, { borderColor: colors.primary }]}>
            {filterType === 'area' && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
          </View>
          <Text style={[styles.filterLabel, { color: colors.text }]}>View Per Area</Text>
        </TouchableOpacity>
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

      {/* Content - Always Table View */}
      <View style={styles.contentContainer}>
        {renderTable()}
      </View>

      {/* Pagination */}
      {totalItems > ITEMS_PER_PAGE && (
        <View style={[styles.paginationWrapper, { paddingBottom: insets.bottom, backgroundColor: colors.cardBackground }]}>
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
  // Filter Styles
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
    justifyContent: 'space-around',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
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
    minHeight: 0,
  },
  contentContainerTablet: {
    paddingHorizontal: 20,
  },
  scrollContent: {
    minWidth: '100%',
  },
  tableWrapper: {
    minWidth: '100%',
  },
  // Table Styles
  tableContainer: {
    width: '100%',
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableListContent: {
    flexGrow: 1,
    minHeight: 200,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    minHeight: 48,
  },
  tableHeaderRow: {
    minHeight: 52,
  },
  // Column flex values - same for header and body
  // Using flex to ensure columns take consistent space
  colArea: {
    flex: 0.8,
    minWidth: 60,
    paddingHorizontal: 4,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  colItem: {
    flex: 1.5,
    minWidth: 100,
    paddingHorizontal: 4,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  colLot: {
    flex: 1.3,
    minWidth: 90,
    paddingHorizontal: 4,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  colUofm: {
    flex: 0.7,
    minWidth: 45,
    paddingHorizontal: 4,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  colWt: {
    flex: 1,
    minWidth: 60,
    paddingHorizontal: 4,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  colBags: {
    flex: 1.2,
    minWidth: 80,
    paddingHorizontal: 4,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  colKgs: {
    flex: 1.2,
    minWidth: 80,
    paddingHorizontal: 4,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'left',
  },
  tableHeaderTextRight: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  tableCellText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'left',
  },
  tableCellNumber: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  // Pagination Styles
  paginationWrapper: {
    paddingBottom: 8,
    backgroundColor: '#ffffff',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    backgroundColor: '#ffffff',
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
