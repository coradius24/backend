import { CourseCertificateAdminController } from './course-certificate.admin.controller';
import { CoursesModule } from './../courses/courses.module';
import { Course } from 'src/courses/entities/course.entity';
import { CourseCertificate } from './entities/course-certificate.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { CourseCertificateService } from './course-certificate.service';
import { CourseCertificateController } from './course-certificate.controller';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([CourseCertificate, Course]), CoursesModule, UsersModule],
  controllers: [CourseCertificateController, CourseCertificateAdminController],
  providers: [CourseCertificateService],
})
export class CourseCertificateModule {}
