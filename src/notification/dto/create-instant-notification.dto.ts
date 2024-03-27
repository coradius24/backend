import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateCourseNotificationDto {
    @ApiProperty()
    courseIds: [number]

    @ApiProperty()
    message: string

    @ApiPropertyOptional()
    scheduled: Date
}
