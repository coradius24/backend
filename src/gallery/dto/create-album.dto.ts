import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDefined } from "class-validator";

export class CreateAlbumDto {
    @ApiProperty({})
    @IsDefined()
    name: string


    @ApiPropertyOptional({})
    @IsDefined()
    shortDescription: string

    @ApiProperty({
        type: 'string',
        format: 'binary', // Use 'binary' format for file uploads
        description: 'Photo file',
      })
    thumbnail: any;
}
