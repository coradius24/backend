import { GalleryAdminController } from './gallery.admin.controller';
import { GalleryImage } from './entities/gallery-image.entity';
import { Album } from './entities/album.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { GalleryController } from './gallery.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Album, GalleryImage])],
  controllers: [GalleryController, GalleryAdminController],
  providers: [GalleryService],
})
export class GalleryModule {}
