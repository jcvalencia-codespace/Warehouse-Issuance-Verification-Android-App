import axios from 'axios';
import Constants from 'expo-constants';
import {
    AreaOption,
    AssignQuantityAllocation,
    AssignQuantityAllocationResponse,
    DeptCodeResponse,
    ItemCodeDetails,
    ItemCodeResponse,
    ProjectNameOption,
    TransactionTypeResponse
} from '../types/issuance.types';

export interface DropdownOption {
    label: string;
    value: string;
    description?: string;
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
        if (!this.baseUrl) {
            throw new Error('API URL not configured');
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
        if (!this.baseUrl) {
            throw new Error('API URL not configured');
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
                    description: item.DESCRIPTION.trim(),
                }));
            }
            return [];
        } catch (error) {
            throw error;
        }
    }

    async getItemCodeDetails(itemCode: string, company?: string): Promise<ItemCodeDetails[]> {
        try {
            if (!this.baseUrl) {
                throw new Error('API URL not configured');
            }
            const response = await axios.get<{ success: boolean; itemDetails: ItemCodeDetails[] }>(
                `${this.baseUrl}/supplies/issuance/get-item-details/${encodeURIComponent(itemCode)}`,
                { params: company ? { company } : undefined }
            );
            if (response.data.success) {
                return response.data.itemDetails;
            }
            return [];
        } catch (error) {
            throw error;
        }
    }

    async getAssignQuantityAllocation(itemCode: string, assignedQty: number, company?: string): Promise<AssignQuantityAllocation[]> {
        try {
            if (!this.baseUrl) {
                throw new Error('API URL not configured');
            }
            const response = await axios.get<AssignQuantityAllocationResponse>(
                `${this.baseUrl}/supplies/issuance/get-assigned-quantity-allocation/${encodeURIComponent(itemCode)}`,
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

    async getAreaOption(department: string, company?: string): Promise<AreaOption[]> {
        try {
            if (!this.baseUrl) {
                throw new Error('API URL not configured');
            }
            const response = await axios.get<{ success: boolean; areas: AreaOption[] }>(
                `${this.baseUrl}/supplies/issuance/get-area-option/${encodeURIComponent(department)}`,
                { params: company ? { company } : undefined }
            );
            if (response.data.success) {
                return response.data.areas;
            }
            return [];
        } catch (error) {
            throw error;
        }
    }

    async getProjectNameOption(department: string, area: string, company?: string): Promise<ProjectNameOption[]> {
        try {
            if (!this.baseUrl) {
                throw new Error('API URL not configured');
            }
            const response = await axios.get<{ success: boolean; projects: ProjectNameOption[] }>(
                `${this.baseUrl}/supplies/issuance/get-project-name/${encodeURIComponent(department)}/${encodeURIComponent(area)}`,
                { params: company ? { company } : undefined }
            );
            if (response.data.success) {
                return response.data.projects;
            }
            return [];
        } catch (error) {
            throw error;
        }
    }

    async isMonthPosted(month: number, year: number, company?: string): Promise<boolean> {
        try {
            if (!this.baseUrl) {
                throw new Error('API URL not configured');
            }
            const response = await axios.get<{ success: boolean; isPosted: boolean }>(
                `${this.baseUrl}/supplies/issuance/is-month-posted/PAWHSP/${month}/${year}`,
                { params: company ? { company } : undefined }
            );
            return response.data.success ? !!response.data.isPosted : false;
        } catch (error) {
            throw error;
        }
    }
}