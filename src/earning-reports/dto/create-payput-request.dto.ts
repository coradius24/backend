import { PayoutMethod } from './../enums/earning-report.enum';
import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsEnum, IsNumber, Min } from "class-validator";

// samiuli437	$8.88
export class CreatePayoutRequestDto {
    @ApiProperty()
    @IsNumber()
    @IsDefined()
    @Min(5)
    amount: number

    @ApiProperty()
    @IsDefined()
    accountNumber: string

    @ApiProperty()
    @IsDefined()
    @IsEnum(PayoutMethod)
    payoutMethod: PayoutMethod
}
