import axios from 'axios';

export interface UserAccount {
  USERNAME: string;
  // Add other fields you expect from backend
}

export class AuthService {
  private static instance: AuthService;
  private baseUrl = process.env.EXPO_PUBLIC_API_URL; // Use your tablet/backend URL

  private constructor() {}

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
