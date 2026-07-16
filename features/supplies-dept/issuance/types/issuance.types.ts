export interface IssuanceFormData {
  referenceNumber: string;
  issuanceRefNumber: string;
  transactionRefNumber: string;
  transactionType: string;
  date: string;
  contactPerson: string;
  issuedBy: string;
  approvedBy: string;
  deptCode: string;
  area: string;
}

export interface DeptCodeResponse {
  success: boolean;
  deptCode: string;
  message?: string;
}

export interface TransactionTypeResponse {
  success: boolean;
  transactionTypes: { ISSUANCETYPE: string }[];
  message?: string;
}

export interface ItemCodeResponse {
  success: boolean;
  itemCodes: { 'ITEM CODE': string; DESCRIPTION: string }[];
  message?: string;
}