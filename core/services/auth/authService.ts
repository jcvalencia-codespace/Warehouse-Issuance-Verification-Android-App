import { UserAccount } from '@/features/auth/types/auth.types';
import axios from 'axios';
import Constants from 'expo-constants';

export class AuthService {
  private static instance: AuthService;
  private baseUrl: string;

  private constructor() {
    // Get API URL from environment or app.json config
    this.baseUrl = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl || '';
    if (!this.baseUrl) {
      console.warn('⚠️  API URL not configured! Set EXPO_PUBLIC_API_URL in .env or apiUrl in app.json');
    } else {
      console.log('📡 Auth API URL:', this.baseUrl);
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async validateCredentials(username: string, password: string): Promise<string | null> {
    if (!username.trim() || !password.trim()) {
      return 'Please enter both username and password';
    }
    return null;
  }

  async authenticate(username: string, password: string): Promise<UserAccount | null> {
    try {
      if (!this.baseUrl) {
        throw new Error(`API URL not configured. EXPO_PUBLIC_API_URL=${this.baseUrl}`);
      }

      console.log(`Attempting to connect to: ${this.baseUrl}/login`);
      const startTime = Date.now();
      
      const response = await axios.post(`${this.baseUrl}/login`, {
        username,
        password,
      }, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const elapsedTime = Date.now() - startTime;
      console.log(`✅ Login request completed in ${elapsedTime}ms`);

      if (response.data.success) {
        console.log('✅ Authentication successful');
        return response.data.user as UserAccount;
      }

      console.warn('⚠️ Server returned success=false');
      return null;
    } catch (err: any) {
      const elapsedTime = Date.now() - (err.config?.metadata?.startTime || Date.now());
      
      if (err.response && err.response.status === 401) {
        console.warn('⚠️ Invalid credentials (401)');
        return null;
      }
      
      const errorMessage = err.message || 'Unknown error';
      const statusCode = err.response?.status || 'No response';
      const serverError = err.response?.data?.message || '';
      const errorCode = err.code;
      
      // Detailed error logging
      console.error('❌ Login error - Details:', {
        baseUrl: this.baseUrl,
        statusCode,
        message: errorMessage,
        errorCode,
        serverError,
        elapsedTime: `${elapsedTime}ms`,
        fullError: err.toString(),
      });
      
      // Provide more helpful error messages
      let userFriendlyMessage = `Failed to connect to server (${statusCode}): ${errorMessage}`;
      
      if (errorCode === 'ECONNREFUSED') {
        userFriendlyMessage = `Server refused connection. Is the server running on ${this.baseUrl}?`;
      } else if (errorCode === 'ENOTFOUND') {
        userFriendlyMessage = `Cannot reach server at ${this.baseUrl}. Check network and IP address.`;
      } else if (errorCode === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
        userFriendlyMessage = `Request timed out after ${elapsedTime}ms. Server may be unresponsive.`;
      } else if (statusCode === 'No response') {
        userFriendlyMessage = `No response from server at ${this.baseUrl}. Check if server is running.`;
      }
      
      throw new Error(userFriendlyMessage);
    }
  }
}
