import { Colors } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModuleCardData, ModuleGrid } from '../home/components/ModuleCard';
import { SummaryStatItem, SummaryStats } from '../home/components/SummaryStats';
import { WarehouseHeader } from '../home/components/WarehouseHeader';
import { warehouseMetricsService } from '../home/services/warehouseMetricsService';

const WAREHOUSE_MODULES: ModuleCardData[] = [
  {
    id: 'issuance-verification',
    title: 'New Issuance Verification',
    description: 'Create new issuance verification',
    icon: 'file-check-outline',
    color: 'primary',
  },
  {
    id: 'pending',
    title: 'Pending Warehouse Issuance Confirmation',
    description: 'Review pending operations',
    icon: 'timer-sand',
    color: 'warning',
    badge: 12,
  },
  {
    id: 'receiving',
    title: 'Posted Warehouse Issuance Confirmation',
    description: 'Confirm incoming shipments',
    icon: 'package-variant-closed-check',
    color: 'success',
  },
  {
    id: 'stock-balance',
    title: 'Stock Balance',
    description: 'View current inventory balance',
    icon: 'package-variant',
    color: 'primary',
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    description: 'View warehouse reports',
    icon: 'chart-line',
    color: 'error',
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Configure preferences',
    icon: 'cog-outline',
    color: 'textSecondary',
  },
  // {
  //   id: 'help',
  //   title: 'Help & Support',
  //   description: 'Get help and contact support',
  //   icon: 'help-circle-outline',
  //   color: 'secondary',
  // },
];

interface WarehouseHomeScreenProps {
  userName?: string;
  userDepartment?: string;
  onModulePress?: (moduleId: string) => void;
}

export function WarehouseHomeScreen({
  userName = '',
  userDepartment = '',
  onModulePress,
}: WarehouseHomeScreenProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const { width, height } = useWindowDimensions();
  const isTablet = width > 800;
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Statistics data with real values from API
  // Initialize with default values that will be updated after mount
  const getInitialStats = (colors: typeof Colors.light): SummaryStatItem[] => [
    {
      icon: 'clock-check',
      label: 'Pending Confirmations',
      value: 0,
      trend: 'neutral',
      color: colors.warning,
    },
    {
      icon: 'check-circle',
      label: 'Completed Today',
      value: 0,
      trend: 'neutral',
      color: colors.success,
    },
    {
      icon: 'archive',
      label: 'Total Transactions',
      value: '0',
      trend: 'neutral',
      color: colors.primary,
    },
  ];

  const [stats, setStats] = useState<SummaryStatItem[]>(() => getInitialStats(colors));

  // Fetch metrics on component mount
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const metrics = await warehouseMetricsService.getMetrics();
        
        if (metrics) {
          setStats([
            {
              icon: 'clock-check',
              label: 'Pending Confirmations',
              value: metrics.pendingCount,
              trend: metrics.pendingCount > 10 ? 'up' : 'neutral',
              color: colors.warning,
            },
            {
              icon: 'check-circle',
              label: 'Completed Today',
              value: metrics.completedToday,
              trend: metrics.completedToday > 20 ? 'up' : 'neutral',
              color: colors.success,
            },
            {
              icon: 'archive',
              label: 'Total Transactions',
              value: metrics.totalTransactions.toLocaleString(),
              trend: 'neutral',
              color: colors.primary,
            },
          ]);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);

    return () => clearInterval(interval);
  }, [colors]);

  // Get module color based on theme
  const getModuleColor = (colorKey: string): string => {
    const colorMap: Record<string, keyof typeof colors> = {
      primary: 'primary',
      warning: 'warning',
      success: 'success',
      error: 'error',
      textSecondary: 'textSecondary',
    };
    const themeKey = colorMap[colorKey];
    return themeKey ? (colors[themeKey] as string) : colors.primary;
  };

  // Handle module press - navigate to respective screens
  const handleModulePressInternal = (moduleId: string) => {
    if (moduleId === 'issuance-verification') {
      router.push('/issuance-verification' as any);
    } else if (moduleId === 'stock-balance') {
      router.push('/stock-balance' as any);
    } else if (onModulePress) {
      onModulePress(moduleId);
    }
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={[
          styles.scrollView,
          {
            backgroundColor: colors.background + '99',
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header Section */}
        <WarehouseHeader userName={userName} userDepartment={userDepartment} />

        {/* Main Content Container */}
        <View
          style={[
            styles.contentContainer,
            isTablet && styles.contentContainerTablet,
          ]}
        >
          {/* Statistics Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text },
                ]}
              >
                Dashboard Overview
              </Text>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Real-time operations metrics
              </Text>
            </View>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading metrics...
                </Text>
              </View>
            ) : (
              <SummaryStats stats={stats} isTablet={isTablet} />
            )}
          </View>

          {/* Divider */}
          <View
            style={[
              styles.divider,
              { backgroundColor: colors.cardBorder },
            ]}
          />

          {/* Quick Actions Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text },
                ]}
              >
                Quick Actions
              </Text>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Access warehouse operations
              </Text>
            </View>
            <ModuleGrid
              modules={WAREHOUSE_MODULES.map(module => ({
                ...module,
                color: getModuleColor(module.color || 'primary'),
              }))}
              isTablet={isTablet}
              onModulePress={handleModulePressInternal}
            />
          </View>

          {/* Footer Info Card */}
          <View
            style={[
              styles.footerInfoCard,
              {
                backgroundColor: colors.primary + '10',
                borderColor: colors.primary + '30',
              },
            ]}
          >
            <View style={[styles.footerIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <MaterialCommunityIcons
                name="information"
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.footerTextContainer}>
              <Text
                style={[
                  styles.footerText,
                  { color: colors.text },
                ]}
              >
                Synchronizing data from servers...
              </Text>
              <Text
                style={[
                  styles.footerSubtext,
                  { color: colors.textSecondary },
                ]}
              >
                Last updated: just now
              </Text>
            </View>
          </View>

          {/* Bottom Padding */}
          <View style={{ height: 100 + insets.bottom }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  contentContainerTablet: {
    paddingHorizontal: 32,
  },
  section: {
    marginTop: 24,
    marginBottom: 24
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  footerInfoCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  footerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  footerTextContainer: {
    flex: 1,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  loadingContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default WarehouseHomeScreen;
