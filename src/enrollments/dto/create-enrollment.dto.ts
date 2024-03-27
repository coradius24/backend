import { ApiProperty } from "@nestjs/swagger";

export class CreateEnrollmentDto {
    @ApiProperty()
    courseId: number

    @ApiProperty()
    userId: number
}
