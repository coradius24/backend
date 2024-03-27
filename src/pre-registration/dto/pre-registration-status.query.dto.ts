import { ApiPropertyOptional } from '@nestjs/swagger';
;

export class PreRegistrationStatusQueryDto {
    @ApiPropertyOptional()
    email?: string;

    @ApiPropertyOptional()
    message?: string;
}
