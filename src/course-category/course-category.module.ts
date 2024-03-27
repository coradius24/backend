import { CourseCategory } from './entities/course-category.entity';
import { Module } from '@nestjs/common';
import { CourseCategoryController } from './course-category.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseCategoryService } from './course-category.service';
import { CourseCategoryAdminController } from './course-category.admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CourseCategory])], 
  controllers: [CourseCategoryController, CourseCategoryAdminController],
  providers: [CourseCategoryService],
})
export class CourseCategoryModule {}
