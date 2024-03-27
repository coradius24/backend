import { ApiProperty } from '@nestjs/swagger';

export class FileUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary', // Use 'binary' format for file uploads
    description: 'File upload',
  })
  file: any; // This should match the property name in your DTO
}
