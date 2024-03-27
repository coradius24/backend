import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateFeaturedInstructorDto {
    @ApiProperty()
    userId: number;

    @ApiPropertyOptional()
    serialNumber: number;
}
