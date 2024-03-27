import {  ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateReviewerStatusDto {

    @ApiPropertyOptional({default: false})
    reject: boolean

    @ApiPropertyOptional({default: ""}) 
    reviewerMessage: string

    // @ApiPropertyOptional({type: 'boolean' , default: true, description: "Send mail on  Rejection"})
    // sendMail: boolean
}
