import {  ApiPropertyOptional } from "@nestjs/swagger";

export class AdminFilterDto {
    @ApiPropertyOptional({default: ''})
    search: string

    @ApiPropertyOptional({default: ''})
    status: string

    @ApiPropertyOptional({default: ''})
    role: number

    @ApiPropertyOptional({default: ''})
    isKycVerified: boolean
}
