import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { notificationService } from '@/features/shared/services/notificationService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { socketService } from "../shared/services/socketService";

interface NotificationItem {
  ROWID: number;
  RECEIVER: string;
  CATEGORY: string;
  FORM: string;
  REFERENCENO: string;
  SENDER: string;
  DATESENT: string;
}

export function NotificationsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const router = useRouter();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await notificationService.getNotifications(user.NAME || user.USERNAME || '');
      setNotifications(data);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, fadeAnim]);

  useEffect(() => {
    fetchNotifications();

    socketService.connect();
    const handler = () => {
      fetchNotifications();
    };
    socketService.onNotification(handler);

    return () => {
      socketService.offNotification(handler);
    };
  }, [user, fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fadeAnim.setValue(0);
    fetchNotifications();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getCategoryColor = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('approved')) return '#10b981';
    if (lower.includes('rejected')) return '#ef4444';
    if (lower.includes('pending')) return '#f59e0b';
    if (lower.includes('request')) return '#3b82f6';
    return colors.primary;
  };

  const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('approved')) return 'check-circle-outline';
    if (lower.includes('rejected')) return 'close-circle-outline';
    if (lower.includes('pending')) return 'clock-outline';
    if (lower.includes('request')) return 'bell-ring-outline';
    return 'bell-outline';
  };

  const renderNotification = ({ item, index }: { item: NotificationItem; index: number }) => {
    const categoryColor = getCategoryColor(item.CATEGORY);
    const categoryIcon = getCategoryIcon(item.CATEGORY);

    const onPress = () => {
      if (item.FORM === 'ERP MOBILE' && item.CATEGORY === 'New Material Issuance Request') {
        router.push('/raw-materials-dept/material-issuance-confirmation');
      } else if (item.FORM === 'ERP MOBILE' && item.CATEGORY === 'Material issuance request SERVED and now ready for confirmation') {
        router.push({
          pathname: '/raw-materials-dept/material-issuance-confirmation',
          params: { source: 'production', filter: 'served' },
        });
      }
    };
    return (
      <Animated.View
        style={[
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.7}
          style={[
            styles.notificationCard,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: categoryColor + '18' }]}>
            <MaterialCommunityIcons name={categoryIcon as any} size={24} color={categoryColor} />
          </View>
          <View style={styles.notificationContent}>
            <View style={styles.categoryRow}>
              <Text style={[styles.category, { color: colors.text }]} numberOfLines={1}>
                {item.CATEGORY}
              </Text>
              <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '18' }]}>
                <Text style={[styles.categoryBadgeText, { color: categoryColor }]}>
                  {item.FORM}
                </Text>
              </View>
            </View>
            <Text style={[styles.reference, { color: colors.text }]}>
              Ref: {item.REFERENCENO}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.senderRow}>
                <MaterialCommunityIcons name="account-outline" size={12} color={colors.text} />
                <Text style={[styles.metaText, { color: colors.text }]}>
                  {item.SENDER}
                </Text>
              </View>
              <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                {formatDate(item.DATESENT)}
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.centerContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '12' }]}>
        <MaterialCommunityIcons name="bell-off-outline" size={56} color={colors.textTertiary} />
      </View>
      <Text style={[styles.emptyText, { color: colors.text }]}>No notifications yet</Text>
      <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
        You'll see updates here when new notifications arrive
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.centerContainer}>
      <View style={[styles.loadingPulse, { backgroundColor: colors.primary + '20' }]} />
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading notifications...</Text>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary || colors.tint }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {notifications.length > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{notifications.length}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialCommunityIcons name="refresh" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        renderLoadingState()
      ) : notifications.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.ROWID.toString()}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  loadingPulse: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  category: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  categoryBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reference: {
    fontSize: 16,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    fontSize: 15,
  },
  metaText: {
    fontSize: 15,
  },
});

export default NotificationsScreen;
