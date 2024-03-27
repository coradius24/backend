import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class PushTokenDto {

    @ApiProperty()
    token: string

    @ApiPropertyOptional()
    device: string

}
