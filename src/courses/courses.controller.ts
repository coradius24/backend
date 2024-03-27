import { OptionalAuthGuard } from './../auth/optionalAuth.guard';
import { WatchHistoryDto } from './dto/add-watch-history.dto';
import { PaginationDto } from './../common/dto/pagination.dto';
import {
  Body,
  Controller, Get, Param, Post, Query, Req, UseGuards,
  // Get,
  // Post,
  // Put,
  // Delete,
  // Param,
  // Body,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesQuery } from './dto/courses-query.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Course } from './entities/course.entity';
import { AuthGuard } from 'src/auth/auth.guard';
import { FeaturedCoursesQueryDto } from './dto/featured-course-query.dto';
// import { Course } from './entities/course.entity';

@Controller('courses')
@ApiTags('Courses')
export class CoursesController {
  constructor(private readonly courseService: CoursesService) {}


  @Get()
  async findAll(
    @Query() pagination?: PaginationDto,
    @Query() query?: CoursesQuery ,
  ) {
    return this.courseService.findAll(pagination, query);
  }

  @Get('featured')
  getFeaturedCourse(@Query()featuredCoursesQuery : FeaturedCoursesQueryDto) {
    return this.courseService.getFeaturedCourse(featuredCoursesQuery)
  }

  @ApiBearerAuth()
  @UseGuards(OptionalAuthGuard)
  @Get(':id')
  async findOne(@Req() req, @Param('id') id: number): Promise<Course> {
    return this.courseService.publicFindOne( req?.user, +id,);
  }

  @Get(':id/live-class')
  @ApiBearerAuth()
  @UseGuards(AuthGuard) 
  async findLiveClassByCourseId(@Param('id') id: number) {
    return this.courseService.findLiveClassByCourseId(+id);
  }

  @Get('/instructor/:id')
  async findCoursesOfAnInstructor(
    @Param('id') id: number,     
    @Query() pagination?: PaginationDto,
  ) {
    return this.courseService.findCoursesOfAnInstructor(+id, pagination);
  }


  @Get('/sections/:id')
  async getSectionsByCourseId(
    @Param('id') id: number, 
  ) {
    return this.courseService.getSectionsByCourseId(+id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard) 
  @Post('watch-histories')
  addWatchHistory(@Req() req,  @Body() watchHistoryDto: WatchHistoryDto) {
    return this.courseService.addWatchHistory(req.user.sub, watchHistoryDto)
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard) 
  @Get('watch-histories/:courseId')
  getWatchHistoriesOfACourse(@Req() req, @Param('courseId') courseId: number) {
    return this.courseService.getWatchHistoriesOfAUserOfACourse(req.user.sub, courseId)
  }

  
}
