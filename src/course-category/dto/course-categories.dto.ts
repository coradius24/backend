import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class SubCategoryDto {
    @ApiProperty()
    name: string;

    @ApiProperty()
    slug: string;

    @ApiProperty()
    thumbnail: string | null;

    @ApiProperty()
    courseCount: number;
}
  
export default class CategoryDto {
    @ApiProperty()
    name: string;

    @ApiProperty()
    slug: string;

    @ApiProperty()
    thumbnail: string | null;

    @ApiProperty()
    courseCount: number;

    @ApiPropertyOptional({ type: () => [SubCategoryDto] }) 
    subCategory?: SubCategoryDto[];
}
