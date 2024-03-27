import { UpdateLiveClassStatusDto } from './dto/update-live-class-status.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import {
  Body,
  Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards,
  // Get,
  // Post,
  // Put,
  // Delete,
  // Param,
  // Body,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesQuery } from './dto/courses-query.dto';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { Course } from './entities/course.entity';
import { AuthGuard } from 'src/auth/auth.guard';
import { FeaturedCoursesQueryDto } from './dto/featured-course-query.dto';
import { LiveClassService } from './live-class.service';
import { CreateLiveClassDto } from './dto/create-live-class.dto';
import { IsBoolean } from 'class-validator';
import { FeatureGuard } from 'src/auth/feature.guard';
// import { Course } from './entities/course.entity';

@Controller('admin/live-classes')
@ApiTags('LiveClasses')
@ApiBearerAuth()
@UseGuards(AuthGuard, FeatureGuard) 
export class LiveClassAdminController {
  constructor(private readonly liveClassService: LiveClassService) {}


  @Post('')
  async createLiveClass(
    @Body() createLiveClassDto: CreateLiveClassDto
  ) {
    return this.liveClassService.createLiveClass(createLiveClassDto);
  }

  @Get(':courseId')
  async getLiveClassesOfACourse(
    @Param('courseId') courseId: number,
  ) {
    return this.liveClassService.findLiveClassByCourseId(courseId);
  }

  @Delete(':courseId')

  async deleteLiveClass(
    @Param('courseId') courseId: number,
  ) {
    
    return this.liveClassService.deleteLiveClass(courseId);
  }

 
  @Patch('ongoing-status/:liveClassId')

  async updateLiveClassOnGoingStatus(
    @Param('liveClassId') liveClassId: number,
    @Body() updateLiveClassStatusDto: UpdateLiveClassStatusDto
  ) {
    return this.liveClassService.updateClassOngoingStatus(liveClassId, updateLiveClassStatusDto.isOnGoing);
  }



}
