import {  ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class CatalogQueryDto {
    @ApiPropertyOptional({default: -1})
    @IsOptional()
    role?: number
}
