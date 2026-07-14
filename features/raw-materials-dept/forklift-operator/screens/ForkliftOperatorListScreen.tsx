import { Colors } from '@/constants/theme';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { forkliftOperatorService } from '../services/forkliftOperatorService';
import {
  ForkliftOperator,
  ForkliftOperatorParams,
} from '../types/forkliftOperator.types';

interface ForkliftOperatorListScreenProps {
  refreshKey?: number;
  showInactiveToggle?: boolean;
}

export function ForkliftOperatorListScreen({
  refreshKey,
  showInactiveToggle = false,
}: ForkliftOperatorListScreenProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const { width, height } = useWindowDimensions();
  const isTablet = width > 800;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [operators, setOperators] = useState<ForkliftOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(showInactiveToggle);
  const [error, setError] = useState<string | null>(null);

  const fetchOperators = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const params: ForkliftOperatorParams = {};
        if (searchQuery) {
          params.search = searchQuery;
        }
        if (showInactiveToggle) {
          params.isActive = showInactive;
        }

        const result = await forkliftOperatorService.getForkliftOperators(params);

        if (result.success) {
          setOperators(result.data);
        } else {
          setError(result.message || 'Failed to fetch operators');
        }
      } catch (err) {
        console.error('Error fetching forklift operators:', err);
        setError('Connection error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchQuery, showInactive, showInactiveToggle]
  );

  useEffect(() => {
    fetchOperators();
  }, [refreshKey]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchOperators();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, showInactive]);

  const handleRefresh = () => {
    fetchOperators(true);
  };

  const handleToggleStatus = async (operator: ForkliftOperator) => {
    Alert.alert(
      'Confirm',
      `Set "${operator.FORKLIFT_OPERATOR}" as ${
        operator.IS_ACTIVE ? 'inactive' : 'active'
      }?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await forkliftOperatorService.toggleForkliftOperatorStatus(
                operator.ROWID,
                !operator.IS_ACTIVE
              );
              fetchOperators();
            } catch (err) {
              console.error('Error toggling status:', err);
              Alert.alert('Error', 'Failed to update status');
            }
          },
        },
      ]
    );
  };

  const handleDelete = (operator: ForkliftOperator) => {
    Alert.alert(
      'Delete Operator',
      `Are you sure you want to delete "${operator.FORKLIFT_OPERATOR}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await forkliftOperatorService.deleteForkliftOperator(operator.ROWID);
              fetchOperators();
            } catch (err) {
              console.error('Error deleting operator:', err);
              Alert.alert('Error', 'Failed to delete operator');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ForkliftOperator }) => (
    <View
      style={[
        styles.operatorCard,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={styles.operatorInfo}>
        <View style={styles.operatorHeader}>
          <Text style={[styles.operatorName, { color: colors.text }]}>
            {item.FORKLIFT_OPERATOR}
          </Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: item.IS_ACTIVE
                  ? colors.success + '20'
                  : colors.textSecondary + '20',
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: item.IS_ACTIVE
                    ? colors.success
                    : colors.textSecondary,
                },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color: item.IS_ACTIVE
                    ? colors.success
                    : colors.textSecondary,
                },
              ]}
            >
              {item.IS_ACTIVE ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        <View style={styles.operatorMeta}>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            ID: {item.ROWID}
          </Text>
          {item.DATECREATED && (
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              Created: {new Date(item.DATECREATED).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.operatorActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.warning + '15' }]}
          onPress={() => router.push(`/forklift-operator-form?rowId=${item.ROWID}` as any)}
        >
          <MaterialCommunityIcons
            name="pencil"
            size={20}
            color={colors.warning}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary + '15' }]}
          onPress={() => handleToggleStatus(item)}
        >
          <MaterialCommunityIcons
            name={item.IS_ACTIVE ? 'account-off' : 'account-check'}
            size={20}
            color={colors.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.error + '15' }]}
          onPress={() => handleDelete(item)}
        >
          <MaterialCommunityIcons
            name="delete-outline"
            size={20}
            color={colors.error}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="account-hard-hat"
        size={64}
        color={colors.textSecondary}
      />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {searchQuery ? 'No operators found' : 'No forklift operators'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {searchQuery
          ? 'Try a different search term'
          : 'Add your first forklift operator'}
      </Text>
    </View>
  );

  if (loading && operators.length === 0) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading operators...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: colors.text }]}>
            Forklift Operators
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {operators.length} operator{operators.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={colors.textSecondary}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search operators..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {showInactiveToggle && (
          <TouchableOpacity
            style={[
              styles.filterToggle,
              {
                backgroundColor: showInactive
                  ? colors.primary + '20'
                  : colors.cardBackground,
                borderColor: colors.cardBorder,
              },
            ]}
            onPress={() => setShowInactive(!showInactive)}
          >
            <MaterialCommunityIcons
              name={showInactive ? 'eye' : 'eye-off'}
              size={18}
              color={showInactive ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.filterText,
                {
                  color: showInactive
                    ? colors.primary
                    : colors.textSecondary,
                },
              ]}
            >
              {showInactive ? 'Show Active' : 'Show Inactive'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View
          style={[
            styles.errorBanner,
            { backgroundColor: colors.error + '15', borderColor: colors.error },
          ]}
        >
          <MaterialCommunityIcons
            name="alert-circle"
            size={20}
            color={colors.error}
          />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity onPress={() => fetchOperators()}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={operators}
        renderItem={renderItem}
        keyExtractor={(item) => item.ROWID.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmpty}
      />

      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: 24 + insets.bottom,
          },
        ]}
        onPress={() => router.push('/forklift-operator-form' as any)}
      >
        <MaterialCommunityIcons name="plus" size={28} color={colors.cardBackground} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTop: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    gap: 6,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    marginBottom: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  operatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  operatorInfo: {
    flex: 1,
  },
  operatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  operatorName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  operatorMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaText: {
    fontSize: 12,
  },
  operatorActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default ForkliftOperatorListScreen;