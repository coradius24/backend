import { ApiPropertyOptional } from "@nestjs/swagger";

export class UserNotificationQueryDto {
    @ApiPropertyOptional({default: 10})
    limit?: number

    @ApiPropertyOptional({default: ''})
    cursor?: Date
    
}
