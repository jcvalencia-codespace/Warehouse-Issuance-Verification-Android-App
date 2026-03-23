import axios from 'axios';
import Constants from 'expo-constants';

export interface UserAccount {
  USERNAME: string;
  // Add other fields you expect from backend
}

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
        throw new Error(`API URL not configured. Using: ${this.baseUrl}`);
      }

      console.log(`Attempting to connect to: ${this.baseUrl}/login`);
      const response = await axios.post(`${this.baseUrl}/login`, {
        username,
        password,
      });

      if (response.data.success) {
        return response.data.user as UserAccount;
      }

      return null;
    } catch (err: any) {
      if (err.response && err.response.status === 401) return null;
      
      // Better error diagnostics
      const errorMessage = err.message || 'Unknown error';
      const statusCode = err.response?.status || 'No response';
      const serverError = err.response?.data?.message || '';
      
      console.error('Login error - Details:', {
        baseUrl: this.baseUrl,
        statusCode,
        message: errorMessage,
        serverError,
        code: err.code,
      });
      
      throw new Error(`Failed to connect to server (${statusCode}): ${errorMessage}`);
    }
  }
}
