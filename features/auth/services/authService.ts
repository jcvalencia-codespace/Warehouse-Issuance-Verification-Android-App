import axios from 'axios';
import Constants from 'expo-constants';
import { LoginHistoryRequest, UserAccount } from '../types/auth.types';

export class AuthService {
  private static instance: AuthService;
  private baseUrl: string;

  private constructor() {
    // Get API URL from environment or app.json config
    this.baseUrl = Constants.expoConfig?.extra?.apiUrl || '';
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

  async authenticate(username: string, password: string, company?: string, system?: string): Promise<UserAccount | null> {
    try {
      if (!this.baseUrl) {
        throw new Error(`API URL not configured. Using: ${this.baseUrl}`);
      }

      console.log(`Attempting to connect to: ${this.baseUrl}/login`);
      const response = await axios.post(`${this.baseUrl}/login`, {
        username,
        password,
        company,
        system,
      });

      if (response.data.success) {
        const user = response.data.user;
        if (company && user) {
          user.COMPANY = company;
        }
        console.log('[AuthService] Login response user:', JSON.stringify(user));
        return user as any;
      }

      return null;
    } catch (err: any) {
      if (err.response && err.response.status === 401) return null;
      
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

  async postLoginHistory(data: LoginHistoryRequest): Promise<boolean> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }

      const response = await axios.post(`${this.baseUrl}/auth/login-history`, data);
      return response.data.success === true;
    } catch (err: any) {
      console.error('Login history error:', err.message || err);
      return false;
    }
  }
}
