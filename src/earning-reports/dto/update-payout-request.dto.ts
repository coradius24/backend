import {  PayoutStatus } from '../enums/earning-report.enum';
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDefined, IsEnum,  } from "class-validator";

// samiuli437	$8.88
export class UpdatePayoutRequestDto {

    @ApiProperty()
    @IsDefined()
    @IsEnum(PayoutStatus)
    payoutStatus: PayoutStatus

    // @ApiPropertyOptional({type: 'boolean' , default: true, description: "Send mail on Approve or Rejection"})
    // sendMail: boolean
}
