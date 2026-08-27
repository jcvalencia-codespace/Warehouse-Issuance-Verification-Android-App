import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';

import { ModuleCardData, ModuleGrid } from '@/features/raw-materials-dept/home/components/ModuleCard';
import { WarehouseHeader } from '@/features/raw-materials-dept/home/components/WarehouseHeader';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const WAREHOUSE_MODULES: ModuleCardData[] = [
  {
    id: 'material-issuance-confirmation',
    title: 'Material Issuance Confirmation',
    description: 'Confirm and validate pending material issuances',
    icon: 'file-lock-outline',
    color: '#DD6B20',
  },
  {
    id: 'issuance-verification',
    title: 'New Issuance Verification',
    description: 'Create new issuance verification',
    icon: 'file-check-outline',
    color: 'primary',
  },
  {
    id: 'receiving',
    title: 'Posted Issuance Verification',
    description: 'View posted issuance verification transaction(s)',
    icon: 'package-variant-closed-check',
    color: 'success',
  },
  {
    id: 'stock-balance',
    title: 'Current Balance',
    description: 'View warehouse current stocks',
    icon: 'package-variant',
    color: 'warning',
  },
  {
    id: 'forklift-operator',
    title: 'Forklift Operator',
    description: 'Manage forklift operators',
    icon: 'account-hard-hat',
    color: 'error',
  },
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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAdmin } = useAuth();

  const filteredModules = useMemo(() => {
    if (isAdmin) {
      return WAREHOUSE_MODULES;
    }
    return WAREHOUSE_MODULES.filter(module => module.id !== 'forklift-operator');
  }, [isAdmin]);

   // Get module color based on theme
   const getModuleColor = (colorKey: string): string => {
     const colorMap: Record<string, keyof typeof colors> = {
       primary: 'primary',
       warning: 'warning',
       success: 'success',
       error: 'error',
       textSecondary: 'textSecondary',
     };
     if (colorKey.startsWith('#')) {
       return colorKey;
     }
     const themeKey = colorMap[colorKey];
     return themeKey ? (colors[themeKey] as string) : colors.primary;
   };

  // Handle module press - navigate to respective screens
  const handleModulePressInternal = (moduleId: string) => {
    if (moduleId === 'issuance-verification') {
      router.push('/raw-materials-dept/issuance-verification' as any);
    } else if (moduleId === 'stock-balance') {
      router.push('/raw-materials-dept/stock-balance' as any);
    } else if (moduleId === 'receiving') {
      router.push('/raw-materials-dept/posted-warehouse-confirmation' as any);
    } else if (moduleId === 'forklift-operator') {
      router.push('/raw-materials-dept/forklift-operator' as any);
    } else if (moduleId === 'material-issuance-confirmation'){
      router.push('/raw-materials-dept/material-issuance-confirmation' as any);
    } else if (onModulePress) {
      onModulePress(moduleId);
    }
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      {/* Header Section */}
      <WarehouseHeader userName={userName} userDepartment={userDepartment} />

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
        {/* Main Content Container */}
        <View
          style={[
            styles.contentContainer,
            isTablet && styles.contentContainerTablet,
          ]}
        >

          {/* Quick Actions Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text },
                ]}
              >
                Raw Material Modules
              </Text>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Manage your RM operations
              </Text>
            </View>
            <ModuleGrid
              modules={filteredModules.map(module => ({
                ...module,
                color: getModuleColor(module.color || 'primary'),
              }))}
              isTablet={isTablet}
              onModulePress={handleModulePressInternal}
            />
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
});

export default WarehouseHomeScreen;
