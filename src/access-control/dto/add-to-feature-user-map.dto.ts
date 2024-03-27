import { ApiProperty } from "@nestjs/swagger";
import { IsDefined } from "class-validator";

export class AddToFeatureUserMapDto {
    @ApiProperty()
    @IsDefined()
    featureId: string

    @ApiProperty()
    @IsDefined()
    userId: number
}
