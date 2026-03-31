import axios from 'axios';
import Constants from 'expo-constants';
import { StockBalanceParams, StockBalanceResponse } from '../types/stockBalance.types';

export class StockBalanceService {
  private static instance: StockBalanceService;
  private baseUrl: string;

  private constructor() {
    // Get API URL from environment or app.json config
    this.baseUrl = Constants.expoConfig?.extra?.apiUrl || '';
    if (!this.baseUrl) {
      console.warn('⚠️  API URL not configured! Set EXPO_PUBLIC_API_URL in .env or apiUrl in app.json');
    } else {
      console.log('📡 Stock Balance API URL:', this.baseUrl);
    }
  }

  static getInstance(): StockBalanceService {
    if (!StockBalanceService.instance) {
      StockBalanceService.instance = new StockBalanceService();
    }
    return StockBalanceService.instance;
  }

  /**
   * Get current stock balance
   * @param params - Optional parameters for filtering
   */
  async getStockBalance(params?: StockBalanceParams): Promise<StockBalanceResponse> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }

      const queryParams = new URLSearchParams();
      
      if (params?.locncode) {
        queryParams.append('locncode', params.locncode);
      }
      if (params?.search) {
        queryParams.append('search', params.search);
      }
      if (params?.area) {
        queryParams.append('area', params.area);
      }
      if (params?.itemNumber) {
        queryParams.append('itemNumber', params.itemNumber);
      }
      if(params?.receivedDate){
        queryParams.append('receivedDate', params.receivedDate);
      }

      const queryString = queryParams.toString();
      const url = `${this.baseUrl}/stock-balance${queryString ? `?${queryString}` : ''}`;

      const response = await axios.get(url);

      if (response.data.success) {
        return response.data as StockBalanceResponse;
      }

      return {
        success: false,
        data: [],
        message: response.data.message || 'Failed to fetch stock balance'
      };
    } catch (error) {
      console.error('Error fetching stock balance:', error);
      throw error;
    }
  }
}

export const stockBalanceService = StockBalanceService.getInstance();
