import axios from 'axios';
import Constants from 'expo-constants';
import { MaterialIssuanceRequestReviewDetail, MaterialIssuanceRequestReviewHeader } from '../types/materialIssuanceRequestReview.types';

export class MaterialIssuanceRequestReviewService {
    private static instance: MaterialIssuanceRequestReviewService;
    private baseUrl: string;

    private constructor() {
        this.baseUrl = Constants.expoConfig?.extra?.apiUrl || '';
        if (!this.baseUrl) {
            console.warn('⚠️  API URL not configured! Set EXPO_PUBLIC_API_URL in .env or apiUrl in app.json');
        } else {
            console.log('📡 Issuance Request Review API URL:', this.baseUrl);
        }
    }

    static getInstance(): MaterialIssuanceRequestReviewService {
        if (!MaterialIssuanceRequestReviewService.instance) {
            MaterialIssuanceRequestReviewService.instance = new MaterialIssuanceRequestReviewService();
        }
        return MaterialIssuanceRequestReviewService.instance;
    }

    async getRequestHeaders(company?: string): Promise<MaterialIssuanceRequestReviewHeader[]> {
        try {
            if (!this.baseUrl) {
                throw new Error('API URL not configured');
            }
            const response = await axios.get<{ success: boolean; data: MaterialIssuanceRequestReviewHeader[] }>(
                `${this.baseUrl}/production-dept/material-issuance-request-review/get-request-header`,
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

    async getRequestDetails(mirNo: string, company?: string): Promise<MaterialIssuanceRequestReviewDetail[]> {
        try {
            if (!this.baseUrl) {
                throw new Error('API URL not configured');
            }
            const response = await axios.get<{ success: boolean; data: MaterialIssuanceRequestReviewDetail[] }>(
                `${this.baseUrl}/production-dept/material-issuance-request-review/get-request-details/${encodeURIComponent(mirNo)}`,
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

    async approveRequest(mirNo: string, user?: string, company?: string): Promise<{ success: boolean; message: string }> {
        try {
            if (!this.baseUrl) {
                throw new Error('API URL not configured');
            }
            const response = await axios.put<{ success: boolean; message: string }>(
                `${this.baseUrl}/production-dept/material-issuance-request-review/approve-request`,
                { mirNo, user },
                { params: company ? { company } : undefined }
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async rejectRequest(mirNo: string, user?: string, company?: string, remarks?: string): Promise<{ success: boolean; message: string }> {
        try {
            if (!this.baseUrl) {
                throw new Error('API URL not configured');
            }
            const response = await axios.put<{ success: boolean; message: string }>(
                `${this.baseUrl}/production-dept/material-issuance-request-review/reject-request`,
                { mirNo, user, remarks },
                { params: company ? { company } : undefined }
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

export const materialIssuanceRequestReviewService = MaterialIssuanceRequestReviewService.getInstance();
