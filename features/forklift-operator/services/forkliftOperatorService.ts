import axios from 'axios';
import Constants from 'expo-constants';
import {
  ForkliftOperatorParams,
  ForkliftOperatorResponse,
  CreateForkliftOperatorPayload,
  UpdateForkliftOperatorPayload,
  ForkliftOperator,
} from '../types/forkliftOperator.types';

export class ForkliftOperatorService {
  private static instance: ForkliftOperatorService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = Constants.expoConfig?.extra?.apiUrl || '';
    if (!this.baseUrl) {
      console.warn('⚠️  API URL not configured! Set EXPO_PUBLIC_API_URL in .env or apiUrl in app.json');
    } else {
      console.log('📡 Forklift Operator API URL:', this.baseUrl);
    }
  }

  static getInstance(): ForkliftOperatorService {
    if (!ForkliftOperatorService.instance) {
      ForkliftOperatorService.instance = new ForkliftOperatorService();
    }
    return ForkliftOperatorService.instance;
  }

  async getForkliftOperators(
    params?: ForkliftOperatorParams
  ): Promise<ForkliftOperatorResponse> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }

      const queryParams = new URLSearchParams();

      if (params?.search) {
        queryParams.append('search', params.search);
      }
      if (params?.isActive !== undefined) {
        queryParams.append('isActive', params.isActive.toString());
      }

      const queryString = queryParams.toString();
      const url = `${this.baseUrl}/forklift-operators${queryString ? `?${queryString}` : ''}`;

      const response = await axios.get(url);

      if (response.data.success) {
        return response.data as ForkliftOperatorResponse;
      }

      return {
        success: false,
        data: [],
        message: response.data.message || 'Failed to fetch forklift operators'
      };
    } catch (error) {
      console.error('Error fetching forklift operators:', error);
      throw error;
    }
  }

  async getForkliftOperatorById(
    rowId: number
  ): Promise<{ success: boolean; data: ForkliftOperator | null; message?: string }> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }

      const response = await axios.get(`${this.baseUrl}/forklift-operators/${rowId}`);

      if (response.data.success) {
        return response.data;
      }

      return {
        success: false,
        data: null,
        message: response.data.message || 'Failed to fetch forklift operator'
      };
    } catch (error) {
      console.error('Error fetching forklift operator:', error);
      throw error;
    }
  }

  async createForkliftOperator(
    payload: CreateForkliftOperatorPayload
  ): Promise<{ success: boolean; data?: ForkliftOperator; message?: string }> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }

      const response = await axios.post(`${this.baseUrl}/forklift-operators`, payload);

      if (response.data.success) {
        return response.data;
      }

      return {
        success: false,
        message: response.data.message || 'Failed to create forklift operator'
      };
    } catch (error) {
      console.error('Error creating forklift operator:', error);
      throw error;
    }
  }

  async updateForkliftOperator(
    rowId: number,
    payload: UpdateForkliftOperatorPayload
  ): Promise<{ success: boolean; data?: ForkliftOperator; message?: string }> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }

      const response = await axios.put(
        `${this.baseUrl}/forklift-operators/${rowId}`,
        payload
      );

      if (response.data.success) {
        return response.data;
      }

      return {
        success: false,
        message: response.data.message || 'Failed to update forklift operator'
      };
    } catch (error) {
      console.error('Error updating forklift operator:', error);
      throw error;
    }
  }

  async deleteForkliftOperator(
    rowId: number
  ): Promise<{ success: boolean; message?: string }> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }

      const response = await axios.delete(`${this.baseUrl}/forklift-operators/${rowId}`);

      if (response.data.success) {
        return response.data;
      }

      return {
        success: false,
        message: response.data.message || 'Failed to delete forklift operator'
      };
    } catch (error) {
      console.error('Error deleting forklift operator:', error);
      throw error;
    }
  }

  async toggleForkliftOperatorStatus(
    rowId: number,
    isActive: boolean
  ): Promise<{ success: boolean; message?: string }> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }

      const response = await axios.patch(
        `${this.baseUrl}/forklift-operators/${rowId}/toggle-status`,
        { IS_ACTIVE: isActive }
      );

      if (response.data.success) {
        return response.data;
      }

      return {
        success: false,
        message: response.data.message || 'Failed to toggle forklift operator status'
      };
    } catch (error) {
      console.error('Error toggling forklift operator status:', error);
      throw error;
    }
  }
}

export const forkliftOperatorService = ForkliftOperatorService.getInstance();