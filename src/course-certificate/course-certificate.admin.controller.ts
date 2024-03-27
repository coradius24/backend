import { ConfigService } from '@nestjs/config';
import { CreateCourseCertificateDto } from './dto/create-course-certificate.dto';
import { Controller, Body,  UseGuards,  Post, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { CourseCertificateService } from './course-certificate.service';
import { FeatureGuard } from 'src/auth/feature.guard';

@ApiTags('Course Certificate')
@Controller('admin/course-certificates')
@UseGuards(AuthGuard, FeatureGuard)
@ApiBearerAuth()
export class CourseCertificateAdminController {
  constructor(private readonly courseCertificateService: CourseCertificateService,
    ) {}

  @Post()
  async generateCertificate(@Body() payload: CreateCourseCertificateDto) {
    await this.courseCertificateService.removeCertificate(payload.userId, payload.courseId)
    return this.courseCertificateService.generateSingleCertificate(payload.userId, payload.courseId, payload.fullName);
  }

}
