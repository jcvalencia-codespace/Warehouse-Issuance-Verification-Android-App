import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ModuleCardData, ModuleGrid } from '@/features/raw-materials-dept/home/components/ModuleCard';
import { WarehouseHeader } from '@/features/raw-materials-dept/home/components/WarehouseHeader';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const PRODUCTION_MODULES: ModuleCardData[] = [
  {
    id: 'utilization',
    title: 'New Material Utilization',
    description: 'Create new material utilization record',
    icon: 'file-check-outline',
    color: 'primary',
  },
  {
    id: 'production-utilization-posted',
    title: 'Posted Production Utilization',
    description: 'View posted production utilization transactions',
    icon: 'package-variant-closed-check',
    color: 'success',
  },
  // {
  //   id: 'supplies-stock-balance',
  //   title: 'Supplies Stock Balance',
  //   description: 'View current supplies stock levels',
  //   icon: 'package-variant',
  //   color: 'warning',
  // },
  // {
  //   id: 'supplies-reports',
  //   title: 'Supplies Reports',
  //   description: 'View supplies reports and analytics',
  //   icon: 'chart-line',
  //   color: 'error',
  // },
];

interface ProductionDeptHomeScreenProps {
  userName?: string;
  userDepartment?: string;
  onModulePress?: (moduleId: string) => void;
}

export function ProductionDeptHomeScreen({
  userName = '',
  userDepartment = '',
  onModulePress,
}: ProductionDeptHomeScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const isTablet = false;
  const { user } = useAuth();

  const [displayUserName, setDisplayUserName] = useState(userName);
  const [displayUserDepartment, setDisplayUserDepartment] = useState(userDepartment);

  useEffect(() => {
    if (user) {
      setDisplayUserName(user.NAME || user.USERNAME || 'Warehouse Operator');
      setDisplayUserDepartment(user.DEPARTMENT || 'Operations');
    }
  }, [user]);

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

  const handleModulePress = (moduleId: string) => {
    if (onModulePress) {
      onModulePress(moduleId);
    }
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <WarehouseHeader userName={displayUserName} userDepartment={displayUserDepartment} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={{ paddingHorizontal: 16 }}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Production Modules
              </Text>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Manage your production operations
              </Text>
            </View>
            <ModuleGrid
              modules={PRODUCTION_MODULES.map(module => ({
                ...module,
                color: getModuleColor(module.color || 'primary'),
              }))}
              isTablet={isTablet}
              onModulePress={handleModulePress}
            />
          </View>
        </View>
        <View style={{ height: 100 + insets.bottom }} />
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
  scrollContent: {
    paddingBottom: 0,
  },
  section: {
    marginTop: 24,
    marginBottom: 24,
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
});

export default ProductionDeptHomeScreen;
