import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsEnum } from "class-validator";
import { ROLE } from "src/users/enums/user.enums";

export class AddToFeatureRoleMapDto {
    @ApiProperty()
    @IsDefined()
    featureId: number

    @ApiProperty({enum: ROLE})
    @IsDefined()
    @IsEnum(ROLE)
    role: number
}
