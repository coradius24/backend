import { Controller, Get,  Body, Patch, Param, Delete, Query, UseGuards, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AdminReviewFilterDto } from './dto/admin-review-filter.dto';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { ROLE } from 'src/users/enums/user.enums';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@ApiTags('Reviews')
@Controller('admin/reviews')
@ApiBearerAuth()
@Roles(ROLE.admin)
@UseGuards(AuthGuard)
export class AdminReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService, 
  ) {}

  @Get()
  findAll(@Query() pagination?: PaginationDto,
  @Query() filterQuery?: AdminReviewFilterDto,
  ) {
    return this.reviewsService.findAll(pagination, filterQuery,  'all' , 'latest');
  }


  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'attachment', maxCount: 1 }, // You can specify the key and max file count for each field
    { name: 'reviewerPhoto', maxCount: 1 }, // Add more as needed
    { name: 'videoThumbnail', maxCount: 1 }, // Add more as needed
  ]))
  update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto,   @UploadedFiles() images
  ) {
    const attachmentData = images.attachment
    ? { buffer: images.attachment[0].buffer, originalname: images.attachment[0].originalname }
    : null;

  const reviewerPhotoData = images.reviewerPhoto
    ? { buffer: images.reviewerPhoto[0].buffer, originalname: images.reviewerPhoto[0].originalname }
    : null;

    const videoThumbnailData = images.videoThumbnail
    ? { buffer: images.videoThumbnail[0].buffer, originalname: images.videoThumbnail[0].originalname }
    : null;

    return this.reviewsService.update(+id, updateReviewDto, {
        attachment: attachmentData,
        reviewerPhoto: reviewerPhotoData,
        videoThumbnail: videoThumbnailData
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(+id);
  }
}
