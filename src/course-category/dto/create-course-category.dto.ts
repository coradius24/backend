import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateCourseCategoryDto {
    @ApiProperty()
    name: string;

    @ApiPropertyOptional()
    colorCode: string;

    @ApiPropertyOptional()
    icon: string;

    @ApiPropertyOptional()
    parent: number;

}
