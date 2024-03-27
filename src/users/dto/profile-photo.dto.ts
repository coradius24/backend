import { ApiProperty } from '@nestjs/swagger';

export class ProfilePhotoDto {
  @ApiProperty({
    type: 'string',
    format: 'binary', // Use 'binary' format for file uploads
    description: 'Profile photo file',
  })
  file: any; // This should match the property name in your DTO
}
