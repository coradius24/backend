import { ApiProperty } from "@nestjs/swagger";
import {  IsArray, IsDefined, IsOptional } from "class-validator";

export class UpdateFeatureUserMapDto {
    @ApiProperty()
    @IsDefined()
    @IsArray()
    @IsOptional()
    featureIds: string[]

    @ApiProperty()
    @IsDefined()
    userId: number
}
