import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/features/auth/context/AuthContext';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/use-color-scheme';
import { LoadingScreen } from '../shared/components/LoadingScreen';
import { ToastProvider } from '../shared/components/ui/toast';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [initProgress, setInitProgress] = useState(0);

  // Initial app loading simulation with progress
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setInitProgress(10);
        // Simulate app initialization tasks
        await new Promise(resolve => setTimeout(resolve, 400));
        setInitProgress(30);
        
        await new Promise(resolve => setTimeout(resolve, 300));
        setInitProgress(50);
        
        await new Promise(resolve => setTimeout(resolve, 200));
        setInitProgress(70);
        
        await new Promise(resolve => setTimeout(resolve, 200));
        setInitProgress(100);
        
        setIsAppReady(true);
      } catch (error) {
        // Even on error, show app is ready
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
      // Redirect to main app if authenticated and on auth page
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, router, isMounted, isAppReady]);

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
            <Stack.Screen name="raw-materials-dept/posted-warehouse-confirmation" 
              options={{ title: 'Posted Warehouse Confirmation' }} 
            />
            <Stack.Screen name="raw-materials-dept/issuance-verification" options={{ title: 'Issuance Verification' }} />
            <Stack.Screen name="supplies-issuance" options={{ title: 'Supplies Issuance' }} />
            <Stack.Screen name="raw-materials-dept/pending-warehouse-confirmation" options={{ title: 'Pending Warehouse Confirmation' }} />
            <Stack.Screen name="raw-materials-dept/reports" options={{ title: 'Reports & Analytics' }} />
            <Stack.Screen name="raw-materials-dept/settings" options={{ title: 'Settings' }} />
            <Stack.Screen name="coming-soon" options={{ title: 'Coming Soon' }} />
          </Stack>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
