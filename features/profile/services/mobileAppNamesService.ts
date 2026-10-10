import axios from 'axios';
import Constants from 'expo-constants';
import { MobileAppName } from '../types/mobileAppNames.types';

export class MobileAppNamesService {
  private static instance: MobileAppNamesService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = Constants.expoConfig?.extra?.apiUrl || '';
    if (!this.baseUrl) {
      console.warn('API URL not configured! Set EXPO_PUBLIC_API_URL in .env or apiUrl in app.json');
    }
  }

  static getInstance(): MobileAppNamesService {
    if (!MobileAppNamesService.instance) {
      MobileAppNamesService.instance = new MobileAppNamesService();
    }
    return MobileAppNamesService.instance;
  }

  async getMobileAppNames(company?: string): Promise<MobileAppName[]> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const response = await axios.get<{ success: boolean; mobileAppNames?: MobileAppName[] }>(
        `${this.baseUrl}/profile/get-mobile-app-names`,
        { params: company ? { company } : undefined }
      );
      if (response.data.success && response.data.mobileAppNames) {
        return response.data.mobileAppNames;
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  async getMobileAppNamesByLocnCode(company?: string): Promise<string[]> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const response = await axios.get<{ success: boolean; locnCodes?: any[] }>(
        `${this.baseUrl}/profile/get-mobile-app-names-by-locn-code`,
        { params: company ? { company } : undefined }
      );
      if (response.data.success && response.data.locnCodes) {
        return response.data.locnCodes
          .map((r) => r.LOCNCODE)
          .filter((code): code is string => typeof code === 'string' && code.trim().length > 0);
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  async saveMobileAppName(
    payload: { name: string; locnCode: string; createdBy?: string },
    company?: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const response = await axios.post<{ success: boolean; message?: string }>(
        `${this.baseUrl}/profile/save-mobile-app-name`,
        payload,
        { params: company ? { company } : undefined }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async deactivateMobileAppName(
    id: number,
    company?: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      if (!this.baseUrl) {
        throw new Error('API URL not configured');
      }
      const response = await axios.put<{ success: boolean; message?: string }>(
        `${this.baseUrl}/profile/deactivate-mobile-app-name`,
        { id },
        { params: company ? { company } : undefined }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export const mobileAppNamesService = MobileAppNamesService.getInstance();
