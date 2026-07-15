export interface UserAccount {
  USERNAME: string;
  USERLEVEL?: string;
  EMPLOYEEID?: string;
  NAME?: string;
  DEPARTMENT?: string;
  DEPTCODE?: string;
  JOBTITLE?: string;
  ACTIVE?: number;
  EMAILADD?: string;
  ISADMIN?: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginHistoryRequest {
  ipAddress: string;
  system: string;
  userName: string;
  name: string;
  company: string;
}

export interface LoginHistoryResponse {
  success: boolean;
  message?: string;
}

export interface LoginResponse {
  success: boolean;
  user: UserAccount;
  message?: string;
}
