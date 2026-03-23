/**
 * Warehouse Confirmation Types
 */

export interface TransactionDetail {
  QM4DROWID: number;
  'ITEM CODE': string;
  'LOT NUMBER': string;
  UOFM: string;
  'QUANTITY ISS.': number;
  'BAGS ISS.': number;
  UNITCOST: number;
  'QUANTITY RECEIVED': number | null;
  'BAGS RECEIVED': number | null;
  ACTUAL_UNITCOST: number | null;
}

export interface TransactionHeader {
  POSTSTATUS: string;
  TRANSREFNO: string;
  REFERENCENO: string;
  ITEMNMBR: string;
  ISSUEDBY: string;
  DATETRANS: string;
  TRANSTYPE: string;
  UOFM: string;
  QUANTITY_TRANS: number;
  'QUANTITY ISS.': number;
  BAG_TRANS: number;
  UNITCOST: number;
  FROMCOMPANY: string;
  FROMTRANSNO: string;
  FROMLOCNCODE: string;
  RECEIVEDBY?: string;
}

export interface ConfirmationState {
  selectedTransaction: TransactionHeader | null;
  details: TransactionDetail[];
  loading: boolean;
  error: string | null;
}
