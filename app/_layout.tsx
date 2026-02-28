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
            <Stack>
              <Stack.Screen name="auth/index" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="warehouse-confirmation/warehouse-confirmation" 
                options={{ headerShown: false, title: 'Warehouse Confirmation' }} 
              />
              <Stack.Screen name="issuance-verification" options={{ headerShown: false, title: 'Issuance Verification' }} />
            </Stack>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}