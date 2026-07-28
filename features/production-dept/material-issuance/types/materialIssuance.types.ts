export interface MaterialIssuanceLineItem {
  itemCode: string;
  description: string;
  quantity: string;
  allocations: MaterialQuantityAllocation[];
}

export interface MaterialQuantityAllocation {
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

export interface MaterialIssuanceDetailsRef {
  clear: () => void;
  refreshItemQuantities: () => Promise<void>;
}

export interface MaterialIssuancePayload {
  mirNo: string;
  shift: string;
  reviewedBy: string;
  createdBy: string;
  dateCreated: string;
  details: MaterialIssuanceLineItem[];
}

export interface MaterialIssuancePostResponse {
  success: boolean;
  message?: string;
  mirNo?: string;
}

export interface MaterialIssuanceRequestHeader {
  MIRNO: string;
  SHIFT: string;
  REVIEWEDBY: string;
  CREATEDBY: string;
  DATECREATED: string;
  POSTSTATUS: number;
}

export interface MaterialIssuanceRequestDetail {
  MIRNO: string;
  ITEMNMBR: string;
  ITEMDESC?: string;
  QUANTITY: number;
  UOFM?: string;
}
