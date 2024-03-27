import { ApiPropertyOptional } from "@nestjs/swagger";

export class DuesQueryDto {
    @ApiPropertyOptional()
    courseId: number

    @ApiPropertyOptional()
    search: string

}