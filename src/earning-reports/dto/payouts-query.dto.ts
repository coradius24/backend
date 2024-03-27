import {  ApiPropertyOptional } from "@nestjs/swagger";
import { PayoutStatus } from "../enums/earning-report.enum";

export class PayoutsQueryDto {
    @ApiPropertyOptional()
    startDate?: Date

    @ApiPropertyOptional()
    endDate?: Date

    @ApiPropertyOptional({default: ""})
    status?: [PayoutStatus]

    @ApiPropertyOptional({default: ""})
    isReviewed?: boolean

    @ApiPropertyOptional({default: ""})
    search?: string

}
