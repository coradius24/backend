import { ApiPropertyOptional } from "@nestjs/swagger";

export class EnrollmentSpikesQueryDto{
    @ApiPropertyOptional()
    startDate: Date

    @ApiPropertyOptional()
    endDate: Date
}