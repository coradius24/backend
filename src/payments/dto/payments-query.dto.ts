import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { PaymentStatus } from "../enums/payments.enum";
export enum PaymentMethod {
    BKASH_MERCHANT_WEB= 'bkashMerchantWeb',
    BKASH_MANUAL= 'bkashManual',
    CASH= 'cash',
    NAGAD_MERCHANT_WEB= 'nagadMerchantWeb',
    SHURJOPAY= 'shurjo_pay',
    NAGAD_MANUAL= 'nagadManual',
    THIRD_PARTY_GATEWAY= 'third_party_gateway',
    ALL = 'all'
}

export class PaymentsQueryDto {
    @ApiPropertyOptional({enum: PaymentStatus, default: PaymentStatus.COMPLETED})
    @IsEnum(PaymentStatus)
    paymentStage: PaymentStatus

    @ApiPropertyOptional()
    startDate: Date

    @ApiPropertyOptional()
    endDate: Date

    @ApiPropertyOptional({enum: PaymentMethod, default: PaymentMethod.ALL})
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod

    @ApiPropertyOptional()
    search: string

}
