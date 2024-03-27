import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsDefined } from "class-validator"

export class CreateBlogCategoryDto {
    @ApiProperty()
    @IsDefined()
    name: string

    @ApiPropertyOptional()
    colorCode: string

}


