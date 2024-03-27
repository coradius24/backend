import { NotificationModule } from './../notification/notification.module';
import { Course } from 'src/courses/entities/course.entity';
import { UsersModule } from './../users/users.module';
import { EnrollmentsAdminController } from './enrollments.admin.controller';
import { Enrollment } from './entities/enrollment.entity';
import { Global, Module, forwardRef } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

@Global()
@Module({
  imports: [UsersModule, forwardRef(() => NotificationModule), TypeOrmModule.forFeature([Enrollment, Course])],
  controllers: [EnrollmentsController, EnrollmentsAdminController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService, TypeOrmModule.forFeature([Enrollment])],
})
export class EnrollmentsModule {}
