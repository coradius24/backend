import { ApiProperty } from '@nestjs/swagger';

export class CourseCategoryThumbnailDto {
  @ApiProperty({
    type: 'string',
    format: 'binary', 
    description: 'Thumbnail',
  })
  file: any; 
}
