export interface MaterialUtilizationFormData {
  usageDate: string;
  usageRefNo: string;
  machineLineName: string;
  shift: string;
  feedType: string;
  variant: string;
  formulationNo: string;
  batchNo: string;
  remarks: string;
  validatedBy: string;
  weighedBy: string;
}

export interface MaterialUtilizationLineItem {
  id: string;
  itemNo: string;
  itemDescription: string;
  requiredWeight: number;
  weightLoaded: number;
  processType: 'Prepared and Loaded' | 'Oil';
  randomSampled: boolean;
  qaName: string;
}

export interface MaterialUtilizationPayload {
  usageDate: string;
  usageRefNo: string;
  machineLineName: string;
  shift: string;
  feedType: string;
  variant: string;
  formulationNo: string;
  batchNo: string;
  remarks: string;
  validatedBy: string;
  weighedBy: string;
  details: MaterialUtilizationLineItem[];
}

export interface MaterialUtilizationPostResponse {
  success: boolean;
  message?: string;
  usageRefNo?: string;
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
  refreshUsageRefNo: () => Promise<void>;
  setField: (field: keyof MaterialUtilizationFormData, value: string) => void;
  getField: (field: keyof MaterialUtilizationFormData) => string;
}

export interface MaterialUtilizationDetailsRef {
  clear: () => void;
  validate: () => boolean;
}
