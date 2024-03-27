import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsNumber } from "class-validator";

export class UpdateSeenCountDto {
    @ApiProperty()
    @IsNumber()
    @IsDefined()
    count: number
}
