import axios from 'axios';
import Constants from 'expo-constants';
import {
  DropdownOption,
  MaterialUtilizationPayload,
  MaterialUtilizationPostResponse
} from '../types/materialUtilization.types';

export interface FeedTypeVariantRow {
  ITEMNMBR: string;
  ITEMDESC: string;
  VARIANTCODE: string;
  KGSPERBAG: number;
}

export class MaterialUtilizationService {
  private static instance: MaterialUtilizationService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = Constants.expoConfig?.extra?.apiUrl || '';
    if (!this.baseUrl) {
      console.warn('API URL not configured! Set EXPO_PUBLIC_API_URL in .env or apiUrl in app.json');
    } else {
      console.log('Material Utilization API URL:', this.baseUrl);
    }
  }

  static getInstance(): MaterialUtilizationService {
    if (!MaterialUtilizationService.instance) {
      MaterialUtilizationService.instance = new MaterialUtilizationService();
    }
    return MaterialUtilizationService.instance;
  }

  async getNextUsageRefNo(company?: string): Promise<string[]> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const response = await axios.get<{ success: boolean; usageRefNo?: string; refNos?: string[] }>(
        `${this.baseUrl}/production-dept/material-utilization/get-next-usage-ref-no`,
        { params: company ? { company } : undefined }
      );
      if (response.data.success) {
        const refNo = response.data.usageRefNo || response.data.refNos?.[0];
        return refNo ? [String(refNo)] : [];
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  async getMachineLines(company?: string): Promise<DropdownOption[]> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const response = await axios.get<{ success: boolean; data: any[] }>(
        `${this.baseUrl}/production-dept/material-utilization/get-machine-lines`,
        { params: company ? { company } : undefined }
      );
      if (response.data.success && response.data.data.length > 0) {
        return response.data.data.map((item) => ({
          label: item.MACHINELINE || '',
          value: item.MACHINELINE || '',
        }));
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  async getFeedTypesAndVariant(company?: string): Promise<FeedTypeVariantRow[]> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const response = await axios.get<{ success: boolean; feedTypes: FeedTypeVariantRow[] }>(
        `${this.baseUrl}/production-dept/material-utilization/get-feed-types-and-variant`,
        { params: company ? { company } : undefined }
      );
      if (response.data.success && response.data.feedTypes.length > 0) {
        return response.data.feedTypes;
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  async getItemCode(company?: string): Promise<DropdownOption[]> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const response = await axios.get<{ success: boolean; items: any[] }>(
        `${this.baseUrl}/production-dept/material-utilization/get-item-code`,
        { params: company ? { company } : undefined }
      );
      if (response.data.success && response.data.items.length > 0) {
        return response.data.items.map((item) => ({
          label: `${item['ITEM CODE'].trim()} - ${item['ITEM DESCRIPTION'].trim()}`,
          value: item['ITEM CODE'].trim(),
          description: item['ITEM DESCRIPTION'].trim(),
        }));
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  async saveMaterialUtilization(
    payload: MaterialUtilizationPayload,
    company?: string
  ): Promise<MaterialUtilizationPostResponse> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const response = await axios.put<MaterialUtilizationPostResponse>(
        `${this.baseUrl}/production-dept/material-utilization/save-material-utilization`,
        payload,
        { params: company ? { company } : undefined }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export const materialUtilizationService = MaterialUtilizationService.getInstance();
