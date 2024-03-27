export enum PaymentMethod {
    BKASH_MERCHANT_WEB= 'bkashMerchantWeb',
    BKASH_MANUAL= 'bkashManual',
    ROCKET_MANUAL= 'rocketManual',
    BANK_MANUAL= 'bankManual',
    CASH= 'cash',
    NAGAD_MERCHANT_WEB= 'nagadMerchantWeb',
    SHURJOPAY= 'shurjo_pay',
    NAGAD_MANUAL= 'nagadManual',
    THIRD_PARTY_GATEWAY= 'third_party_gateway',
}

export enum PaymentStatus {
    INITIALIZED = 'initialized',
    COMPLETED = 'completed',
    REJECTED = 'rejected'
}