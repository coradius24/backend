import { AssignmentSubmissionStatus } from './enums/assignment.enum';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { EvaluateAssignmentDto } from './dto/evaluate-asignment.dto';
import { FeatureGuard } from 'src/auth/feature.guard';
import { AuthGuard } from 'src/auth/auth.guard';
import { Controller, Post, Body, Patch, Param, Delete, UseGuards, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { SubmissionsQueryDto } from './dto/submissions-query.dto';

@ApiTags('Assignment')
@UseGuards(AuthGuard, FeatureGuard)
@ApiBearerAuth()
@Controller('admin/assignments')
export class AssignmentsAdminController {
  constructor(private readonly assignmentsService: AssignmentsService) {}
  @Get('courses/:courseId')
  getAllAssignment(@Param('courseId') courseId: number) {
    return this.assignmentsService.getAssignmentsWithSubmissionStatsOfACourse(courseId)
  }
  @Get('submissions/:assignmentId')
  getSubmissionsOfAnAssignment(@Param('assignmentId') assignmentId: number, @Query() paginationDto: PaginationDto, @Query() submissionQuery?: SubmissionsQueryDto ) {
    return this.assignmentsService.submissionsForAAssignment(assignmentId, {...paginationDto, ...submissionQuery})
  }
  @Post()
  createAssignment(@Body() createAssignmentDto: CreateAssignmentDto) {
    return this.assignmentsService.createAssignment(createAssignmentDto);
  }

  @Post('evaluation')
  evaluateAssignment(@Body() evaluateAssignmentDto: EvaluateAssignmentDto) {
    return this.assignmentsService.evaluateAssignment(evaluateAssignmentDto);
  }

  @Patch(':id')
  updateAssignment(@Param('id') id: number, @Body() updateAssignmentDto: UpdateAssignmentDto) {
    return this.assignmentsService.updateAssignment(id, updateAssignmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.assignmentsService.removeAssignment(id);
  }
}
