import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { CourseCertificateService } from './course-certificate.service';

@ApiTags('Course Certificate')
@Controller('course-certificates')

export class CourseCertificateController {
  constructor(private readonly courseCertificateService: CourseCertificateService,
    ) {}

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get('/courses/:courseId/my-certificate')
  findAll(@Param('courseId') courseId: number, @Req()req) {
    return this.courseCertificateService.getCertificateOfAUserOfACourse(req?.user?.sub, courseId);
  }

  @Get('/validate/:credentialId')
  validateCertificate(@Param('credentialId') credentialId: number) {
    return this.courseCertificateService.validateCertificate(credentialId);
  }

  @Get('/users/:userId')
  async getCertificatesOfAUser(@Param('userId') userId: number) {
    return this.courseCertificateService.getCertificatesOfAUser(userId);
  }
}
