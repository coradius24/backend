import { FileInterceptor } from '@nestjs/platform-express';
import { FeatureGuard } from './../auth/feature.guard';
import { Controller,  Post, Body, Request, UseGuards, Get, Param, Query, Req, Res, UseInterceptors, UploadedFile, Delete } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ApiBearerAuth,  ApiBody,  ApiConsumes,  ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { ROLE } from 'src/users/enums/user.enums';
import { CreatePaymentByAdminDto } from './dto/create-payment-by-admin.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { EnrollmentSpikesQueryDto } from 'src/enrollments/dto/enrollment-chart-query.dto';
import { PaymentsQueryDto } from './dto/payments-query.dto';
import { DuesQueryDto } from './dto/dues-query.dto';
import { FileUploadDto } from 'src/files/dto/file-upload.dto';
import { ChatSignupDto, ChatSignUpForAllStudentDto } from './dto/chat-signup.dto';

@ApiTags('Payments')
@Controller('admin/payments')
@Roles(ROLE.admin)
@UseGuards(AuthGuard, FeatureGuard)
@ApiBearerAuth()
export class AdminPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}
  @Get('/')
  paymentHistory( @Query() paginationDto: PaginationDto, @Query() paymentsQueryDto: PaymentsQueryDto) {
    return this.paymentsService.getPayments({...paymentsQueryDto, ...paginationDto, paginated: true});
  }

  @Post('/:courseId/bulk-payment-and-enroll-from-sheet') 
  @ApiConsumes('multipart/form-data') 
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file'),
  )
  @ApiBody({
    description: 'EXCEL of file upload',
    type: FileUploadDto,
  })
  async bulkPaymentAndEnrollFromSheet (@Req() request: any, @Param('courseId') courseId:number, @UploadedFile() file) {
    return this.paymentsService.bulkPaymentAndEnrollFromSheet(request.user.sub,courseId, file)
  }
  
  @Get('/dues')
  paymentDueList( @Query() paginationDto: PaginationDto, @Query() duesQueryDto : DuesQueryDto) {
    return this.paymentsService.getAllDues({...paginationDto, ...duesQueryDto, paginated: true });
  }

  @Get('/dues-download')
  async paymentDueListDownload( @Query() duesQueryDto : DuesQueryDto, @Res() res) {
    const csv = await this.paymentsService.downloadDueListCsv(duesQueryDto);
    res.header('Content-Type', 'text/csv');
    const fileName = `payment-dues.csv`
    res.attachment(fileName);
    res.header('customFileName', fileName);
    res.header('custom-file-name-expose-headers', fileName);

    return res.send(csv);
  }


  @Get('/download')
  async paymentHistoryDownload( @Query() paymentsQueryDto: PaymentsQueryDto, @Res()res) {
    const csv = await this.paymentsService.downloadCsv(paymentsQueryDto);
    res.header('Content-Type', 'text/csv');
    const fileName = `payment-history.csv`
    res.attachment(fileName);
    res.header('customFileName', fileName);
    res.header('custom-file-name-expose-headers', fileName);

    return res.send(csv);
   
  }
  @Post('')
  createPaymentByAdmin(@Request() req, @Body() createPaymentDto: CreatePaymentByAdminDto) {
    return this.paymentsService.createPaymentByAdmin(req.user.sub,  createPaymentDto);
  }

  @Get('/users/:userId')
  paymentHistoryOfUser(@Param('userId') userId: number, @Query() paginationDto: PaginationDto) {
    return this.paymentsService.getPaymentsOfAUser(userId, paginationDto);
  }

  @Get('/stats')
  getPaymentsStats() {
    return this.paymentsService.getPaymentsStats();
  }

  @Get('/daily-spikes')
  getDailySpike(@Query() enrollmentSpikesQueryDto: EnrollmentSpikesQueryDto) {
    return this.paymentsService.getDailyPaymentSpikes(enrollmentSpikesQueryDto.startDate, enrollmentSpikesQueryDto.endDate);
  }

  @Delete(':id') 
  removePayment(@Param('id') id: number) {
    return this.paymentsService.removePayment(id)
  }

  @Delete(':courseId/unenroll-all-students-with-deus') 
  unEnrollUserWithDues(@Param('courseId') courseId: number) {
    this.paymentsService.unEnrollAllUsersWithDueByCourseId(courseId)
  }
 

  @Post('chat-signup')
  chatSignup(@Request() req, @Body() payload: ChatSignupDto) {
    return this.paymentsService.chatSignup(payload);
  }

  @Post('chat-bulk-signup')
  chatBulkSignup(@Request() req, @Body() payload: ChatSignUpForAllStudentDto) {
    return this.paymentsService.chatCourseWiseSignup(payload);
  }


  
}
