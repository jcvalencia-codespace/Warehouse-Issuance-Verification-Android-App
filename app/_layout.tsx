import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/features/auth/context/AuthContext';
import { useColorScheme } from '../hooks/use-color-scheme';
import { ToastProvider } from '../shared/components/ui/toast';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <ToastProvider>
            <Stack
              screenOptions={{
                animation: 'slide_from_right',
                headerShown: false,
              }}
            >
              <Stack.Screen name="auth/index" options={{ animation: 'fade' }} />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="posted-warehouse-confirmation/posted-warehouse-confirmation" 
                options={{ title: 'Posted Warehouse Confirmation' }} 
              />
              <Stack.Screen name="issuance-verification" options={{ title: 'Issuance Verification' }} />
              <Stack.Screen name="pending-warehouse-confirmation/pending-warehouse-confirmation" options={{ title: 'Pending Warehouse Confirmation' }} />
              <Stack.Screen name="reports/reports" options={{ title: 'Reports & Analytics' }} />
              <Stack.Screen name="settings/settings" options={{ title: 'Settings' }} />
              <Stack.Screen name="coming-soon" options={{ title: 'Coming Soon' }} />
            </Stack>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
