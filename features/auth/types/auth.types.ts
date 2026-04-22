export interface UserAccount {
  USERNAME: string;
  USERLEVEL?: string;
  EMPLOYEEID?: string;
  NAME?: string;
  DEPARTMENT?: string;
  JOBTITLE?: string;
  ACTIVE?: number;
  EMAILADD?: string;
  ISADMIN?: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: UserAccount;
  message?: string;
}
