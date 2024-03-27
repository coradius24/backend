import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsDefined } from "class-validator"

export class CreateBlogDto {
    @ApiProperty()
    @IsDefined()
    title: string

    @ApiProperty()
    @IsDefined()
    body: string

    @ApiProperty()
    categoryId: number

    @ApiProperty()
    authorId: number

    @ApiPropertyOptional()
    thumbnailId: number


    @ApiPropertyOptional()
    metaDescription: string

    @ApiPropertyOptional()
    metaKeywords: string

 
    
}


