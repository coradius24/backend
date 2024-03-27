import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CourseSectionDto {

  @ApiProperty()
  title?: string;

  @ApiProperty()
  courseId?: number;

  @ApiPropertyOptional()
  order?: number;

  constructor(partial: Partial<CourseSectionDto>) {
    Object.assign(this, partial);
  }
}

export { CourseSectionDto };
