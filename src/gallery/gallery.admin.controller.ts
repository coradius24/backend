import { UpdateGalleryPhotoDto } from './dto/update-gallery-photo.dto';
import { UploadGalleryPhotoDto } from './dto/upload-gallery-photo.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FeatureGuard } from 'src/auth/feature.guard';
import { Controller, Post, Body, Param, Delete, UseGuards, UseInterceptors, UploadedFile, Req, Query, Patch } from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CreateAlbumDto } from './dto/create-album.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { UpdateAlbumDto } from './dto/update-album.dto';

@ApiTags('Gallery')
@Controller('admin/gallery')
@ApiBearerAuth()
@UseGuards(AuthGuard, FeatureGuard)
export class GalleryAdminController {
  constructor(private readonly galleryService: GalleryService) {}

  @Post('photos')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('photo', {
      fileFilter: (req, file, cb) => {
        // Check if the file's MIME type is an image
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 1024 * 1024,
      },
    }),
  )
  async uploadGalleryPhoto(@Body() uploadGalleryPhotoDto: UploadGalleryPhotoDto, @UploadedFile() photo) {
    return this.galleryService.uploadGalleryImage(uploadGalleryPhotoDto, {
      buffer: photo.buffer, 
      originalname: photo.originalname
    });
  }

  @Patch('photo-caption/:id')
  async updateGalleryPhotoInfo(@Param() id: number, @Body() updateGalleryPhotoDto: UpdateGalleryPhotoDto) {
    return this.galleryService.updateGalleryImageInfo(id, updateGalleryPhotoDto)
  }

  @Post('/albums')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      fileFilter: (req, file, cb) => {
        // Check if the file's MIME type is an image
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 1024 * 1024,
      },
    }),
  )
  createAlbum(@Body() createAlbumDto: CreateAlbumDto, @UploadedFile() thumbnail) {
    return this.galleryService.createAlbum(createAlbumDto, thumbnail);
  }


  @Patch('/albums/:id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      fileFilter: (req, file, cb) => {
        // Check if the file's MIME type is an image
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 1024 * 1024,
      },
    }),
  )
  updateAlbum(@Param() id: number, @Body() updateAlbumDto: UpdateAlbumDto, @UploadedFile() thumbnail) {
    return this.galleryService.updateAlbum(id, updateAlbumDto, thumbnail);
  }


  @Delete('albums/:id')
  remove(@Param('id') id: number) {
    return this.galleryService.removeAlbum(id);
  }


  @Delete('photos/:id')
  removePhoto(@Param('id') id: number) {
    return this.galleryService.removeGalleryImage(id);
  }
}
