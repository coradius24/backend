export enum PayoutStatus   {
    PENDING = 'pending',
    APPROVED = 'approved',
    PAID = 'paid',
    CANCELED = 'canceled',
    REJECTED = 'rejected',
}

export enum PayoutMethod {
    bKash = 'bKash',
    nagad = 'Nagad',
    rocket = 'rocket',
}

export enum PayoutTimePeriod{
    TODAY= 'today',
    THIS_WEEK = 'thisWeek',
    THIS_MONTH = 'thisMonth',
    LAST_MONTH = 'lastMonth',
    SPECIF_MONTH = 'specificMonth',
    DATE_RANGE = 'dateRange'
}