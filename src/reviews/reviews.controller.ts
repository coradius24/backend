import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ReviewStatus } from './enums/review.enums';
import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, UseInterceptors,  UploadedFiles } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { FilterApprovedReviewDto } from './dto/filter-approved-review.dto';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
  ) { }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'attachment', maxCount: 1 }, // You can specify the key and max file count for each field
    { name: 'reviewerPhoto', maxCount: 1 }, // Add more as needed
    { name: 'videoThumbnail', maxCount: 1 }, // Add more as needed
  ]))

  create(@Req() req, @Body() createReviewDto: CreateReviewDto, @UploadedFiles() images) {
    const attachmentData = images.attachment
    ? { buffer: images.attachment[0].buffer, originalname: images.attachment[0].originalname }
    : null;

  const reviewerPhotoData = images.reviewerPhoto
    ? { buffer: images.reviewerPhoto[0].buffer, originalname: images.reviewerPhoto[0].originalname }
    : null;

    const videoThumbnailData = images.videoThumbnail
    ? { buffer: images.videoThumbnail[0].buffer, originalname: images.videoThumbnail[0].originalname }
    : null;

    

    return this.reviewsService.create(req.user, createReviewDto, {
      attachment: attachmentData,
      reviewerPhoto: reviewerPhotoData,
      videoThumbnail: videoThumbnailData

    });
  }


  @Get()
  findAll(@Query() pagination?: PaginationDto,
    @Query() filterQuery?: FilterApprovedReviewDto
  ) {
    return this.reviewsService.findAll(pagination, filterQuery, ReviewStatus.APPROVED, 'highestRated');
  }

  @Get('featured')
  findAllFeatured(@Query() pagination?: PaginationDto,
    @Query() filterQuery?: FilterApprovedReviewDto
  ) {
    return this.reviewsService.findAll(pagination, { ...filterQuery, featuredOnly: true }, ReviewStatus.APPROVED, 'highestRated');
  }


  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('my-reviews/:courseId')
  findOne(@Param('courseId') id: string, @Req() req) {
    return this.reviewsService.findOneMyReviewByCourseId(req.user.sub, +id);
  }

  // @Patch('my-reviews/:courseId')
  // update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
  //   return this.reviewsService.update(+id, updateReviewDto);
  // }

}
