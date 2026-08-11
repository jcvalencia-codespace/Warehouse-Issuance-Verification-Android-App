import axios from 'axios';
import Constants from 'expo-constants';

export interface MaterialUtilizationTag {
    TAGID: number;
    IS_TAGGED_IN_QM4D: boolean;
    MODIFIEDBY: string | null;
    DATEMODIFIED: string | null;
}

export class MaterialUtilizationTagService {
    private static instance: MaterialUtilizationTagService;
    private baseUrl: string;
    private tagCache: { company: string | undefined; data: MaterialUtilizationTag[] } | null = null;

    private constructor() {
        this.baseUrl = Constants.expoConfig?.extra?.apiUrl || '';
        if (!this.baseUrl) {
            console.warn('API URL not configured! Set EXPO_PUBLIC_API_URL in .env or apiUrl in app.json');
        } else {
            console.log('Material Utilization Tag API URL:', this.baseUrl);
        }
    }

    static getInstance(): MaterialUtilizationTagService {
        if (!MaterialUtilizationTagService.instance) {
            MaterialUtilizationTagService.instance = new MaterialUtilizationTagService();
        }
        return MaterialUtilizationTagService.instance;
    }

    async getTag(company?: string): Promise<MaterialUtilizationTag[]> {
        if (this.tagCache && this.tagCache.company === company) {
            return this.tagCache.data;
        }
        try {
            if (!this.baseUrl) {
                throw new Error('API URL not configured');
            }
            const response = await axios.get<{ success: boolean; data: MaterialUtilizationTag[] }>(
                `${this.baseUrl}/production-dept/material-utilization-tag/get-tag`,
                { params: company ? { company } : undefined }
            );
            if (response.data.success) {
                this.tagCache = { company, data: response.data.data };
                return response.data.data;
            }
            return [];
        } catch (error) {
            this.tagCache = null;
            throw error;
        }
    }

    async updateTag(payload: { newTagValue: boolean; user: string }, company?: string): Promise<{ success: boolean; message: string }> {
        try {
            if (!this.baseUrl) {
                throw new Error('API URL not configured');
            }
            const response = await axios.put<{ success: boolean; message: string }>(
                `${this.baseUrl}/production-dept/material-utilization-tag/update-tag`,
                payload,
                { params: company ? { company } : undefined }
            );
            this.tagCache = null;
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    invalidateCache() {
        this.tagCache = null;
    }
}

export const materialUtilizationTagService = MaterialUtilizationTagService.getInstance();
