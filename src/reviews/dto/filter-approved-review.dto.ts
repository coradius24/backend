import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterApprovedReviewDto{
  @ApiPropertyOptional({default: 'include'})
  summary?: string

  @ApiPropertyOptional({default: 'all'})
  rating?: string

  @ApiPropertyOptional({default: 'all'})
  courseId?: string
}