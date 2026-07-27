import axios from 'axios';
import Constants from 'expo-constants';
import { MaterialIssuanceRequestDetail, MaterialIssuanceRequestHeaderWithUnserved } from '../types/materialIssuanceConfirmation.types';

export class MaterialIssuanceConfirmationService {
    private static instance: MaterialIssuanceConfirmationService;
    private baseUrl: string;

    private constructor() {
        this.baseUrl = Constants.expoConfig?.extra?.apiUrl || '';
        if (!this.baseUrl) {
            console.warn('⚠️  API URL not configured! Set EXPO_PUBLIC_API_URL in .env or apiUrl in app.json');
        } else {
            console.log('📡 Issuance API URL:', this.baseUrl);
        }
    }

    static getInstance(): MaterialIssuanceConfirmationService {
        if (!MaterialIssuanceConfirmationService.instance) {
            MaterialIssuanceConfirmationService.instance = new MaterialIssuanceConfirmationService();
        }
        return MaterialIssuanceConfirmationService.instance;
    }

    async getMaterialIssuanceRequestHeader(company?: string): Promise<MaterialIssuanceRequestHeaderWithUnserved[]> {
        try {
            if (!this.baseUrl) {
                throw new Error('API URL not configured');
            }
            const response = await axios.get<{ success: boolean; data: MaterialIssuanceRequestHeaderWithUnserved[] }>(
                `${this.baseUrl}/production-dept/material-issuance-confirmation/get-material-issuance-request-header`,
                { params: company ? { company } : undefined }
            );
            if (response.data.success) {
                const rows = response.data.data;
                const grouped = new Map<string, MaterialIssuanceRequestHeaderWithUnserved>();
                for (const row of rows) {
                    const existing = grouped.get(row.MIRNO);
                    if (existing) {
                        existing.unservedCount += 1;
                    } else {
                        grouped.set(row.MIRNO, {
                            MIRNO: row.MIRNO,
                            SHIFT: row.SHIFT,
                            REVIEWEDBY: row.REVIEWEDBY,
                            CREATEDBY: row.CREATEDBY,
                            DATECREATED: row.DATECREATED,
                            POSTSTATUS: row.POSTSTATUS,
                            unservedCount: 1,
                        });
                    }
                }
                return Array.from(grouped.values());
            }
            return [];
        } catch (error) {
            throw error;
        }
    }

    async markItemAsServed(mirNo: string, rowId: string, company?: string): Promise<{ success: boolean }> {
        try {
            if (!this.baseUrl) {
                throw new Error('API URL not configured');
            }
            const response = await axios.put<{ success: boolean; message: string }>(
                `${this.baseUrl}/production-dept/material-issuance-confirmation/mark-as-served`,
                { mirNo, rowId },
                { params: company ? { company } : undefined }
            );
            return { success: response.data.success };
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
                ? `${this.baseUrl}/production-dept/material-issuance-confirmation/get-material-issuance-request-details/${encodeURIComponent(mirNo)}`
                : `${this.baseUrl}/production-dept/material-issuance-confirmation/get-material-issuance-request-details`;
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