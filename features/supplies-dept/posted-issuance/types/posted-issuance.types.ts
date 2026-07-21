export interface PostedIssuance {
  REFERENCENO: number;
  MINO: string;
  LOCNCODE: string;
  TRANSACTIONTYPE: string;
  ISSUANCETYPE: string;
  DATEISSUED: string;
  SHIFT: string;
  CONTACTPERSON: string;
  TRANSFER_LOCNCODE: string;
  PROJECTNAME: string;
  AREATRANSFER: string;
  MACHINENAME: string;
  ISSUEDBY: string;
  APPROVEDBY: string;
  TIMEREQUEST: string;
  TIMEISSUED: string;
  DATECREATED: string;
  DATEMODIFIED: string;
  USERNAME: string;
  POSTSTATUS: number;
  PONUMBER: string;
  WORKORDERNO: string;
  OTHERDOCNO: string;
}

export interface IssuanceDetail {
  REFERENCENO: number;
  REFNORECV: string;
  LOTNUMBER: string;
  ITEMNMBR: string;
  QUANTITY: number;
  UOFM: string;
  MACHINENO: string;
  LINENUMRECV: number;
  REMARKS: string;
  TRANSACTIONTYPE: string;
  ISSUANCETYPE: string;
}

export interface IssuanceDetailResponse {
  success: boolean;
  details?: IssuanceDetail[];
}

export interface PostedIssuanceResponse {
  success: boolean;
  issueduances: PostedIssuance[];
  totalCount: number;
  error?: string;
  message?: string;
}
