import axios from 'axios';
import Constants from 'expo-constants';
import {
  BatchingMaterialUtilization,
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
  private variantCache: Map<string, DropdownOption[]> = new Map();
  private machineLineCache: { company: string | undefined; data: DropdownOption[] } | null = null;

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

  async getMaterialUtilizationLists(company?: string): Promise<any[]> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const response = await axios.get<{ success: boolean; data: any[] }>(
        `${this.baseUrl}/production-dept/material-utilization/get-material-utilization-lists`,
        { params: company ? { company } : undefined }
      );
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  async getMaterialUtilizationDetails(company?: string, usageNo?: number): Promise<{ header: any; details: any[] }> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const response = await axios.get<{ success: boolean; header?: any; details?: any[] }>(
        `${this.baseUrl}/production-dept/material-utilization/get-material-utilization-details`,
        { params: { company, usageNo } }
      );
      if (response.data.success) {
        return { header: response.data.header, details: response.data.details || [] };
      }
      return { header: null, details: [] };
    } catch (error) {
      throw error;
    }
  }

  async getNextusageNo(company?: string): Promise<string[]> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const response = await axios.get<{ success: boolean; usageNo?: string; refNos?: string[] }>(
        `${this.baseUrl}/production-dept/material-utilization/get-next-usage-ref-no`,
        { params: company ? { company } : undefined }
      );
      if (response.data.success) {
        const refNo = response.data.usageNo || response.data.refNos?.[0];
        return refNo ? [String(refNo)] : [];
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  async getMachineLines(company?: string): Promise<DropdownOption[]> {
    if (this.machineLineCache && this.machineLineCache.company === company) {
      return this.machineLineCache.data;
    }
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const response = await axios.get<{ success: boolean; data: any[] }>(
        `${this.baseUrl}/production-dept/material-utilization/get-machine-lines`,
        { params: company ? { company } : undefined }
      );
      if (response.data.success && response.data.data.length > 0) {
        const options = response.data.data.map((item) => ({
          label: item.MACHINELINE || '',
          value: item.MACHINELINE || '',
        }));
        this.machineLineCache = { company, data: options };
        return options;
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  async getFeedTypes(company?: string): Promise<DropdownOption[]> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const response = await axios.get<{ success: boolean; data: any[] }>(
        `${this.baseUrl}/production-dept/material-utilization/get-feed-types`,
        { params: company ? { company } : undefined }
      );
      if (response.data.success && response.data.data.length > 0) {
        const options = response.data.data.map((item) => ({
          label: item.ITEMDESC ? `${item.ITEMNMBR} - ${item.ITEMDESC}` : item.ITEMNMBR,
          value: item.ITEMNMBR,
        }));

        return options;
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  async getVariantsByFeedType(company?: string, feedType?: string): Promise<DropdownOption[]> {
    if (!feedType) return [];
    const cacheKey = `${company}:${feedType}`;
    if (this.variantCache.has(cacheKey)) {
      return this.variantCache.get(cacheKey)!;
    }
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const response = await axios.get<{ success: boolean; data: any[] }>(
        `${this.baseUrl}/production-dept/material-utilization/get-variants-by-feed-type`,
        { params: company && feedType ? { company, feedType } : { feedType } }
      );
      if (response.data.success && response.data.data.length > 0) {
        const options = response.data.data.map((item) => ({
          label: item.VARIANTCODE,
          value: item.VARIANTCODE,
        }));
        this.variantCache.set(cacheKey, options);
        return options;
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

  async getAllocation(company?: string, itemNo?: string, kgsUsed?: number): Promise<any[]> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const response = await axios.get<{ success: boolean; data: any[] }>(
        `${this.baseUrl}/production-dept/material-utilization/get-allocation`,
        { params: { company, itemNo, kgsUsed } }
      );
      if (response.data.success) {
        return response.data.data;
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
        const options = response.data.items.map((item) => ({
          label: `${item['ITEM CODE'].trim()} - ${item['ITEM DESCRIPTION'].trim()}`,
          value: item['ITEM CODE'].trim(),
          description: item['ITEM DESCRIPTION'].trim(),
        }));
        return options;
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  async saveMaterialUtilization(payload: MaterialUtilizationPayload, company?: string): Promise<MaterialUtilizationPostResponse> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const response = await axios.post<MaterialUtilizationPostResponse>(
        `${this.baseUrl}/production-dept/material-utilization/save-material-utilization`,
        payload,
        { params: company ? { company } : undefined }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async saveBatchingMaterialUtilization(payload: BatchingMaterialUtilization, company?: string): Promise<MaterialUtilizationPostResponse> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const response = await axios.post<MaterialUtilizationPostResponse>(
        `${this.baseUrl}/production-dept/material-utilization/save-batching-material-utilization`,
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
