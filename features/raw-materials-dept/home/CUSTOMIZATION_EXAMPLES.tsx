// ============================================================================
// WAREHOUSE CONFIRMATION - HOME SCREEN CUSTOMIZATION EXAMPLES
// ============================================================================
//
// This file provides practical examples for customizing and extending the
// warehouse home screen components.
//

// ============================================================================
// 1. CONNECTING TO REAL DATA / API INTEGRATION
// ============================================================================

import { WarehouseHomeScreen } from '@/features/raw-materials-dept/home';
import { useEffect, useState } from 'react';

export function WarehouseHomeScreenWithAPI() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   // Fetch real warehouse metrics from your backend
  //   const fetchMetrics = async () => {
  //     try {
  //       const response = await fetch('/api/warehouse/metrics');
  //       const data = await response.json();
        
  //       setStats([
  //         {
  //           icon: 'clock-check',
  //           label: 'Pending Confirmations',
  //           value: data.pendingCount,
  //           trend: data.pendingTrend,
  //           color: '#f59e0b',
  //         },
  //         {
  //           icon: 'check-circle',
  //           label: 'Completed Today',
  //           value: data.completedToday,
  //           trend: 'up',
  //           color: '#10b981',
  //         },
  //         {
  //           icon: 'archive',
  //           label: 'Total Transactions',
  //           value: data.totalTransactions,
  //           trend: data.transactionTrend,
  //           color: '#1e40af',
  //         },
  //       ]);
  //     } catch (error) {
  //       console.error('Failed to fetch metrics:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchMetrics();
  //   // Refresh metrics every 30 seconds
  //   const interval = setInterval(fetchMetrics, 30000);
  //   return () => clearInterval(interval);
  // }, []);

  const handleModulePress = (moduleId: string) => {
    console.log(`Navigate to module: ${moduleId}`);
    // Use your app's navigation to go to the module
    // router.push(`/${moduleId}`);
  };

  return (
    <WarehouseHomeScreen
      userName="Warehouse Operator"
      onModulePress={handleModulePress}
    />
  );
}

// ============================================================================
// 2. ADDING CUSTOM MODULES
// ============================================================================

import { ModuleCardData } from '@/features/raw-materials-dept/home';

// Add custom warehouse modules
export const CUSTOM_MODULES: ModuleCardData[] = [
  {
    id: 'receiving',
    title: 'Receiving Confirmation',
    description: 'Confirm incoming shipments',
    icon: 'package-variant-closed-check',
    color: '#10b981',
  },
  {
    id: 'dispatch',
    title: 'Dispatch / Delivery',
    description: 'Process outbound deliveries',
    icon: 'truck-check',
    color: '#0ea5e9',
    badge: 3, // Shows count badge
  },
  {
    id: 'inventory',
    title: 'Inventory Checking',
    description: 'Verify stock levels',
    icon: 'clipboard-check-outline',
    color: '#8b5cf6',
  },
  {
    id: 'custom-audit',
    title: 'Stock Audit',
    description: 'Begin inventory audit',
    icon: 'magnify-scan',
    color: '#ec4899',
    badge: 1,
  },
  {
    id: 'pending',
    title: 'Pending Transactions',
    description: 'Review pending operations',
    icon: 'timer-sand',
    color: '#f59e0b',
    badge: 12,
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    description: 'View warehouse reports',
    icon: 'chart-line',
    color: '#ec4899',
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Configure preferences',
    icon: 'cog-outline',
    color: '#6b7280',
  },
];

// ============================================================================
// 3. IMPLEMENTING NAVIGATION WITH EXPO-ROUTER
// ============================================================================

import { useRouter } from 'expo-router';

export function WarehouseHomeWithNavigation() {
  const router = useRouter();

  const handleModulePress = (moduleId: string) => {
    // Navigate to different screens based on module
    const moduleRoutes: Record<string, string> = {
      'receiving': '/warehouse/receiving' as const,
      'dispatch': '/warehouse/dispatch' as const,
      'inventory': '/warehouse/inventory' as const,
      'pending': '/warehouse/pending' as const,
      'reports': '/warehouse/reports' as const,
      'settings': '/settings' as const,
    };

    const route = moduleRoutes[moduleId];
    if (route) {
      router.push(route as any);
    }
  };

  return (
    <WarehouseHomeScreen
      userName="John Anderson"
      onModulePress={handleModulePress}
    />
  );
}

// ============================================================================
// 4. CUSTOM THEME IMPLEMENTATION
// ============================================================================

import { Colors } from '@/constants/theme';

// Override colors for a specific warehouse location
export const CUSTOM_THEME = {
  light: {
    ...Colors.light,
    primary: '#2563eb', // Different blue shade
    success: '#059669', // Different green
    warning: '#d97706', // Different amber
  },
  dark: {
    ...Colors.dark,
    primary: '#3b82f6',
    success: '#06b6d4',
    warning: '#f59e0b',
  },
};

// ============================================================================
// 5. ADDING REAL-TIME UPDATES WITH WEBSOCKETS
// ============================================================================

import { useRef } from 'react';

export function WarehouseHomeWithRealtimeUpdates() {
  const wsRef = useRef<WebSocket | null>(null);
  const [metrics, setMetrics] = useState<any[]>([]);

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    wsRef.current = new WebSocket('wss://warehouse-api.example.com/metrics');

    wsRef.current.onmessage = (event: MessageEvent<string>) => {
      try {
        const data = JSON.parse(event.data);
        setMetrics([
          {
            icon: 'clock-check',
            label: 'Pending Confirmations',
            value: data.pendingCount,
            trend: data.pendingTrend,
            color: '#f59e0b',
          },
          {
            icon: 'check-circle',
            label: 'Completed Today',
            value: data.completedToday,
            trend: 'up',
            color: '#10b981',
          },
          {
            icon: 'archive',
            label: 'Total Transactions',
            value: data.totalTransactions,
            trend: 'neutral',
            color: '#1e40af',
          },
        ]);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <WarehouseHomeScreen
      userName="Warehouse Operator"
      onModulePress={(moduleId) => console.log(moduleId)}
    />
  );
}

// ============================================================================
// 6. MULTI-USER LOCALE SUPPORT
// ============================================================================


export const translations = {
  en: {
    app_name: 'Warehouse Confirmation',
    receiving: 'Receiving Confirmation',
    dispatch: 'Dispatch / Delivery',
    inventory: 'Inventory Checking',
    pending: 'Pending Transactions',
    reports: 'Reports & Analytics',
    settings: 'Settings',
    pending_confirmations: 'Pending Confirmations',
    completed_today: 'Completed Today',
    total_transactions: 'Total Transactions',
  },
  es: {
    app_name: 'Confirmación de Almacén',
    receiving: 'Confirmar Recepción',
    dispatch: 'Envío / Entrega',
    inventory: 'Verificación de Inventario',
    pending: 'Transacciones Pendientes',
    reports: 'Reportes y Análisis',
    settings: 'Configuración',
    pending_confirmations: 'Confirmaciones Pendientes',
    completed_today: 'Completado Hoy',
    total_transactions: 'Transacciones Totales',
  },
  fr: {
    app_name: 'Confirmation d\'Entrepôt',
    receiving: 'Confirmation de Réception',
    dispatch: 'Expédition / Livraison',
    inventory: 'Vérification des Stocks',
    pending: 'Transactions en Attente',
    reports: 'Rapports et Analyses',
    settings: 'Paramètres',
    pending_confirmations: 'Confirmations en Attente',
    completed_today: 'Complété Aujourd\'hui',
    total_transactions: 'Total des Transactions',
  },
};

// ============================================================================
// 7. OFFLINE MODE WITH LOCAL STORAGE
// ============================================================================
// NOTE: Requires: npm install @react-native-async-storage/async-storage
// import AsyncStorage from '@react-native-async-storage/async-storage';

export async function saveMetricsLocally(metrics: any) {
  try {
    // Uncomment after installing @react-native-async-storage/async-storage
    // await AsyncStorage.setItem('warehouse_metrics', JSON.stringify(metrics));
    console.log('Metrics saved locally:', metrics);
  } catch (error) {
    console.error('Failed to save metrics locally:', error);
  }
}

export async function getMetricsFromCache() {
  try {
    // Uncomment after installing @react-native-async-storage/async-storage
    // const cached = await AsyncStorage.getItem('warehouse_metrics');
    // return cached ? JSON.parse(cached) : null;
    return null;
  } catch (error) {
    console.error('Failed to get cached metrics:', error);
    return null;
  }
}

export async function syncMetricsOnOnline() {
  try {
    const cachedMetrics = await getMetricsFromCache();
    if (cachedMetrics) {
      // Sync cached metrics with server
      await fetch('/api/warehouse/metrics/sync', {
        method: 'POST',
        body: JSON.stringify(cachedMetrics),
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Failed to sync metrics:', error);
  }
}

// ============================================================================
// 8. ENTERPRISE SINGLE SIGN-ON (SSO)
// ============================================================================
// NOTE: Requires: expo install expo-secure-store
// import * as SecureStore from 'expo-secure-store';

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  warehouseLocation: string;
  role: 'operator' | 'supervisor' | 'manager' | 'admin';
}

export async function getCurrentUser(): Promise<UserInfo | null> {
  try {
    // Uncomment after installing expo-secure-store
    // const userJson = await SecureStore.getItemAsync('warehouse_user');
    // return userJson ? JSON.parse(userJson) : null;
    return null;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

export async function saveUserInfo(user: UserInfo) {
  try {
    // Uncomment after installing expo-secure-store
    // await SecureStore.setItemAsync('warehouse_user', JSON.stringify(user));
    console.log('User info saved:', user);
  } catch (error) {
    console.error('Failed to save user info:', error);
  }
}

// ============================================================================
// 9. BADGE UPDATES VIA NOTIFICATIONS
// ============================================================================
// NOTE: Requires: expo install expo-notifications
// import * as Notifications from 'expo-notifications';

export async function setupNotifications() {
  try {
    // Uncomment after installing expo-notifications
    // const { status } = await Notifications.requestPermissionsAsync();
    // if (status !== 'granted') {
    //   console.log('Notification permission not granted');
    //   return;
    // }
    //
    // Notifications.addNotificationResponseListener((response: any) => {
    //   const moduleId = response.notification.request.content.data.moduleId;
    //   console.log(`Show module: ${moduleId}`);
    //   // Handle navigation
    // });
    console.log('Notifications setup (placeholder)');
  } catch (error) {
    console.error('Failed to setup notifications:', error);
  }
}

// ============================================================================
// 10. PERFORMANCE MONITORING
// ============================================================================

export function captureScreenPerformance(screenName: string, duration: number) {
  // Send to your analytics service
  console.log(`Screen ${screenName} took ${duration}ms to render`);
  
  // Example: Send to Firebase
  // analytics().logEvent('screen_performance', {
  //   screen_name: screenName,
  //   duration_ms: duration,
  // });
}

// ============================================================================
// USAGE: Import and use these customizations in your main app
// ============================================================================

/*
import { WarehouseHomeWithNavigation } from '@/features/raw-materials-dept/home/examples';

export default function AppRoot() {
  return <WarehouseHomeWithNavigation />;
}
*/
