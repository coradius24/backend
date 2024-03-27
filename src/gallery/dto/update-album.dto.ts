import { CreateAlbumDto } from './create-album.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateAlbumDto extends PartialType(CreateAlbumDto) {
    // @ApiProperty({})
}
