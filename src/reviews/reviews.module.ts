import { EnrollmentsModule } from './../enrollments/enrollments.module';
import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Course } from 'src/courses/entities/course.entity';
import { AdminReviewsController } from './reviews.admin.controller';
import { FilesModule } from 'src/files/files.module';

@Module({
  imports: [FilesModule, TypeOrmModule.forFeature([Review, Course]), EnrollmentsModule],
  controllers: [ReviewsController, AdminReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
