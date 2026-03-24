/**
 * Stock Balance Types
 * Type definitions for stock balance module
 */

export interface StockBalanceItem {
  AREA: string;
  ITEMNMBR: string;
  REMARKS: string;
  LOTNUMBER: string;
  UOFM: string;
  AVEWT: number;
  'AVAILABLE BAGS': number;
  'AVAILABLE KGS': number;
  RECEIVEDDATE: string;
}

export interface StockBalanceResponse {
  success: boolean;
  data: StockBalanceItem[];
  count?: number;
  message?: string;
}

export interface StockBalanceParams {
  locncode?: string;
  search?: string;
  area?: string;
  itemNumber?: string;
  receivedDate?: string;
}
