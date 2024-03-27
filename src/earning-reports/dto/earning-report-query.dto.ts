import {  ApiPropertyOptional } from "@nestjs/swagger";

// samiuli437	$8.88
export class EarningReportQueryDto {
    @ApiPropertyOptional()
    startDate?: Date

    @ApiPropertyOptional()
    endDate?: Date

    @ApiPropertyOptional()
    search?: string
}
