export interface MaterialIssuanceRequestHeader {
  MIRNO: string;
  SHIFT: string;
  REVIEWEDBY: string;
  CREATEDBY: string;
  DATECREATED: string;
  POSTSTATUS: number;
}

export interface MaterialIssuanceRequestDetail {
  ROWID: number;
  MIRNO: string;
  DATECREATED: string;
  ITEMNMBR: string;
  ITEMDESC?: string;
  QUANTITY: number;
  UOFM?: string;
  IS_SERVED?: number;
  IS_PREPARING?: number;
  IS_PREPARED?: number;
  REMARKS?: string;
}

export interface MaterialIssuanceRequestHeaderWithUnserved extends MaterialIssuanceRequestHeader {
  unservedCount: number;
}
