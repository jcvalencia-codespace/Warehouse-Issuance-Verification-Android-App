/**
 * Issuance Verification Types
 * Type definitions for the issuance verification form
 */

export interface IssuanceVerificationFormData {
  transactionRefNumber: string;
  area: string;
  itemNumber: string;
  itemRemarks: string;
  lotNumber: string;
  numberOfBags: number | null;
  weightInKg: number | null;
  forkliftOperator: string;
  floorScale: string;
  transType: string;
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
  itemNumber?: string;
  remarks?: string | null;
  lotNumber?: string;
}

export type FormStatus = 'idle' | 'saving' | 'posting' | 'saved' | 'posted' | 'error';

export interface FormErrors {
  transactionRefNumber?: string;
  area?: string;
  itemNumber?: string;
  lotNumber?: string;
  numberOfBags?: string;
  weightInKg?: string;
  forkliftOperator?: string;
  floorScale?: string;
  allocationError?: string;
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
