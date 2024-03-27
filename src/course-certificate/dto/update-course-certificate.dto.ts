import { PartialType } from '@nestjs/swagger';
import { CreateCourseCertificateDto } from './create-course-certificate.dto';

export class UpdateCourseCertificateDto extends PartialType(CreateCourseCertificateDto) {}
