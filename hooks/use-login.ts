import { AuthService } from '@/lib/auth.service';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

interface UseLoginReturn {
  username: string;
  password: string;
  isLoading: boolean;
  setUsername: (username: string) => void;
  setPassword: (password: string) => void;
  handleLogin: () => Promise<void>;
}

export function useLogin(): UseLoginReturn {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = useCallback(async () => {
    // Validate credentials
    const validationError = await AuthService.getInstance().validateCredentials(username, password);
    if (validationError) {
      Alert.alert(
        'Validation Error',
        validationError,
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);

    try {
      const user = await AuthService.getInstance().authenticate(username, password);

      if (user) {
        Alert.alert(
          'Success',
          'Login successful!',
          [{ text: 'OK' }]
        );

        // Navigate to main app screen
        router.replace('(tabs)');

        // Clear form
        setUsername('');
        setPassword('');
      } else {
        Alert.alert(
          'Login Failed',
          'Invalid username or password',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [username, password, router]);

  return {
    username,
    password,
    isLoading,
    setUsername,
    setPassword,
    handleLogin
  };
}
