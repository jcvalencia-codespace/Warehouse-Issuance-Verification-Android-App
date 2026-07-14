/**
 * Warehouse Metrics Service
 * Handles API calls to fetch warehouse dashboard metrics
 */

import axios from 'axios';
import Constants from 'expo-constants';

interface WarehouseMetrics {
  pendingCount: number;
  completedToday: number;
  totalTransactions: number;
  timestamp: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class WarehouseMetricsService {
  private baseUrl: string;

  constructor() {
    // Get API URL from environment or app.json config
    this.baseUrl = Constants.expoConfig?.extra?.apiUrl || '';
    if (!this.baseUrl) {
      console.warn('⚠️  API URL not configured! Set EXPO_PUBLIC_API_URL in .env or apiUrl in app.json');
    } else {
      console.log('📡 Warehouse API URL:', this.baseUrl);
    }
  }

  async getMetrics(): Promise<WarehouseMetrics | null> {
    try {
      if (!this.baseUrl) {
        console.error('API URL not configured');
        return null;
      }

      const response = await axios.get<ApiResponse<WarehouseMetrics>>(
        `${this.baseUrl}/warehouse/metrics`,
        {
          timeout: 100000,
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      console.error('Failed to fetch metrics:', response.data.error || response.data.message);
      return null;
    } catch (error: any) {
      // console.error('Error fetching warehouse metrics:', {
      //   message: error.message,
      //   status: error.response?.status,
      //   data: error.response?.data,
      // });
      return null;
    }
  }

  async getPendingTransactions(skip = 0, take = 50) {
    try {
      if (!this.baseUrl) {
        console.error('API URL not configured');
        return null;
      }

      const response = await axios.get(
        `${this.baseUrl}/warehouse/pending-transactions?skip=${skip}&take=${take}`,
        {
          timeout: 10000,
        }
      );

      if (response.data.success) {
        return response.data;
      }

      console.error('Failed to fetch pending transactions');
      return null;
    } catch (error: any) {
      console.error('Error fetching pending transactions:', error.message);
      return null;
    }
  }

  async getCompletedToday(skip = 0, take = 50) {
    try {
      if (!this.baseUrl) {
        console.error('API URL not configured');
        return null;
      }

      const response = await axios.get(
        `${this.baseUrl}/warehouse/completed-today?skip=${skip}&take=${take}`,
        {
          timeout: 10000,
        }
      );

      if (response.data.success) {
        return response.data;
      }

      console.error('Failed to fetch completed transactions');
      return null;
    } catch (error: any) {
      console.error('Error fetching completed transactions:', error.message);
      return null;
    }
  }

  async getPostedTransactions(skip = 0, take = 99999) {
    try {
      if (!this.baseUrl) {
        console.error('API URL not configured');
        return null;
      }

      const response = await axios.get(
        `${this.baseUrl}/warehouse/posted-transactions?skip=${skip}&take=${take}`,
        {
          timeout: 100000,
        }
      );

      if (response.data.success) {
        return response.data;
      }

      console.error('Failed to fetch posted transactions');
      return null;
    } catch (error: any) {
      // console.error('Error fetching posted transactions:', error.message);
      return null;
    }
  }

  async getPostedTransactionDetails(transRefNo: string) {
    try {
      if (!this.baseUrl) {
        console.error('API URL not configured');
        return null;
      }

      const response = await axios.get(
        `${this.baseUrl}/warehouse/posted-transaction-details?transRefNo=${transRefNo}`,
        {
          timeout: 10000,
        }
      );

      if (response.data.success) {
        return response.data;
      }

      console.error('Failed to fetch transaction details');
      return null;
    } catch (error: any) {
      console.error('Error fetching transaction details:', error.message);
      return null;
    }
  }
}

export const warehouseMetricsService = new WarehouseMetricsService();
