import { AssignmentSubmissionDto } from './dto/assignment-submission.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Body, Controller, Get,  Param, Post, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { AssignmentsService } from './assignments.service';

@UseGuards(AuthGuard)
@ApiBearerAuth()
@Controller('assignments')
@ApiTags('Assignment')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get(':courseId')
  findAllAssignmentsOfACourse(@Req() req: any,@Param('courseId') courseId: number) {
    return this.assignmentsService.findAllAssignmentsOfACourse(req.user, courseId)
  }

  @Post('/submissions')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'attachments', maxCount: 10 }, 
  ]))
  async submitAssignment(
    @Req() req: any,
    @Body() assignmentSubmissionDto: AssignmentSubmissionDto,
    @UploadedFiles() attachments,
  ) {
    return this.assignmentsService.submitAssignment(req.user, assignmentSubmissionDto, attachments.attachments);
  }


  @Get('my-submissions/:courseId')
  getMySubmissions(@Req() req: any, @Param('courseId') courseId: number ) {
    return this.assignmentsService.getMySubmissions(req.user.sub, courseId)
  }

}
