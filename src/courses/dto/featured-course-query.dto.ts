import { ContentType } from './../enums/course.enums';
import {  ApiPropertyOptional } from "@nestjs/swagger";

export class FeaturedCoursesQueryDto   {

    @ApiPropertyOptional({
        type: 'enum',
        enum: ContentType,
        default: 'all'
    })   
    contentType: string;
}