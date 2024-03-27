import {  ApiPropertyOptional } from "@nestjs/swagger";

export class EnrollmentQueryDto {
    @ApiPropertyOptional()
    courseId: number

    @ApiPropertyOptional()
    search: string
}
