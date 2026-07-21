/**
 * Posted Issuance Service
 * Handles API calls to fetch posted supplies issuance transactions
 */

import axios from 'axios';
import Constants from 'expo-constants';
import { IssuanceDetail, PostedIssuance, PostedIssuanceResponse } from '../types/posted-issuance.types';

class PostedIssuanceService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = Constants.expoConfig?.extra?.apiUrl || '';
    if (!this.baseUrl) {
      console.warn('API URL not configured! Set EXPO_PUBLIC_API_URL in .env or apiUrl in app.json');
    } else {
      console.log('Posted Issuance API URL:', this.baseUrl);
    }
  }

  async getPostedIssuances(skip = 0, take = 100, year?: number, company?: string): Promise<{ data: PostedIssuance[]; totalCount: number } | null> {
    try {
      if (!this.baseUrl) {
        console.error('API URL not configured');
        return null;
      }

      const params: Record<string, any> = { skip, take };
      if (year) params.year = year;
      if (company) params.company = company;

      const response = await axios.get<PostedIssuanceResponse>(
        `${this.baseUrl}/supplies/issuance/posted-header`,
        {
          params,
          timeout: 100000,
        }
      );

      if (response.data.success && response.data.issueduances) {
        return { data: response.data.issueduances, totalCount: response.data.totalCount ?? response.data.issueduances.length };
      }

      console.error('Failed to fetch posted issuances:', response.data.error || response.data.message);
      return null;
    } catch (error: any) {
      console.error('Error fetching posted issuances:', error.message);
      return null;
    }
  }

  async getPostedIssuanceDetails(referenceNo: string, company?: string): Promise<IssuanceDetail[] | null> {
    try {
      if (!this.baseUrl) {
        console.error('API URL not configured');
        return null;
      }

      const response = await axios.get<{ success: boolean; issueduances: IssuanceDetail[]; error?: string; message?: string }>(
        `${this.baseUrl}/supplies/issuance/posted-details/${encodeURIComponent(referenceNo)}`,
        {
          params: company ? { company } : undefined,
          timeout: 10000,
        }
      );

      if (response.data.success && response.data.issueduances) {
        return response.data.issueduances;
      }

      console.error('Failed to fetch posted issuance details');
      return null;
    } catch (error: any) {
      console.error('Error fetching posted issuance details:', error.message);
      return null;
    }
  }
}

export const postedIssuanceService = new PostedIssuanceService();
