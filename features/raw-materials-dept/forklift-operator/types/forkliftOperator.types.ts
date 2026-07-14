export interface ForkliftOperator {
  ROWID: number;
  FORKLIFT_OPERATOR: string;
  IS_ACTIVE: boolean;
  DATECREATED: string;
  CREATEDBY: string;
  MODIFIEDDATE: string;
  MODIFIEDBY: string;
}

export interface ForkliftOperatorParams {
  search?: string;
  isActive?: boolean;
}

export interface ForkliftOperatorResponse {
  success: boolean;
  data: ForkliftOperator[];
  count?: number;
  message?: string;
}

export interface CreateForkliftOperatorPayload {
  FORKLIFT_OPERATOR: string;
  IS_ACTIVE?: boolean;
}

export interface UpdateForkliftOperatorPayload {
  FORKLIFT_OPERATOR?: string;
  IS_ACTIVE?: boolean;
}