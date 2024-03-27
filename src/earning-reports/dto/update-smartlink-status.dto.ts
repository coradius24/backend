import { ApiProperty } from "@nestjs/swagger";
import {  IsEnum } from "class-validator";

enum ShortLinkStatus {
    active = 'active',
    blocked = 'blocked',
}
// samiuli437	$8.88
export class UpdateSmartLinkStatusDto {

    @ApiProperty({ enum: ShortLinkStatus })
    @IsEnum(ShortLinkStatus)
    status: ShortLinkStatus


}
