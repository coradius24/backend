import { ApiProperty } from "@nestjs/swagger";
import { IsDefined } from "class-validator";

export class UploadGalleryPhotoDto {
    @ApiProperty({
        type: 'string',
        format: 'binary', // Use 'binary' format for file uploads
        description: 'Photo file',
      })
    photo: any;

    @ApiProperty()
    @IsDefined()
    caption: string

    @ApiProperty()
    @IsDefined()
    albumId: number
}
