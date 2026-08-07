import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

if (Platform.OS !== 'web') {
  require('react-native-reanimated');
}

import { AuthProvider, useAuth } from '@/features/auth/context/AuthContext';
import { NotificationPopUp } from '@/features/notification/components/NotificationPopUp';
import { useColorScheme } from '../hooks/use-color-scheme';
import { LoadingScreen } from '../shared/components/LoadingScreen';
import { ToastProvider } from '../shared/components/ui/toast';

let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch {
  // expo-notifications is unavailable in this environment (e.g., Expo Go without dev build)
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [initProgress, setInitProgress] = useState(0);

  // Initial app loading simulation with progress
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setInitProgress(10);
        await new Promise(resolve => setTimeout(resolve, 400));
        setInitProgress(30);
        
        await new Promise(resolve => setTimeout(resolve, 300));
        setInitProgress(50);
        
        await new Promise(resolve => setTimeout(resolve, 200));
        setInitProgress(70);
        
        await new Promise(resolve => setTimeout(resolve, 200));
        setInitProgress(100);
        
        setIsAppReady(true);
      } catch {
        setIsAppReady(true);
      }
    };

    initializeApp();
  }, []);

  // Mark component as mounted after first render
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Navigation logic
  useEffect(() => {
    // Don't navigate until component is mounted and app is ready
    if (!isMounted || !isAppReady) return;
    
    const inAuthGroup = segments[0] === 'auth';
    
    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated and not already on auth page
      router.replace('/auth');
    } else if (isAuthenticated && inAuthGroup) {
      const homeRoute = user?.DEPTCODE === 'PAWHSP' ? '/(tabs)/supplies-dept' : '/(tabs)';
      router.replace(homeRoute);
    }
  }, [isAuthenticated, segments, router, isMounted, isAppReady, user?.DEPTCODE]);

  // Notification listeners
  useEffect(() => {
    if (!Notifications) return;

    const subscriptionForeground = Notifications.addNotificationReceivedListener((_notification: any) => {
      console.log('Notification received in foreground:', _notification);
    });

    const subscriptionResponse = Notifications.addNotificationResponseReceivedListener((_response: any) => {
      const data = _response.notification.request.content.data;
      if (data?.type === 'MATERIAL_ISSUANCE_REQUESTED' && data.mirNo) {
        router.push({
          pathname: '/raw-materials-dept/material-issuance-confirmation',
          params: { source: 'production' },
        });
      }
    });

    return () => {
      subscriptionForeground.remove();
      subscriptionResponse.remove();
    };
  }, [router]);

  // Show loading screen while app initializes
  if (!isAppReady) {
    return (
      <LoadingScreen
        message="Initializing App"
        subMessage="Setting up your workspace..."
        progress={initProgress}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <ToastProvider>
          <Stack
            screenOptions={{
              animation: 'slide_from_right',
              headerShown: false,
            }}
          >
            <Stack.Screen name="auth" options={{ animation: 'fade' }} />
            <Stack.Screen name="(tabs)" />
            
            {/**RM ROUTE */}
            <Stack.Screen name="raw-materials-dept/material-issuance-confirmation" options={{ title: 'Material Issuance Confirmation' }} />
            <Stack.Screen name="raw-materials-dept/posted-warehouse-confirmation" 
              options={{ title: 'Posted Warehouse Confirmation' }} 
            />
            <Stack.Screen name="raw-materials-dept/issuance-verification" options={{ title: 'Issuance Verification' }} />
            <Stack.Screen name="raw-materials-dept/pending-warehouse-confirmation" options={{ title: 'Pending Warehouse Confirmation' }} />
            <Stack.Screen name="raw-materials-dept/reports" options={{ title: 'Reports & Analytics' }} />
            <Stack.Screen name="raw-materials-dept/settings" options={{ title: 'Settings' }} />

            {/**SUPPLIES ROUTE */}
            <Stack.Screen name="supplies-dept/supplies-issuance" options={{ title: 'Supplies Issuance' }} />

            {/**PRODUCTION ROUTE */}
            <Stack.Screen name="production-dept/material-issuance-confirmation" options={{ title: 'Material Issuance Confirmation' }} />
            <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
            <Stack.Screen name="coming-soon" options={{ title: 'Coming Soon' }} />
            
          </Stack>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <NotificationPopUp />
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutWithNotifications() {
  useEffect(() => {
    if (!Notifications || Platform.OS === 'web') return;

    Notifications.getLastNotificationResponseAsync().then((response: any) => {
      if (response?.notification?.request?.content?.data?.type === 'MATERIAL_ISSUANCE_REQUESTED') {
        console.log('App opened from notification');
      }
    });
  }, []);

  return <RootLayoutNav />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutWithNotifications />
    </AuthProvider>
  );
}
