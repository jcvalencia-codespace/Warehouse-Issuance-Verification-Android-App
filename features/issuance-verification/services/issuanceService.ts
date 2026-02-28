import axios from 'axios';
import { BagAllocationResponse } from '../types/issuance.types';

export interface AreaOption {
  label: string;
  value: string;
}

export class IssuanceService {
  private static instance: IssuanceService;
  private baseUrl = process.env.EXPO_PUBLIC_API_URL;

  private constructor() {}

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
   * Allocate bags from inventory using FIFO method
   * @param requiredBags - Number of bags needed
   * @param area - Area/location to allocate from (required)
   * @param itemNumber - Item number to allocate (required)
   */
  async allocateBags(
    requiredBags: number, 
    area: string, 
    itemNumber: string
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
