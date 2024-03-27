import { AssignmentsModule } from './../assignments/assignments.module';
import { WatchHistory } from './entities/watch-history.entity';
import { Lesson } from 'src/courses/entities/course-lesson.entity';
import { LiveClassController } from './live-classes.controller';
import { LiveClassService } from './live-class.service';
import { LiveClassAdminController } from './live-classes.admin.controller';
import { CourseSection } from './entities/course-section.entity';
import { FilesModule } from 'src/files/files.module';
import { CourseCategoryService } from './../course-category/course-category.service';
import { CourseCategory } from './../course-category/entities/course-category.entity';
import { Module } from '@nestjs/common';
// import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { Course } from './entities/course.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesService } from './courses.service';
import { UsersModule } from 'src/users/users.module';
import { LiveClass } from './entities/live-class.entity';
import { Coupon } from './entities/coupon.entity';
import CouponController from './coupon.controller';
import CouponService from './coupon.service';
import { CoursesAdminController } from './courses.admin.controller';
import { Review } from 'src/reviews/entities/review.entity';
import { Payment } from 'src/payments/entities/payment.entity';


@Module({
  imports: [
    UsersModule ,
    FilesModule,
    TypeOrmModule.forFeature([Course, CourseCategory, CourseSection, LiveClass, Coupon, Lesson, WatchHistory, Review, Payment]),
    AssignmentsModule
  ], 
  controllers: [CoursesController, CouponController, LiveClassController, LiveClassAdminController, CoursesAdminController],
  providers: [CoursesService, CourseCategoryService, CouponService, LiveClassService],
  exports: [CouponService, CoursesService]

})
export class CoursesModule {}
