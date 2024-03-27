import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { ContentType, CourseStatus } from "../enums/course.enums";

export class CourseNamesDto{
    @ApiPropertyOptional({
        enum: CourseStatus
    })
    @IsOptional()
    status: CourseStatus

    @ApiPropertyOptional({
        enum: ContentType
    })
    @IsOptional()
    contentType: ContentType

    @ApiPropertyOptional()
    @IsOptional()
    isMainCourse: boolean
}