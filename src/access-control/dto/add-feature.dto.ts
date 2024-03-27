import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDefined, IsEnum, IsOptional } from "class-validator";

enum HTTPMethod {
    'get' = 'get',
    'post' = 'post',
    'put'  = 'put',
     'patch' = 'patch',
    'delete' = 'delete'
}
export class AddFeatureDto {
    @ApiProperty()
    @IsDefined()
    name: string

    @ApiPropertyOptional()
    frontendUrl?: string

    @ApiPropertyOptional()
    frontendSectionGroup?: string

    @ApiPropertyOptional()
    endpoint?: string

    @ApiPropertyOptional({enum: HTTPMethod})
    @IsEnum(HTTPMethod)
    @IsOptional()
    httpMethod?: string

    @ApiPropertyOptional()
    parent?: number;
}
