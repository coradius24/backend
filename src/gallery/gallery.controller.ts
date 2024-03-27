import { PaginationDto } from './../common/dto/pagination.dto';
import { Controller, Get,  Param, Query } from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Gallery')
@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get('/albums/:slug/photos')
  findOne(@Param('slug') slug: string, @Query() paginationDto: PaginationDto) {
    return this.galleryService.findAlbumPhotosBySlug(slug, paginationDto)
  }

  @Get('/albums')
  findAllAlbum( @Query() paginationDto: PaginationDto) {
    return this.galleryService.findAllAlbum(paginationDto);
  }
}
