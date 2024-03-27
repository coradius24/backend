import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateCourseCertificateDto {
    @ApiProperty()
    userId: number

    @ApiProperty()
    courseId: number

    @ApiPropertyOptional()
    fullName: string
}
