import { UpdateAlbumDto } from './dto/update-album.dto';
import { FilesService } from 'src/files/files.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { Album } from './entities/album.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GalleryImage } from './entities/gallery-image.entity';
import slugify from 'slugify';
import { customAlphabet, urlAlphabet } from 'nanoid';


@Injectable()
export class GalleryService {
  constructor(
    @InjectRepository(Album) private albumRepository: Repository<Album>,
    @InjectRepository(GalleryImage) private galleryImageRepository: Repository<GalleryImage>,
    private fileService: FilesService
  ) { }
  async createAlbum(createAlbumDto: CreateAlbumDto, { buffer, originalname }) {
    let thumbnail;
    if (buffer) {
      thumbnail = await this.fileService.uploadPublicFile(buffer, originalname)
    }
    let slug = slugify(createAlbumDto.name, {
      lower: true,
      strict: true,
      trim: true
    })

    const albumWithSlug = await this.albumRepository.findOneBy({
      slug: slug,
    })

    if (albumWithSlug) {
      const nanoid = customAlphabet(urlAlphabet, 5)
      slug += '-' + nanoid()?.toLowerCase()
    }
    return await this.albumRepository.insert({ ...createAlbumDto, thumbnail, slug })
  }

  async findAllAlbum({ limit = 15, page = 1 }) {
    const skip = (page - 1) * limit;
    const results = await this.albumRepository
      .createQueryBuilder('album')
      .select([
        'album.id as id',
        'album.name as name',
        'album.shortDescription as shortDescription',
        'album.slug as slug',
        // 'album.thumbnailId as thumbnailId',
        // 'album.thumbnail as thumbnail',
      ])
          .addSelect(
        (subquery) =>
          subquery
            .select('COUNT(galleryImage.id)')
            .from('galleryImages', 'galleryImage')
            .where('galleryImage.albumId = album.id'),
        'imageCount'
      )
      .leftJoin('album.thumbnail', 'publicFile')
      .addSelect('publicFile.url as thumbnail')

      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany();

    // Calculate the total count separately
    const totalCount = await this.albumRepository
      .createQueryBuilder('album')
      .select('COUNT(album.id)', 'count')
      .getRawOne();

    return {
      results,
      page,
      limit,
      totalCount: totalCount.count,
    };


  }

  async findAlbumPhotosById(albumId: number, { limit = 10, page = 1 }) {
    const skip = (page - 1) * 1;
    return this.galleryImageRepository.find({
      where: {
        albumId,
      },
      skip,
      take: limit
    })
  }


  async findAlbumPhotosBySlug(slug: string, { limit = 15, page = 1 }) {

    const skip = (page - 1) * 1;
    const album = await this.albumRepository.findOneBy({ slug })
    const [results, totalCount] = await this.galleryImageRepository.findAndCount({
      where: {
        albumId: album.id
      },
      skip,
      take: limit
    })

    return {
      results,
      page,
      limit,
      totalCount,
      album: {
        id: album.id,
        name: album.name,
        shortDescription: album.shortDescription,
        thumbnail: album.thumbnail?.url || null
      }

    }
  }


  async updateAlbum(id: number, updateAlbumDto: UpdateAlbumDto, { buffer, originalname }) {
    if (buffer) {
      const album = await this.albumRepository.findOneBy({ id })
      await this.fileService.deletePublicFile(album.thumbnailId)
      await this.fileService.uploadPublicFile(buffer, originalname)

    }
    return this.albumRepository.update(id, updateAlbumDto)
  }

  async removeAlbum(id: number) {
      const photsOfTheAlbum = await this.galleryImageRepository.find({
        where: {
          albumId: id,
        },
      });
    
      if (photsOfTheAlbum.length > 0) {
        await this.galleryImageRepository
          .createQueryBuilder()
          .delete()
          .from(GalleryImage)
          .where('id IN (:ids)', { ids: photsOfTheAlbum.map(img => img.id) })
          .execute();
          
    
        await this.fileService.deletePublicFiles(photsOfTheAlbum.map(file => file?.photoId));
      }
      const album =  await this.albumRepository.findOneBy({id});
      await this.albumRepository.delete(id);
      if(!album) {
        throw new NotFoundException("No album with this id")
      }

      if(album?.thumbnailId) {
        await this.fileService.deletePublicFile(album?.thumbnailId)

      }

      return {
        success: true,
      };
    }
    
  

  async uploadGalleryImage(uploadBody, { buffer, originalname }) {
    const album = await this.albumRepository.findOneBy({ id: uploadBody.albumId })
    if (!album) {
      throw new NotFoundException('Album with this id not found!')
    }
    const photo = await this.fileService.uploadPublicFile(buffer, originalname)
    return await this.galleryImageRepository.insert({ photo, ...uploadBody })
  }

  async updateGalleryImageInfo(id, updateGalleryImageDto) {
    return await this.galleryImageRepository.update(id, updateGalleryImageDto)
  }

  async removeGalleryImage(id: number) {
    const galleryImage = await this.galleryImageRepository.findOneBy({ id })
    if(!galleryImage) {
      throw new NotFoundException('No image with this id')
    }

    const data = await this.galleryImageRepository.delete(id)
    await this.fileService.deletePublicFile(galleryImage?.photoId)

    return data;

  }
}
