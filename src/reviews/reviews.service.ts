import { AttachmentType } from './../courses/enums/course.enums';
import { FilesService } from './../files/files.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ReviewStatus, ReviewAttachmentType } from './enums/review.enums';
import { ForbiddenException, Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { EnrollmentsService } from 'src/enrollments/enrollments.service';
import { Course } from 'src/courses/entities/course.entity';

@Injectable()
export class ReviewsService {
  logger = new Logger()
  constructor(@InjectRepository(Review) private reviewRepository: Repository<Review>,
    @InjectRepository(Course) private coursesRepository: Repository<Course>,


    private readonly enrollmentService: EnrollmentsService,
    private readonly fileService: FilesService,
  ) {
  }
  async create(user, createReviewDto: CreateReviewDto, { attachment, reviewerPhoto, videoThumbnail }) {
    const review = this.reviewRepository.create({
      comment: createReviewDto.comment,
      status: createReviewDto.status,
      rating: createReviewDto.rating,
      attachmentType: createReviewDto.attachmentType,
      reviewerName: createReviewDto.reviewerName
    });


    if(Number(createReviewDto.userId)) {
      review.userId = createReviewDto.userId
    }


    const courseData = await this.coursesRepository.findOne({
      where: {
        id: createReviewDto.courseId

      },
      select: ['id', 'parentCourseId'],
    });

    if (!courseData) {
      throw new NotFoundException('Course not found!')
    }
    review.mainCourseId = courseData?.parentCourseId || courseData?.id;
    review.batchCourseId = courseData?.id;
    
    if (user?.role == 0) {

      const isValidUser = await this.enrollmentService.checkCourseEnrollment(user.sub, createReviewDto.courseId)
      if (!isValidUser) {
        throw new ForbiddenException('This Course not enrolled!')
      }

      const alreadyGivenReview = await this.reviewRepository.findOne({
        where: {
          userId: user.sub,
          mainCourseId: review.mainCourseId
        }
      })

      if (alreadyGivenReview) {
        throw new BadRequestException("Review already given!")
      }
      review.userId = user.sub
      review.status = ReviewStatus.PENDING
      delete review.reviewerName
    } else {
      if((createReviewDto as any).isFeatured === 'true') {
        review.isFeatured = true

      }else{
        review.isFeatured = false
      }
      if (reviewerPhoto) {
        const attachmentFile = await this.fileService.uploadPublicFile(reviewerPhoto.buffer, reviewerPhoto.originalname);
        review.reviewerPhoto = attachmentFile
      }
    }
    if (attachment) {
      let fileHeader = {}
      if(createReviewDto.attachmentType === ReviewAttachmentType.VIDEO) {
        fileHeader = {ContentType:  'application/octet-stream'}
      }
      const attachmentFile = await this.fileService.uploadPublicFile(attachment.buffer, attachment.originalname, {}, fileHeader);
      
      review.attachment = attachmentFile
    }

    if (videoThumbnail) {
      const attachmentFile = await this.fileService.uploadPublicFile(videoThumbnail.buffer, videoThumbnail.originalname);
      review.videoThumbnail = attachmentFile
    }
    const savedReview = await this.reviewRepository.save(review);

    if(review.status === ReviewStatus.APPROVED) {
      const approvedReviewCount = await this.reviewRepository.countBy({
        mainCourseId: review.mainCourseId,
        status: ReviewStatus.APPROVED
      })
  
      const averageRating = await this.reviewRepository.average('rating', {
        mainCourseId: review.mainCourseId,
        status: ReviewStatus.APPROVED
      })
      await this.coursesRepository.update(review.mainCourseId, {
        rattedBy: approvedReviewCount,
        rating: averageRating
      })
    }
    
    return savedReview
  }

  async findAll({ page = 1, limit = 10 }: PaginationDto, {
    summary,
    rating = 'all',
    featuredOnly,
    courseId
  }: any,
    status = 'all',
    orderBy?,

  ) {
    const skip = (page - 1) * limit;
    const take = limit;

    const query: any = {
    }
    if(courseId && courseId !== 'all') {
      const courseData = await this.coursesRepository.findOne({
        where: {
          id: courseId
        },
        select: ['id', 'parentCourseId'],
      });

      if (!courseData) {
        throw new NotFoundException('Course not found!')
      }
      query.mainCourseId = courseData?.parentCourseId || courseData?.id;
     
     
    }
    let order: any = {
      createdAt: 'DESC',
    }
    if (status !== 'all') {
      query.status = status
    }
    if (featuredOnly) {
      query.isFeatured = true
    }
    if (orderBy === 'highestRated') {
      order = {
        rating: 'DESC',
        createdAt: 'DESC',
      }
    }

    if (rating != 'all') {
      query.rating = rating
    }

    const [reviews, totalCount] = await this.reviewRepository.findAndCount({
      where: query,
      order,
      skip,
      take,
      relations: {
        course: true,
        user: { photo: true },
        attachment: true,
        reviewerPhoto: true,
      },
    });

    const transformedReviews = reviews.map((review) => {
      const reviewerPhotoUrl =
        review.reviewerPhoto?.url || (review.user?.photo?.url || null);
      const reviewerName =
        review.reviewerName || (review.user ? `${review.user.fullName}` : null);

      return {
        id: review.id,
        userId: review.userId,
        mainCourseId: review.mainCourseId,
        batchCourseId: review.batchCourseId,
        course: {
          title: review.course?.title,
          batchTitle: review.course?.batchTitle,
        },
        rating: review.rating,
        comment: review.comment,
        status: review.status,
        createdAt: review.createdAt,
        reviewerName: reviewerName,
        attachment: review.attachment?.url,
        videoThumbnail: review.videoThumbnail?.url,
        attachmentType: review.attachmentType,
        reviewerPhoto: reviewerPhotoUrl,
        isFeatured: review.isFeatured
      };
    });


    const result: any = {
      results: transformedReviews,
      page,
      limit,
      totalCount: totalCount,
    };
    if (summary === 'include') {
      const ratingSummaryQuery = this.reviewRepository
        .createQueryBuilder('review')
        .select('rating', 'rating')
        .addSelect('COUNT(*)', 'count')
        .groupBy('rating');

      if (status !== 'all') {
        ratingSummaryQuery.where('review.status = :status', { status: ReviewStatus.APPROVED });
      }

      const ratingSummary = await ratingSummaryQuery.getRawMany();

      const summaryMap = {
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
        average: 0
      }

      let grandTotal = 0;
      ratingSummary.forEach((rating) => {
        summaryMap[rating.rating] = Number(rating.count)
        grandTotal += rating.count || 0;
      })

      summaryMap.average = Number(((summaryMap[1] + (summaryMap[2] * 2) + (summaryMap[3] * 3)
        + (summaryMap[4] * 4) + (summaryMap[5] * 5)) / grandTotal).toFixed(2)) || 0;
      result.summary = summaryMap
    }



    return result;
  }



  async findOneMyReviewByCourseId(userId, id: number) {
    const courseData = await this.coursesRepository.findOne({
      where: {
        id: id,
      },
      select: ['id', 'parentCourseId'],
    });

    if (!courseData) {
      throw new NotFoundException('Course not found!')
    }

    return this.reviewRepository.findOne({
      where: {
        mainCourseId: (courseData.parentCourseId || courseData.id),
        userId,
      },
      select: ['id', 'comment', 'rating', "attachment", 'attachmentType']
    })
  }

  async update(id: number, updateReviewDto: UpdateReviewDto, {
    attachment,
    videoThumbnail,
    reviewerPhoto
  }) {
      const review = await this.reviewRepository.findOneBy({id})
      if (attachment) {
        const attachmentFile = await this.fileService.uploadPublicFile(attachment.buffer, attachment.originalname);
        review.attachment = attachmentFile
      }
  
      if (reviewerPhoto) {
        const attachmentFile = await this.fileService.uploadPublicFile(reviewerPhoto.buffer, reviewerPhoto.originalname);
        review.reviewerPhoto = attachmentFile
      }

      if (videoThumbnail) {
        const attachmentFile = await this.fileService.uploadPublicFile(videoThumbnail.buffer, videoThumbnail.originalname);
        review.videoThumbnail = attachmentFile
      }
      const approvedReviewCount = await this.reviewRepository.countBy({
        mainCourseId: review.mainCourseId,
        status: ReviewStatus.APPROVED
      })
  
      const averageRating = await this.reviewRepository.average('rating', {
        mainCourseId: review.mainCourseId,
        status: ReviewStatus.APPROVED
      })

  
      await this.coursesRepository.update(review.mainCourseId, {
        rattedBy: approvedReviewCount,
        rating: averageRating
      })
      if((updateReviewDto as any).isFeatured === 'true') {
        updateReviewDto.isFeatured = true
      }else if((updateReviewDto as any).isFeatured === 'false'){
        updateReviewDto.isFeatured = false
      }

    return this.reviewRepository.update(id, updateReviewDto)
  }

  remove(id: number) {
    return this.reviewRepository.delete(id)
  }
}
