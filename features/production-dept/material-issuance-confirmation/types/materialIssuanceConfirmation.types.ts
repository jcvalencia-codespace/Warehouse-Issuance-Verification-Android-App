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
  IS_SERVED?: number;
}

export interface MaterialIssuanceRequestHeaderWithUnserved extends MaterialIssuanceRequestHeader {
  unservedCount: number;
}
