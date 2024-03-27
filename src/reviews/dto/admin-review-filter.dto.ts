import { ApiPropertyOptional } from '@nestjs/swagger';
export class AdminReviewFilterDto {
  @ApiPropertyOptional({default: 'all'})
  status?: string

  @ApiPropertyOptional({default: 'include'})
  summary?: string

  @ApiPropertyOptional({default: 'all'})
  rating?: string

  @ApiPropertyOptional({default: 'all'})
  courseId?: string
}