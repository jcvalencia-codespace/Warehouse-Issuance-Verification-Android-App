import axios from 'axios';
import Constants from 'expo-constants';
import {
    DropdownOption,
    FormulationMaterial,
    MaterialUtilizationPayload,
    MaterialUtilizationPostResponse,
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
          label: item.MACHINE_LINE || item.MACHINE_LINE_NAME || item.NAME || String(item.MACHINE_LINE_ID || item.MACHINELINE),
          value: String(item.MACHINE_LINE_ID || item.MACHINELINE || item.MACHINE_LINE || item.NAME),
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

  async getFormulations(
    feedType: string,
    variant: string,
    company?: string
  ): Promise<DropdownOption[]> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const response = await axios.get<{ success: boolean; data: any[] }>(
        `${this.baseUrl}/production-dept/material-utilization/get-formulations`,
        {
          params: {
            feedType,
            variant,
            ...(company ? { company } : {}),
          },
        }
      );
      if (response.data.success && response.data.data.length > 0) {
        return response.data.data.map((item) => ({
          label: item.FORMULATION_NO || item.FORMULATION_CODE || String(item.FORMULATION_ID),
          value: String(item.FORMULATION_ID || item.FORMULATION_NO),
          description: item.FORMULATION_NAME,
        }));
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  async getFormulationMaterials(
    formulationNo: string,
    company?: string
  ): Promise<FormulationMaterial[]> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const response = await axios.get<{ success: boolean; data: any[] }>(
        `${this.baseUrl}/production-dept/material-utilization/get-formulation-materials/${encodeURIComponent(formulationNo)}`,
        { params: company ? { company } : undefined }
      );
      if (response.data.success && response.data.data.length > 0) {
        return response.data.data.map((item) => ({
          itemNo: item.ITEM_NO || item.ITEMNMBR || String(item.ITEM_ID),
          itemDescription: item.ITEM_DESCRIPTION || item.ITEMDESC || '',
          requiredWeight: Number(item.REQUIRED_WEIGHT || item.REQUIRED_QTY || 0),
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
