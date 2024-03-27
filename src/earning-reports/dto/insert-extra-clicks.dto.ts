import { PayoutMethod } from '../enums/earning-report.enum';
import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsEnum, IsNumber, Max, Min } from "class-validator";

// samiuli437	$8.88
export class InsertExtraClicksDto {
    @ApiProperty()
    @IsNumber()
    @Min(1)
    @Max(10000)
    clickCount: number

    @ApiProperty()
    @IsDefined()
    shortLinkSlug: string

}
