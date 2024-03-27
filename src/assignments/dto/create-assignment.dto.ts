import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDefined } from "class-validator";

export class CreateAssignmentDto {
    @ApiProperty()
    @IsDefined()
    name: string

    @ApiPropertyOptional()
    description: string

    @ApiProperty()
    @IsDefined()
    courseId: number
}
