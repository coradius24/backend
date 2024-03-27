import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CoursesQuery } from './dto/courses-query.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import {
  Body,
  Controller, Delete, Get, Param, Post, Query,
  Patch,
  UseGuards
  // Get,
  // Post,
  // Put,
  // Param,
  // Body,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import {  ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateCourseDto } from './dto/create-course.dto';
import { CourseSectionDto } from './dto/create-section.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { CourseNamesDto } from './dto/course-names.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { FeatureGuard } from 'src/auth/feature.guard';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { CoursesAdminQuery } from './dto/admin-courses-query.dto';
// import { Course } from './entities/course.entity';

@Controller('admin/courses')
@ApiTags('Courses')

export class CoursesAdminController {
  constructor(private readonly courseService: CoursesService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard,FeatureGuard)
  @Get()
  getCourses(@Query() pagination?: PaginationDto,
  @Query() query?: CoursesAdminQuery ,) {
    return this.courseService.getCoursesByAdmin(pagination, query)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard,FeatureGuard)
  @Post()
  createCourse(@Body() createCourseDto: CreateCourseDto ) {
    return this.courseService.createCourse(createCourseDto)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard,FeatureGuard)
  @Patch(':id')
  updateCourse(@Param('id') id: number, @Body() updateCourseDto: UpdateCourseDto) {
    return this.courseService.updateCourse(id, updateCourseDto)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard,FeatureGuard)
  @Delete(':id')
  deleteCourse(@Param('id') id: number ) {
    return this.courseService.deleteCourse(id)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, FeatureGuard)
  @Post('section')
  createCourseSection(@Body() courseSectionDto: CourseSectionDto ) {
    return this.courseService.createSection(courseSectionDto)
  }
  @ApiBearerAuth()
  @UseGuards(AuthGuard,FeatureGuard)
  @Patch('section/:id')
  updateCourseSection(@Param('id') id: number, @Body() updateSectionDto: UpdateSectionDto ) {
    return this.courseService.updateSection(id, updateSectionDto)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard,FeatureGuard)
  @Delete('section/:id')
  deleteCourseSection(@Param('id') id: number ) {
    return this.courseService.deleteSection(id)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard,FeatureGuard)
  @Post('lesson')
  createCourseLesson(@Body() createLessonDto: CreateLessonDto ) {
    return this.courseService.createLesson(createLessonDto)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard,FeatureGuard)
  @Patch('lesson/:id')
  updateCourseLesson(@Param('id') id: number, @Body() updateLessonDto: UpdateLessonDto ) {
    return this.courseService.updateLesson(id, updateLessonDto)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard,FeatureGuard)
  @Delete('lesson/:id')
  deleteCourseLesson(@Param('id') id: number ) {
    return this.courseService.deleteLesson(id)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('/names')
  getCourseNames(@Query() courseNamesDto: CourseNamesDto) {
    return this.courseService.getCourseNames(courseNamesDto)
  }
}
