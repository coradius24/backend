import { IsDefined, IsEnum } from 'class-validator';
import { PaymentMethod } from './../enums/payments.enum';
import {  ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreatePaymentByAdminDto {
    @ApiProperty()
    @IsDefined()
    courseId: number

    @ApiProperty()
    amount: number

    @ApiProperty()
    @IsDefined()
    userId: number

    @ApiProperty()
    couponApplied: string

    @ApiPropertyOptional()
    transactionId?: string

    @ApiProperty({enum: PaymentMethod, default: PaymentMethod.CASH})
    @IsDefined()
    @IsEnum(PaymentMethod)
    paymentMethod?: string

    @ApiPropertyOptional()
    bankName: string

}
