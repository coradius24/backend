import {  ApiPropertyOptional } from "@nestjs/swagger";
import { PayoutTimePeriod } from "../enums/earning-report.enum";

export class PayoutStatsDto{
    @ApiPropertyOptional({type: 'enum', enum: PayoutTimePeriod})
    timePeriod: string

    @ApiPropertyOptional({ description: 'Only  use timePeriod: ' + PayoutTimePeriod.SPECIF_MONTH + ', this need: Date '})
    specificMonth: Date

    @ApiPropertyOptional({ description: 'Only use when you want dateRange filter, for this must use timePeriod: ' + PayoutTimePeriod.DATE_RANGE})
    startDate: Date

    @ApiPropertyOptional({ description: 'Only use when you want dateRange filter, for this must use timePeriod: ' + PayoutTimePeriod.DATE_RANGE})
    endDate: Date

}