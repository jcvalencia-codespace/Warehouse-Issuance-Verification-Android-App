import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { PostedIssuanceDetailList } from './components/PostedIssuanceDetailList';
import { postedIssuanceService } from './services/postedIssuanceService';
import { IssuanceDetail, PostedIssuance } from './types/posted-issuance.types';

interface PostedIssuanceScreenProps {
  onBack?: () => void;
}

export default function PostedIssuanceScreen({ onBack }: PostedIssuanceScreenProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const router = useRouter();
  const { user } = useAuth();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();

  const IS_TABLET = SCREEN_WIDTH > 768;
  const IS_PORTRAIT = SCREEN_HEIGHT > SCREEN_WIDTH;
  const IS_LANDSCAPE = !IS_PORTRAIT;
  const IS_SMALL_SCREEN = SCREEN_WIDTH < 380;

  const [postedIssuances, setPostedIssuances] = useState<PostedIssuance[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedIssuance, setSelectedIssuance] = useState<PostedIssuance | null>(null);
  const [issuanceDetails, setIssuanceDetails] = useState<IssuanceDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredIssuances, setFilteredIssuances] = useState<PostedIssuance[]>([]);

  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());

  const responsiveStyles = {
    headerTitle: { fontSize: IS_TABLET ? (IS_LANDSCAPE ? 24 : 26) : (IS_LANDSCAPE ? 20 : 22) },
    headerSubtitle: { fontSize: IS_SMALL_SCREEN ? 12 : 14 },
    totalIssuanceValue: { fontSize: IS_TABLET ? 28 : 22 },
    totalIssuanceLabel: { fontSize: IS_SMALL_SCREEN ? 11 : 13 },
    searchInput: { fontSize: IS_SMALL_SCREEN ? 14 : 15 },
    searchHint: { fontSize: IS_SMALL_SCREEN ? 12 : 13 },
    dateInputText: { fontSize: IS_SMALL_SCREEN ? 12 : 14 },
    viewButtonText: { fontSize: IS_SMALL_SCREEN ? 12 : 14 },
    tableHeaderText: { fontSize: IS_SMALL_SCREEN ? 10 : 12 },
    tableCellText: { fontSize: IS_SMALL_SCREEN ? 11 : 13 },
    statusText: { fontSize: IS_SMALL_SCREEN ? 12 : 13 },
    errorText: { fontSize: IS_SMALL_SCREEN ? 13 : 14 },
    emptySubtitle: { fontSize: IS_SMALL_SCREEN ? 13 : 14 },
    refreshButtonText: { fontSize: IS_SMALL_SCREEN ? 12 : 14 },
    detailsTitle: { fontSize: IS_TABLET ? 20 : 18 },
    listPadding: { padding: IS_TABLET ? 24 : 16 },
    tableRowPadding: { paddingVertical: IS_TABLET ? 14 : 10, paddingHorizontal: IS_TABLET ? 12 : 6 },
    tableCellWidth: { minWidth: IS_SMALL_SCREEN ? 60 : 80 },
    headerPadding: { paddingHorizontal: IS_TABLET ? 24 : 16, paddingVertical: IS_TABLET ? 20 : 14 },
    dateRangePadding: { paddingHorizontal: IS_TABLET ? 24 : 16 },
    searchPadding: { paddingHorizontal: IS_TABLET ? 24 : 16 },
  };

  useEffect(() => {
    fetchPostedIssuances();
  }, []);

  useEffect(() => {
    let filtered = postedIssuances;

    filtered = filtered.filter((issuance) => {
      if (!issuance.DATEISSUED) return false;
      const transDate = new Date(issuance.DATEISSUED);
      if (isNaN(transDate.getTime())) return false;
      return transDate.getFullYear() === selectedYear;
    });

    if (searchQuery) {
      filtered = filtered.filter(
        (issuance) =>
          String(issuance.REFERENCENO).toLowerCase().includes(searchQuery.toLowerCase()) ||
          (issuance.TRANSACTIONTYPE || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (issuance.ISSUANCETYPE || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (issuance.ISSUEDBY || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (issuance.APPROVEDBY || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (issuance.CONTACTPERSON || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (() => {
            try {
              const date = new Date(issuance.DATEISSUED);
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
          })()
      );
    }

    if (searchQuery || selectedYear !== new Date().getFullYear()) {
      setFilteredIssuances(filtered);
    }
  }, [searchQuery, postedIssuances, selectedYear]);

  useEffect(() => {
    if (selectedIssuance) {
      fetchIssuanceDetails(selectedIssuance.REFERENCENO);
    }
  }, [selectedIssuance]);

  const fetchPostedIssuances = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await postedIssuanceService.getPostedIssuances(0, 100, selectedYear, user?.COMPANY);

      if (result !== null) {
        setPostedIssuances(result.data);
        setTotalCount(result.totalCount);
      } else {
        setError('Failed to load posted issuances');
      }
    } catch (err) {
      console.error('Error fetching posted issuances:', err);
      setError('Failed to load posted issuances');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchIssuanceDetails = async (referenceNo: number | string) => {
    try {
      setLoadingDetails(true);
      const result = await postedIssuanceService.getPostedIssuanceDetails(String(referenceNo), user?.COMPANY);

      if (result !== null) {
        setIssuanceDetails(result);
      } else {
        setIssuanceDetails([]);
      }
    } catch (err) {
      console.error('Error fetching issuance details:', err);
      setIssuanceDetails([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleIssuanceSelect = (issuance: PostedIssuance) => {
    setSelectedIssuance(issuance);
  };

  const handleBackToList = () => {
    setSelectedIssuance(null);
    setIssuanceDetails([]);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPostedIssuances();
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

  const goToPreviousYear = () => {
    setSelectedYear(prev => prev - 1);
  };

  const goToNextYear = () => {
    setSelectedYear(prev => prev + 1);
  };

  const resetYearFilter = () => {
    setSelectedYear(new Date().getFullYear());
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const renderTableHeader = () => (
    <View style={[styles.tableHeader, { backgroundColor: colors.primary + '12', borderBottomColor: colors.primary }]}>
      <View style={[styles.tableHeaderCell, styles.tableStatusCell]}>
        <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={14} color={colors.primary} />
      </View>
      <View style={[styles.tableHeaderCell, styles.tableRefNoCell]}>
        <Text style={[styles.tableHeaderText, { color: colors.primary }]}>REF NO.</Text>
      </View>
      <View style={[styles.tableHeaderCell, styles.tableTypeCell]}>
        <MaterialCommunityIcons name="tag-outline" size={14} color={colors.primary} />
        <Text style={[styles.tableHeaderText, { color: colors.primary }]}>TRANS TYPE</Text>
      </View>
      <View style={[styles.tableHeaderCell, styles.tableIssuanceTypeCell]}>
        <MaterialCommunityIcons name="package-variant" size={14} color={colors.primary} />
        <Text style={[styles.tableHeaderText, { color: colors.primary }]}>ISS TYPE</Text>
      </View>
      <View style={[styles.tableHeaderCell, styles.tableDateCell]}>
        <MaterialCommunityIcons name="calendar" size={14} color={colors.primary} />
        <Text style={[styles.tableHeaderText, { color: colors.primary }]}>DATE</Text>
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

  const renderIssuanceItem = ({ item, index }: { item: PostedIssuance; index: number }) => {
    const isSelected = selectedIssuance?.REFERENCENO === item.REFERENCENO;
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
        onPress={() => handleIssuanceSelect(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.tableCell, styles.tableStatusCell]}>
          <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
        </View>

        <View style={[styles.tableCell, styles.tableRefNoCell]}>
          <Text style={[styles.tableCellText, { color: colors.text }]} numberOfLines={1}>
            {item.REFERENCENO}
          </Text>
        </View>

        <View style={[styles.tableCell, styles.tableTypeCell]}>
          <Text style={[styles.tableCellText, { color: colors.text }]} numberOfLines={1}>
            {item.TRANSACTIONTYPE || '-'}
          </Text>
        </View>

        <View style={[styles.tableCell, styles.tableIssuanceTypeCell]}>
          <Text style={[styles.tableCellText, { color: colors.text }]} numberOfLines={1}>
            {item.ISSUANCETYPE || '-'}
          </Text>
        </View>

        <View style={[styles.tableCell, styles.tableDateCell]}>
          <Text style={[styles.tableCellText, { color: colors.text }]} numberOfLines={1}>
            {formatDate(item.DATEISSUED)}
          </Text>
        </View>

        <View style={[styles.tableCell, styles.tableIssuedByCell]}>
          <Text style={[styles.tableCellText, { color: colors.text }]} numberOfLines={1}>
            {item.ISSUEDBY || '-'}
          </Text>
        </View>

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

  if (selectedIssuance) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <PostedIssuanceDetailList
          details={issuanceDetails}
          loading={loadingDetails}
          referenceNo={selectedIssuance.REFERENCENO}
          transactionType={selectedIssuance.TRANSACTIONTYPE}
          issuanceType={selectedIssuance.ISSUANCETYPE}
          dateIssued={selectedIssuance.DATEISSUED}
          shift={selectedIssuance.SHIFT}
          contactPerson={selectedIssuance.CONTACTPERSON}
          transferLocnCode={selectedIssuance.TRANSFER_LOCNCODE}
          projectName={selectedIssuance.PROJECTNAME}
          areaTransfer={selectedIssuance.AREATRANSFER}
          issuedBy={selectedIssuance.ISSUEDBY}
          approvedBy={selectedIssuance.APPROVEDBY}
          timeRequest={selectedIssuance.TIMEREQUEST}
          timeIssued={selectedIssuance.TIMEISSUED}
          onBack={handleBackToList}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.cardBorder }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary + '10' }]}
            onPress={onBack || (() => router.back())}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={IS_TABLET ? 26 : 22} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={IS_TABLET ? 32 : 28} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                POSTED ISSUANCES
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              View and inspect posted supplies issuance transactions
            </Text>
          </View>
          <View style={[styles.totalIssuanceContainer, { backgroundColor: colors.success + '12' }]}>
            <MaterialCommunityIcons name="file-check-outline" size={24} color={colors.success} />
            <View style={styles.totalIssuanceContent}>
            <Text style={[styles.totalIssuanceLabel, { color: colors.textSecondary }]}>
              {filteredIssuances.length < totalCount ? 'FILTERED' : 'TOTAL'} ISSUANCES
            </Text>
            <Text style={[styles.totalIssuanceValue, { color: colors.success }]}>
              {filteredIssuances.length < totalCount ? filteredIssuances.length : totalCount}
            </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.yearFilterContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.yearFilterWrapper, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <TouchableOpacity
            style={[styles.yearArrowButton, { backgroundColor: colors.primary + '15' }]}
            onPress={goToPreviousYear}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="chevron-left" size={22} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.yearDisplay}>
            <MaterialCommunityIcons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={[styles.yearText, { color: colors.text }]}>
              {selectedYear}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.yearArrowButton, { backgroundColor: colors.primary + '15' }]}
            onPress={goToNextYear}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.searchInputWrapper, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by Ref No., Date, Type, Issued By, Approved By"
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
          Tap a row below to view issuance details
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingCard, { backgroundColor: colors.cardBackground }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading posted issuances...
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
              onPress={fetchPostedIssuances}
            >
              <MaterialCommunityIcons name="refresh" size={20} color="#ffffff" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : postedIssuances.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.success + '15' }]}>
              <MaterialCommunityIcons name="check-circle-outline" size={64} color={colors.success} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              All Caught Up!
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              No posted issuance transactions found
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
          data={searchQuery || selectedYear !== new Date().getFullYear() ? filteredIssuances : postedIssuances}
          keyExtractor={(item) => String(item.REFERENCENO)}
          renderItem={renderIssuanceItem}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 28,
    textAlign: 'center',
  },
  totalIssuanceLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dateRangeContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    width: '100%',
    alignSelf: 'stretch',
  },
  dateRangeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
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
    fontSize: 14,
    fontWeight: '600',
  },
  dateRangeSeparator: {
    fontSize: 14,
    fontWeight: '500',
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
    fontSize: 14,
    fontWeight: '600',
  },
  resetButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearFilterContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  yearFilterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  yearArrowButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  yearText: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
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
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
    width: '100%',
    alignSelf: 'stretch',
  },
  listContainerTablet: {
    width: '100%',
    alignSelf: 'stretch',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  tableCell: {
    justifyContent: 'center',
  },
  tableCellText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tableStatusCell: {
    width: 32,
  },
  tableRefNoCell: {
    flex: 1,
    minWidth: 80,
  },
  tableTypeCell: {
    flex: 1,
    minWidth: 70,
  },
  tableIssuanceTypeCell: {
    flex: 1,
    minWidth: 70,
  },
  tableDateCell: {
    flex: 0.8,
    minWidth: 70,
  },
  tableIssuedByCell: {
    flex: 0.8,
    minWidth: 70,
  },
  tableActionCell: {
    width: 28,
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
});
