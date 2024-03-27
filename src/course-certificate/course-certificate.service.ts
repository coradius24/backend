import { ConfigService } from '@nestjs/config';
import { NotificationReceiver } from 'src/notification/enums/notification.enums';
import { UsersService } from 'src/users/users.service';
import { Course } from 'src/courses/entities/course.entity';
import { CourseCertificate } from './entities/course-certificate.entity';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateCourseCertificateDto } from './dto/update-course-certificate.dto';
import { Repository } from 'typeorm';
import { CoursesService } from 'src/courses/courses.service';
import { customAlphabet, urlAlphabet } from 'nanoid';
import { generateCertificate } from 'src/pdf/certificate.template';
import * as moment from 'moment';
import { FilesService } from 'src/files/files.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class CourseCertificateService {
  constructor(
    @InjectRepository(CourseCertificate) private certificateRepository: Repository<CourseCertificate>,
    @InjectRepository(Course) private courseRepository: Repository<Course>,
    private courseService: CoursesService,
    private userService: UsersService,
    private fileService: FilesService,
    private eventEmitter: EventEmitter2,
    private notificationGateway: NotificationGateway,
    private mailService: MailService,
    private configService: ConfigService
  ) { }

  getCertificatesOfAUser(userId) {
    return this.certificateRepository.find({
      where: {
        userId
      }
    })
  }

  async validateCertificate(credentialId) {
    const certificate = await this.certificateRepository.findOne({
      where: {
        credentialId
      }
    })
    if(!certificate) {
      throw new NotFoundException('Invalid certificate credential')
    }

    return certificate;
  }

  async getCertificateOfAUserOfACourse(userId, courseId) {
    const certificate = await this.certificateRepository.findOneBy({ userId, courseId })

    if (certificate) {
      return {
        ...certificate,
        allowCertificate: true,
        isGenerated: true
      }
    } else {
      try {
        const generated = await this.autoGenerate(userId, courseId)
        if(generated) {
          return {
            isGenerated: true,
            allowCertificate: true,
            ...generated
          }
        }
      } catch (error) {
        
      }
      
      return {
        isGenerated: false,
      }
    }
  }

  async autoGenerate(userId, courseId) {

    const {isAvailableForCertificate, minLessonCompletionRequiredForCertificate,
      minAssignmentCompletionRequiredForCertificate, allowCertificate} = await this.courseService.getCourseProgressOfAUser(userId, courseId)
    if (!isAvailableForCertificate) {
      return {
        isGenerated: false,
        allowCertificate,
        minLessonCompletionRequiredForCertificate,
        minAssignmentCompletionRequiredForCertificate
      }
    }

    return this.generateSingleCertificate(userId, courseId)

  }

  async generateSingleCertificate(userId, courseId, fullName?) {
    const nanoid = customAlphabet(urlAlphabet, 16)
    const credentialId = nanoid()?.toLowerCase()
    const newCertificate = this.certificateRepository.create({
      credentialId,
      userId,
      courseId
    })
    const course = await this.courseService.findOne(courseId)
    if(!course) {
      throw new BadRequestException('Course not Found!')
    }
    const user = await this.userService.findOne(userId)
    if(!user) {
      throw new BadRequestException('No User Found!')
    }

    const clientDomain = this.configService.get('CLIENT_DOMAIN')

    const pdf = await generateCertificate({
      name: fullName || user?.fullName,
      courseName: course?.title,
      issueDate: moment().startOf('d').add(6, 'hour').format('ll'),
      credentialId,
      clientDomain
    })
    const newUploadedFile = await this.fileService.uploadPublicFile(Buffer.from(pdf), `(userId:${userId})(courseId:${courseId}).pdf`, {}, {
        ContentDisposition:"inline",
        ContentType:"application/pdf"

    })
    newCertificate.file = newUploadedFile
    const savedCertificate: any = await this.certificateRepository.save(newCertificate)
    savedCertificate.courseTitle = course?.title;
    savedCertificate.email = user?.email;
    savedCertificate.fullName = user?.fullName;
    this.eventEmitter.emit('certificate.generated', { ...savedCertificate, userId, courseId,  })

    return savedCertificate
  }

  async removeCertificate(userId, courseId) {
    return this.certificateRepository.delete({
      userId,
      courseId
    })
  }



  @OnEvent('certificate.generated')
  async handleCertificateGeneration(payload) {
    const { courseTitle, fullName, email, file } = payload;
    await this.notificationGateway.sendInstantNotification({
      receiverType: NotificationReceiver.INDIVIDUAL_USERS,
      receivers: [payload.userId],
      message: `অভিনন্দন, আপনি "${courseTitle}" কোর্সের  সার্টিফিকেট পেয়েছেন!`,
      linkOrId: '/dashboard/courses/' + payload.courseId,
    })
    await this.mailService.sendCourseCertificateMail({
      fullName,
      email,
      courseName: courseTitle,
      url: file?.url
    })
  }
}
