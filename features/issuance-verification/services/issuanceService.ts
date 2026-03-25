import axios from 'axios';
import Constants from 'expo-constants';
import { BagAllocationResponse } from '../types/issuance.types';

export interface AreaOption {
  label: string;
  value: string;
  itemNumber?: string;
  remarks?: string | null;
  lotNumber?: string;
}

export class IssuanceService {
  private static instance: IssuanceService;
  private baseUrl: string;

  private constructor() {
    // Get API URL from environment or app.json config
    this.baseUrl = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl || '';
    if (!this.baseUrl) {
      console.warn('⚠️  API URL not configured! Set EXPO_PUBLIC_API_URL in .env or apiUrl in app.json');
    } else {
      console.log('📡 Issuance API URL:', this.baseUrl);
    }
  }

  static getInstance(): IssuanceService {
    if (!IssuanceService.instance) {
      IssuanceService.instance = new IssuanceService();
    }
    return IssuanceService.instance;
  }

  /**
   * Get list of areas from inventory
   */
  async getAreas(): Promise<AreaOption[]> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }

      const response = await axios.get(`${this.baseUrl}/issuance/areas`);
      
      if (response.data.success) {
        return response.data.data as AreaOption[];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching areas:', error);
      throw error;
    }
  }

  /**
   * Get the next transaction reference number
   */
  async getTransactionReferenceNumber(): Promise<string> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }

      const response = await axios.get(`${this.baseUrl}/issuance/transaction-reference`);
      
      if (response.data.success) {
        return response.data.nextReferenceNumber;
      }
      
      return '';
    } catch (error) {
      console.error('Error fetching transaction reference number:', error);
      throw error;
    }
  }

  /**
   * Get list of item numbers by area
   */
  async getItemsByArea(area: string): Promise<AreaOption[]> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }

      const response = await axios.get(`${this.baseUrl}/issuance/areas/${encodeURIComponent(area)}/items`);
      
      if (response.data.success) {
        return response.data.data as AreaOption[];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching items by area:', error);
      throw error;
    }
  }

  /**
   * Get list of lot numbers by area and optionally by item number
   */
  async getLotsByArea(area: string, itemNumber?: string): Promise<AreaOption[]> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }

      let url = `${this.baseUrl}/issuance/areas/${encodeURIComponent(area)}/lots`;
      if (itemNumber) {
        url += `?itemNumber=${encodeURIComponent(itemNumber)}`;
      }

      const response = await axios.get(url);
      
      if (response.data.success) {
        return response.data.data as AreaOption[];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching lots by area:', error);
      throw error;
    }
  }

  /**
   * Get all available lots for an area (without allocation)
   */
  async getAvailableLots(area: string): Promise<any> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }

      const response = await axios.get(`${this.baseUrl}/issuance/areas/${encodeURIComponent(area)}/available-lots`);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching available lots:', error);
      throw error;
    }
  }

  /**
   * Allocate bags from inventory using FIFO method
   * @param requiredBags - Number of bags needed
   * @param area - Area/location to allocate from (required)
   * @param itemNumber - Item number to allocate (required)
   * @param lotNumber - Optional lot number to filter allocation
   */
  async allocateBags(
    requiredBags: number, 
    area: string, 
    itemNumber: string,
    lotNumber?: string
  ): Promise<BagAllocationResponse> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }

      const response = await axios.post(
        `${this.baseUrl}/issuance/allocate-bags`,
        {
          requiredBags,
          area,
          itemNumber,
          lotNumber,
        },
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      return response.data as BagAllocationResponse;
    } catch (error) {
      console.error('Error allocating bags:', error);
      throw error;
    }
  }

  /**
   * Post issuance verification
   */
  async postIssuance(data: {
    transactionRefNumber: string;
    area: string;
    numberOfBags: number;
    weightInKg: number;
    allocations?: BagAllocationResponse['data'];
    username?: string;
    forkliftOperator?: string;
    floorScale?: string;
    transType?: string;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }

      const response = await axios.post(
        `${this.baseUrl}/issuance/post`,
        data,
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error posting issuance:', error);
      throw error;
    }
  }
}

export const issuanceService = IssuanceService.getInstance();
