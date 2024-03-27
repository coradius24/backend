import { ApiPropertyOptional } from "@nestjs/swagger";

export class PreRegistrationQueryDto {
    @ApiPropertyOptional({default: false})
    isArchived: boolean

    @ApiPropertyOptional()
    startDate: Date

    @ApiPropertyOptional()
    endDate: Date

}
