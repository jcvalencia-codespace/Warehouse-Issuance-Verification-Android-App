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

export interface DepartmentOption {
  success: boolean;
  departments: { DEPARTMENT: string }[];
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

export interface ItemCodeDetails {
  AREA: string;
  DATERECEIVED: string;
  REFERENCENO: string;
  LINENUMBER: number;
  LOTNUMBER: string;
  'ITEM CODE': string;
  UOFM: string;
  QUANTITY: number;
}

export interface AssignQuantityAllocation {
  AREA: string;
  DATERECEIVED: string;
  REFERENCENO: string;
  LINENUMBER: number;
  LOTNUMBER: string;
  ITEMCODE: string;
  UOFM: string;
  AVAILABLE_QUANTITY: number;
  ASSIGNED_QUANTITY: number;
}

export interface AssignQuantityAllocationResponse {
  success: boolean;
  allocations: AssignQuantityAllocation[];
  message?: string;
}

export interface AreaOption {
  AREA: string;
}

export interface ProjectNameOption {
  PROJECTNAME: string;
}

export interface MachineNoOption {
  MACHINENO: string;
}

export interface ValidPersonnel{
  NAME: string;
}

export interface PostIssuanceDetail {
  itemCode: string;
  description?: string;
  quantity: string;
  machineNo: string;
  lotNumber?: string | null;
  uofm?: string | null;
  refNoRecv?: string | null;
  lineNumRecv?: number | null;
  remarks?: string | null;
}

export interface PostIssuancePayload {
  referenceNo: string;
  locnCode: string;
  transactionType: string;
  issuanceType: string;
  dateIssued: string;
  shift: string;
  contactPerson: string;
  transferLocnCode: string;
  projectName: string;
  areaTransfer: string;
  issuedBy: string;
  approvedBy: string;
  timeRequest: string;
  timeIssued: string;
  dateCreated: string;
  dateModified: string;
  userName: string;
  postStatus: number;
  details: PostIssuanceDetail[];
}