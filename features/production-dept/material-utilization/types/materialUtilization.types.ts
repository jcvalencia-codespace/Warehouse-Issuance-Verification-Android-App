export interface MaterialUtilizationFormData {
  usageDate: string;
  usageNo: string;
  machineLineName: string;
  shift: string;
  feedType: string;
  variant: string;
  formulationNo: string;
  batchNo: number;
  remarks: string;
  transType: number;
}

export interface MaterialUtilizationLineItem {
  id: string;
  itemNo: string;
  itemDescription: string;
  requiredWeight: number;
  weightLoaded: number;
  processType: 'Prepared and Loaded' | 'Oil';
  randomSampled: number;
  qaName: string;
  remarks: string;
}
export interface MaterialUtilizationBaseItemDetails {
  id: string;
  itemNo: string;
  itemDescription: string;
  requiredWeight: number;
  isAutoDosing?: number;
}

export interface MaterialUtilizationSubDetail {
  pudRowId: number;
  qm4dRowId: number;
  fromIssuanceNoId: number;
  itemNo: string;
  lotNumber: string;
  qtyOut: number;
  bagsOut: number;
}

export interface MaterialUtilizationPayload {
  usageDate: string;
  usageNo: string;
  usageRefNo?: string | null;
  machineLineName: string;
  shift: string;
  feedType: string;
  variant: string;
  formulationNo: string;
  batchNo: number;
  remarks: string;
  transType: number;
  user: string;
  baseDetails: MaterialUtilizationBaseItemDetails[];
  details?: MaterialUtilizationLineItem[];
  batchDetails?: number;
  validatedBy?: string | null;
  weighedBy?: string | null;
  subDetails?: MaterialUtilizationSubDetail[];
}

export interface MaterialUtilizationPostResponse {
  success: boolean;
  message?: string;
  usageNo?: string;
}

export interface FormulationMaterial {
  itemNo: string;
  itemDescription: string;
  requiredWeight: number;
}

export interface DropdownOption {
  label: string;
  value: string;
  description?: string;
}

export interface FeedTypeVariantRow {
  ITEMNMBR: string;
  ITEMDESC: string;
  VARIANTCODE: string;
  KGSPERBAG: number;
}

export interface MaterialUtilizationHeaderRef {
  submit: () => void;
  clear: () => void;
  refreshusageNo: () => Promise<void>;
  setField: (field: keyof MaterialUtilizationFormData, value: string | number) => void;
  getField: (field: keyof MaterialUtilizationFormData) => string | number;
}

export interface MaterialUtilizationDetailsRef {
  clear: () => void;
  validate: () => boolean;
  getSubDetails: () => MaterialUtilizationSubDetail[];
}
