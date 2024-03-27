import { CouponDiscountType, CouponScope, CouponPurpose } from './../entities/coupon.entity';
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDefined, IsEnum } from "class-validator";
import { Transform } from 'class-transformer';
const oneWeekFromNow = new Date();
oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);


export class CreateCouponDto {
    @ApiProperty()   
    @IsDefined()
    code: string

    @ApiProperty()   
    @IsDefined()
    discountAmount: number

    @ApiProperty({default: CouponDiscountType.FLAT})   
    @IsDefined()
    @IsEnum(CouponDiscountType)
    discountType: CouponDiscountType

    @ApiProperty({default: CouponScope.ALL_COURSES})   
    @IsDefined()
    @IsEnum(CouponScope)
    scope: CouponScope

    @ApiProperty({default: CouponPurpose.GENERAL})   
    @IsEnum(CouponPurpose)
    purpose: CouponPurpose

    @ApiPropertyOptional({default: new Date()})   
    startDate: Date

    @ApiPropertyOptional({default: []})   
    courseIds: [number]

    @ApiPropertyOptional({default: oneWeekFromNow})   
    expiry: Date
    
}