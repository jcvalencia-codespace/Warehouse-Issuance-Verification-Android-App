import axios from 'axios';
import Constants from 'expo-constants';
import { MaterialIssuancePayload, MaterialIssuancePostResponse, MaterialIssuanceRequestDetail, MaterialIssuanceRequestHeader, MaterialQuantityAllocation } from '../types/materialIssuance.types';

export type DropdownOption = {
  label: string;
  value: string;
  description?: string;
};

export class MaterialIssuanceService {
  private static instance: MaterialIssuanceService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = Constants.expoConfig?.extra?.apiUrl || '';
    if (!this.baseUrl) {
      console.warn('⚠️  API URL not configured! Set EXPO_PUBLIC_API_URL in .env or apiUrl in app.json');
    } else {
      console.log('📡 Issuance API URL:', this.baseUrl);
    }
  }

  static getInstance(): MaterialIssuanceService {
    if (!MaterialIssuanceService.instance) {
      MaterialIssuanceService.instance = new MaterialIssuanceService();
    }
    return MaterialIssuanceService.instance;
  }

  async getItemCodes(company?: string): Promise<DropdownOption[]> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const response = await axios.get<{ success: boolean; items: any[] }>(
        `${this.baseUrl}/production-dept/material-issuance/get-item-code`,
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

  async getNextMIRNo(company?: string): Promise<string[]> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const response = await axios.get<{ success: boolean; mirNos: string[] }>(
        `${this.baseUrl}/production-dept/material-issuance/get-next-mir-no`,
        { params: company ? { company } : undefined }
      );
      if (response.data.success) {
        return response.data.mirNos;
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  async getAssignQuantityAllocation(
    itemCode: string,
    assignedQty: number,
    company?: string
  ): Promise<MaterialQuantityAllocation[]> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const response = await axios.get<{ success: boolean; allocations: MaterialQuantityAllocation[] }>(
        `${this.baseUrl}/production-dept/material-issuance/get-assigned-quantity-allocation/${encodeURIComponent(itemCode)}`,
        { params: { assignedQty, ...(company ? { company } : {}) } }
      );
      if (response.data.success) {
        return response.data.allocations;
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  async postMaterialIssuanceRequest(payload: MaterialIssuancePayload, company?: string): Promise<MaterialIssuancePostResponse> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const response = await axios.post<MaterialIssuancePostResponse>(
        `${this.baseUrl}/production-dept/material-issuance/post-material-issuance-request`,
        payload,
        { params: company ? { company } : undefined }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async saveMaterialIssuanceRequest(payload: MaterialIssuancePayload, company?: string): Promise<MaterialIssuancePostResponse> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const response = await axios.put<MaterialIssuancePostResponse>(
        `${this.baseUrl}/production-dept/material-issuance/post-material-issuance-request`,
        payload,
        { params: company ? { company } : undefined }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getMaterialIssuanceRequestHeader(company?: string): Promise<MaterialIssuanceRequestHeader[]> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const response = await axios.get<{ success: boolean; data: MaterialIssuanceRequestHeader[] }>(
        `${this.baseUrl}/production-dept/material-issuance/get-material-issuance-request-header`,
        { params: company ? { company } : undefined }
      );
      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  async getMaterialIssuanceRequestDetails(mirNo?: string, company?: string): Promise<MaterialIssuanceRequestDetail[]> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const url = mirNo 
        ? `${this.baseUrl}/production-dept/material-issuance/get-material-issuance-request-details/${encodeURIComponent(mirNo)}`
        : `${this.baseUrl}/production-dept/material-issuance/get-material-issuance-request-details`;
      const response = await axios.get<{ success: boolean; data: MaterialIssuanceRequestDetail[] }>(
        url,
        { params: company ? { company } : undefined }
      );
      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      throw error;
    }
  }
}
