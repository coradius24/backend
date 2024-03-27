import { PaginationDto } from '../common/dto/pagination.dto';
import {
  Controller, Get, Param, Query, Req, UseGuards,
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
import { LiveClassService } from './live-class.service';
// import { Course } from './entities/course.entity';

@Controller('live-classes')
@ApiTags('LiveClasses')
export class LiveClassController {
  constructor(private readonly liveClassService: LiveClassService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard) 
  @Get('')
  async getMyLiveClasses(
    @Req() req: any, 
  ) {
    return this.liveClassService.getLiveClassesOfAUser(req.user.sub);
  }

  // @ApiBearerAuth()
  // @UseGuards(AuthGuard) 
  // @Get(':courseId')
  // async getLiveClassesOfACourse(
  //   @Param('courseId') courseId: number,
  //   @Req() req: any, 
  // ) {
  //   return this.liveClassService.findLiveClassByCourseId(courseId, req.user);
  // }

}
