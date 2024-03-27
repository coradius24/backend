import {  ApiProperty } from "@nestjs/swagger";

export class CreatePaymentDto {
    @ApiProperty()
    courseId: number

    @ApiProperty()
    amount: number

    @ApiProperty()
    couponApplied: string

}
