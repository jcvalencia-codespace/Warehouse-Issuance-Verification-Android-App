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
    this.baseUrl = Constants.expoConfig?.extra?.apiUrl || '';
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
   * Get the next issuance reference number
   */
  async getIssuanceReferenceNumber(): Promise<string> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }

      const response = await axios.get(`${this.baseUrl}/issuance/issuance-reference`);
      
      if (response.data.success) {
        return response.data.nextReferenceNumber;
      }
      
      return '';
    } catch (error) {
      console.error('Error fetching issuance reference number:', error);
      throw error;
    }
  }

  /**
   * Get list of all item numbers (without area filter)
   */
  async getAllItems(): Promise<AreaOption[]> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }

      const response = await axios.get(`${this.baseUrl}/issuance/items`);
      
      if (response.data.success) {
        return response.data.data as AreaOption[];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching all items:', error);
      throw error;
    }
  }

  /**
   * Get list of areas by item number
   */
  async getAreasByItem(itemNumber: string, itemRemarks?: string): Promise<AreaOption[]> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }

      let url = `${this.baseUrl}/issuance/items/${encodeURIComponent(itemNumber)}/areas`;
      if (itemRemarks) {
        url += `?itemRemarks=${encodeURIComponent(itemRemarks)}`;
      }

      const response = await axios.get(url);
      
      if (response.data.success) {
        return response.data.data as AreaOption[];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching areas by item:', error);
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
   * Get list of lot numbers by area and optionally by item number and remarks
   */
  async getLotsByArea(area: string, itemNumber?: string, itemRemarks?: string): Promise<AreaOption[]> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }

      let url = `${this.baseUrl}/issuance/areas/${encodeURIComponent(area)}/lots`;
      const params: string[] = [];
      if (itemNumber) {
        params.push(`itemNumber=${encodeURIComponent(itemNumber)}`);
      }
      if (itemRemarks) {
        params.push(`itemRemarks=${encodeURIComponent(itemRemarks)}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
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
   * Get lots for area and item (full details for allocation table)
   */
  async getLotsByAreaAndItem(area: string, itemNumber: string, itemRemarks?: string, date?: string): Promise<any> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }

      let url = `${this.baseUrl}/issuance/areas/${encodeURIComponent(area)}/lots-by-item?itemNumber=${encodeURIComponent(itemNumber)}`;
      if (itemRemarks) {
        url += `&itemRemarks=${encodeURIComponent(itemRemarks)}`;
      }
      if (date) {
        url += `&date=${encodeURIComponent(date)}`;
      }

      const response = await axios.get(url);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching lots by area and item:', error);
      throw error;
    }
  }

  /**
   * Allocate bags from inventory using FIFO method
   * @param requiredBags - Number of bags needed
   * @param area - Area/location to allocate from (required)
   * @param itemNumber - Item number to allocate (required)
   * @param lotNumber - Optional lot number to filter allocation
   * @param itemRemarks - Optional remarks to filter allocation
   * @param date - Optional date to filter allocation (YYYY-MM-DD format)
   */
  async allocateBags(
    requiredBags: number, 
    area: string, 
    itemNumber: string,
    lotNumber?: string,
    itemRemarks?: string,
    date?: string
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
          itemRemarks,
          date,
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
    issuanceRefNumber: string;
    transactionRefNumber: string;
    area: string;
    palletWeight: number;
    numberOfBags: number;
    weightInKg: number;
    allocations?: BagAllocationResponse['data'];
    username?: string;
    forkliftOperator?: string;
    floorScale?: string;
    transType?: string;
    date?: string;
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
