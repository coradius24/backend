import {  ApiPropertyOptional } from "@nestjs/swagger";

export class StudentFilterDto {
    @ApiPropertyOptional({default: ''})
    search: string

    @ApiPropertyOptional({default: ''})
    status: string

    @ApiPropertyOptional({default: ''})
    isKycVerified: boolean
}
