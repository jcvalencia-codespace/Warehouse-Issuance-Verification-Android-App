import axios from 'axios';
import Constants from 'expo-constants';
import { DeptCodeResponse, ItemCodeResponse, TransactionTypeResponse } from '../types/issuance.types';

export interface DropdownOption {
  label: string;
  value: string;
}

export class IssuanceService {
    private static instance: IssuanceService;
    private baseUrl: string;
    private constructor() {
        this.baseUrl = Constants.expoConfig?.extra?.apiUrl || '';
        if (!this.baseUrl) {
            console.warn('⚠️  API URL not configured! Set EXPO_PUBLIC_API_URL in .env or apiUrl in app.json');
        } else {
            console.log('📡 Issuance API URL:', this.baseUrl);
        }
    }

    static getInstance(): IssuanceService {
        if (!IssuanceService.instance) {
            IssuanceService.instance = new IssuanceService();
        }
        return IssuanceService.instance;
    }


    async getDeptCodeByScannedApprover(scannedApprover: string, company?: string): Promise<string | null> {
        try {
            if (!this.baseUrl) {
                throw new Error('API URL not configured');
            }

            const response = await axios.get<DeptCodeResponse>(
                `${this.baseUrl}/supplies/issuance/dept-code/${encodeURIComponent(scannedApprover)}`,
                { params: company ? { company } : undefined }
            );
            if (response.data.success) {
                return response.data.deptCode;
            }
            return null;
        } catch (error) {

            throw error;
        }
    }

    async getNextReferenceNumber(company?: string): Promise<string | null> {
        try {
            if (!this.baseUrl) {
                throw new Error('API URL not configured');
            }

            const response = await axios.get<{ success: boolean; nextReferenceNo: string; message?: string }>(
                `${this.baseUrl}/supplies/issuance/next-reference-number`,
                { params: company ? { company } : undefined }
            );
            if (response.data.success) {
                return response.data.nextReferenceNo;
            }
            return null;
        } catch (error) {
            throw error;
        }
    }

    async getTransactionTypes(company?: string): Promise<DropdownOption[]> {
        if (!this.baseUrl){
            throw new Error ('API URL not configured');
        }
        try {
            const response = await axios.get<TransactionTypeResponse>(
                `${this.baseUrl}/supplies/issuance/get-transaction-type`,
                { params: company ? { company } : undefined }
            );
            if (response.data.success && response.data.transactionTypes.length > 0) {
                return response.data.transactionTypes.map((item) => ({
                    label: item.ISSUANCETYPE.trim(),
                    value: item.ISSUANCETYPE.trim(),
                }));
            }
            return [];
        } catch (error) {
            throw error;
        }
    }

    async getItemCodes(company?: string): Promise<DropdownOption[]> {
        if (!this.baseUrl){
            throw new Error ('API URL not configured');
        }
        try {
            const response = await axios.get<ItemCodeResponse>(
                `${this.baseUrl}/supplies/issuance/get-item-code`,
                { params: company ? { company } : undefined }
            );
            if (response.data.success && response.data.itemCodes.length > 0) {
                return response.data.itemCodes.map((item) => ({
                    label: `${item['ITEM CODE'].trim()} - ${item.DESCRIPTION.trim()}`,
                    value: item['ITEM CODE'].trim(),
                }));
            }
            return [];
        } catch (error) {
            throw error;
        }
    }
}