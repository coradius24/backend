import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsDefined } from "class-validator"

export class CreateBlogCommentDto {
    @ApiProperty()
    @IsDefined()
    comment: string

    @ApiProperty()
    @IsDefined()
    blogId: number

}


