import { ApiProperty } from '@nestjs/swagger';

export class UpdateGalleryPhotoDto  {
    @ApiProperty()
    caption: string

}
