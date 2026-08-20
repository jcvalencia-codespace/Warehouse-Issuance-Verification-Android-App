export interface MaterialIssuanceRequestReviewHeader {
    MIRNO: string;
    SHIFT?: string;
    REVIEWEDBY?: string;
    CREATEDBY?: string;
    DATECREATED?: string;
    POSTSTATUS?: number;
    IS_APPROVED?: boolean | null;
    [key: string]: any;
}

export interface MaterialIssuanceRequestReviewDetail {
    MIRNO: string;
    ITEMNMBR: string;
    ITEMDESC?: string | null;
    QUANTITY?: number;
    UOFM?: string | null;
    SERVEDBY?: string | null;
    CREATEDBY?: string | null;
    DATECREATED?: string | null;
    [key: string]: any;
}
