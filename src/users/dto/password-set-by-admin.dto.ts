import { ApiProperty } from "@nestjs/swagger";
import { IsDefined } from "class-validator";

export class PasswordSetByAdminDto{
    @ApiProperty()
    @IsDefined()
    password: string
}