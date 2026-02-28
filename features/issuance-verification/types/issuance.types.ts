/**
 * Issuance Verification Types
 * Type definitions for the issuance verification form
 */

export interface IssuanceVerificationFormData {
  transactionRefNumber: string;
  area: string;
  itemNumber: string;
  numberOfBags: number | null;
  weightInKg: number | null;
}

export interface IssuanceVerificationFormProps {
  // onSave?: (data: IssuanceVerificationFormData) => void;
  onPost?: (data: IssuanceVerificationFormData) => void;
  onCancel?: () => void;
  initialData?: Partial<IssuanceVerificationFormData>;
  isLoading?: boolean;
}

export interface AreaOption {
  label: string;
  value: string;
}

// Predefined area options for dropdown
export const AREA_OPTIONS: AreaOption[] = [
  { label: 'Warehouse A - Main Storage', value: 'WAREHOUSE_A' },
  { label: 'Warehouse B - Secondary Storage', value: 'WAREHOUSE_B' },
  { label: 'Loading Dock 1', value: 'LOADING_DOCK_1' },
  { label: 'Loading Dock 2', value: 'LOADING_DOCK_2' },
  { label: 'Cold Storage Area', value: 'COLD_STORAGE' },
  { label: 'Bulk Storage Zone', value: 'BULK_STORAGE' },
  { label: 'Quarantine Area', value: 'QUARANTINE' },
  { label: 'Dispatch Area', value: 'DISPATCH' },
];

export type FormStatus = 'idle' | 'saving' | 'posting' | 'saved' | 'posted' | 'error';

export interface FormErrors {
  transactionRefNumber?: string;
  area?: string;
  itemNumber?: string;
  numberOfBags?: string;
  weightInKg?: string;
}

// Bag Allocation Types
export interface BagAllocationItem {
  AREA: string;
  LOTNUMBER: string;
  ITEMNMBR: string;
  UOFM: string;
  REMARKS: string;
  QM_IDNUMBER: string;
  AVEWT: number;
  'AVAILABLE BAGS': number;
  'AVAILABLE KGS': number;
  BAGS: number | null;
  KGS: number | null;
  TAG: string;
}

export interface BagAllocationResponse {
  success: boolean;
  data: BagAllocationItem[];
  totalAvailableBags?: number;
  totalAvailableKgs?: number;
  message?: string;
}
