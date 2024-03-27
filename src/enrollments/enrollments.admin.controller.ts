import { BulkUnenrollDTO } from './dto/bulk-unenroll.dto';
import { EnrollmentSpikesQueryDto } from './dto/enrollment-chart-query.dto';
import { EnrollmentQueryDto } from './dto/enrollment-query.dto';
import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { FeatureGuard } from 'src/auth/feature.guard';

@ApiTags('Enrollments')
@Controller('admin/enrollments')
@ApiBearerAuth()
@UseGuards(AuthGuard, FeatureGuard)

export class EnrollmentsAdminController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  create(@Body() createEnrollmentDto: CreateEnrollmentDto, @Req() req) {
    return this.enrollmentsService.create(createEnrollmentDto, req.user.sub);
  }

  @Get()
  getAllEnrollments(@Query() paginationDto: PaginationDto, @Query() enrollmentQueryDto: EnrollmentQueryDto) {
    return this.enrollmentsService.findAllEnrollments(paginationDto, enrollmentQueryDto);
  }

  @Get('/users/:id')
  getCoursesOfAUser(@Param('id') userId: number) {
    return this.enrollmentsService.getEnrolledCoursesOfAUser(+userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.enrollmentsService.remove(+id);
  }

  @Delete(':courseId/bulk-unenroll')
  bulkUnEnroll(@Param('courseId') courseId: number, @Body() body: BulkUnenrollDTO) {
    return this.enrollmentsService.bulkRemoveByUserAndCourse(courseId, body.userIds)
  }




  @Get('/daily-spikes')
  getDailySpike(@Query() enrollmentSpikesQueryDto: EnrollmentSpikesQueryDto) {
    return this.enrollmentsService.getDailyEnrollmentSpikes(enrollmentSpikesQueryDto.startDate, enrollmentSpikesQueryDto.endDate);
  }

  
}
