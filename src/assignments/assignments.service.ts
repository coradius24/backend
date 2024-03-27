import { ROLE } from 'src/users/enums/user.enums';
import { FilesService } from './../files/files.service';
import { AssignmentSubmissionDto } from './dto/assignment-submission.dto';
import { NotificationGateway } from './../notification/notification.gateway';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { AssignmentSubmissionStatus } from './enums/assignment.enum';
import { EvaluateAssignmentDto } from './dto/evaluate-asignment.dto';
import { EnrollmentsService } from 'src/enrollments/enrollments.service';
import { AssignmentSubmission } from './entities/assignment-submission.entity';
import { Assignment } from './entities/assignment.entity';
import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { Repository } from 'typeorm';
import { NotificationReceiver, NotificationType } from 'src/notification/enums/notification.enums';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AssignmentsService {
  logger = new Logger(AssignmentsService.name)
  constructor(
    @InjectRepository(Assignment) private assignmentRepository: Repository<Assignment>,
    @InjectRepository(AssignmentSubmission) private submissionRepository: Repository<AssignmentSubmission>,
    private enrollmentsService: EnrollmentsService,
    private mailService: MailService,
    private eventEmitter: EventEmitter2,
    private  notificationGateway: NotificationGateway,
    private  filesService: FilesService,
  ){}

  async createAssignment(createAssignmentDto: CreateAssignmentDto) {

    const data  = await this.assignmentRepository.insert(createAssignmentDto)
    this.eventEmitter.emit('assignment.created', createAssignmentDto)
    return data;
  }

  async findAllAssignmentsOfACourse(user, courseId: number) {
    if(user.role == ROLE.student) {
      const enrolledCourse = await this.enrollmentsService.checkCourseEnrollment(user.sub, courseId)
      if(!enrolledCourse) {
        throw new ForbiddenException('This course is not enrolled by this user!')
      }
    }

    return this.assignmentRepository.find({
      where: {
        courseId
      },
      order: {
        createdAt: 'DESC'
      }
    })
  
  }

  async getAssignmentsWithSubmissionStatsOfACourse(courseId: number) {
    const queryBuilder = this.assignmentRepository.createQueryBuilder('assignment')
      .select([
        'assignment.id as id',
        'assignment.name as name',
        'COUNT(assignment_submission.id) as totalSubmissionsCount',
        'SUM(CASE WHEN assignment_submission.status = :submittedStatus THEN 1 ELSE 0 END) as pendingSubmissionCount',
        'SUM(CASE WHEN assignment_submission.status = :askedForResubmitStatus THEN 1 ELSE 0 END) as askedForResubmissionCount',
        'SUM(CASE WHEN assignment_submission.status = :evaluatedStatus THEN 1 ELSE 0 END) as evaluatedCount',
        "(SELECT COUNT(*) FROM assignment_submissions a WHERE a.courseId = assignment.courseId AND a.status = :submittedStatus) AS pendingAssignmentCount",
      ])
      .leftJoin(
        AssignmentSubmission,
        'assignment_submission',
        'assignment_submission.assignmentId = assignment.id AND assignment_submission.courseId = :courseId',
        { courseId }
      )
      .where('assignment.courseId = :courseId', { courseId })
      .groupBy('assignment.id, assignment.name')
      .setParameter('courseId', courseId)
      .setParameter('submittedStatus', AssignmentSubmissionStatus.SUBMITTED)
      .setParameter('askedForResubmitStatus', 'asked_for_resubmit')
      .setParameter('evaluatedStatus', 'evaluated');
  
    return queryBuilder.getRawMany();
  }
  
  
  
  


  updateAssignment(id: number, updateAssignmentDto: UpdateAssignmentDto) {
    return this.assignmentRepository.update(id, updateAssignmentDto)
  }

  removeAssignment(id: number) {
    return this.assignmentRepository.delete(id);
  }

  async submitAssignment(user, submissionDto: AssignmentSubmissionDto, attachments) {
   const userId = user.sub;
    
    const assignment = await this.assignmentRepository.findOneBy({ id: submissionDto.assignmentId });
    if (!assignment) {
      throw new NotFoundException('Assignment Not found!');
    } else {
      if(user.role == ROLE.student) {
        const enrolledCourse = await this.enrollmentsService.checkCourseEnrollment(user.sub, assignment.courseId)
        if(!enrolledCourse) {
          throw new ForbiddenException('This course is not enrolled by this user!')
        }
      }
      
    }
  
    let uploadedAttachments = [];
    if (attachments?.length) {
      uploadedAttachments = await this.filesService.uploadMultiplePublicFile(attachments);
      // uploadMultiplePublicFile
    }
  
  
    // Create a new AssignmentSubmission entity
    const newAssignmentSubmission = new AssignmentSubmission();
    newAssignmentSubmission.userId = userId;
    newAssignmentSubmission.courseId = assignment.courseId;
    newAssignmentSubmission.attachments = uploadedAttachments;
    newAssignmentSubmission.assignmentId = submissionDto.assignmentId;
    newAssignmentSubmission.submissionNote = submissionDto.submissionNote;
    // Set other fields from submissionDto
  
    // Find the previous submission
    const previousSubmission = await this.submissionRepository.findOneBy({ userId, assignmentId: submissionDto.assignmentId });
  
    this.eventEmitter.emit('assignment.submitted', {
      assignmentName: assignment.name,
      userFullName : user.fullName,
      userEmail : user.email,
      courseId: assignment.courseId,
      assignmentId: assignment.id, 
    })
    if (!previousSubmission) {
      // Insert a new submission
      return this.submissionRepository.save(newAssignmentSubmission);
    } else {
      previousSubmission.status = AssignmentSubmissionStatus.SUBMITTED

      if (uploadedAttachments?.length) {
        // Update the existing submission with new attachments
        previousSubmission.attachments = uploadedAttachments;
      }
  
      // Update other fields as needed
      Object.assign(previousSubmission, submissionDto);
    
      // Save the updated submission
      return this.submissionRepository.save(previousSubmission);
    }
  }
  

  getMySubmissions(userId: number, courseId: number) {
    return this.submissionRepository.findBy({
      courseId,
      userId
    })
  }

  getAssignmentCount(courseId: number){
    return this.assignmentRepository.countBy({
      courseId
    }) || 0
  }

  getApprovedAssignmentSubmissionCount(userId: number, courseId: number) {
    return this.submissionRepository.countBy({
      courseId,
      userId,
      status: AssignmentSubmissionStatus.EVALUATED
    }) || 0
  }

  async evaluateAssignment(evaluateAssignmentDto: EvaluateAssignmentDto) {
    const payload = {...evaluateAssignmentDto, status: AssignmentSubmissionStatus.EVALUATED}
    if(evaluateAssignmentDto.askForResubmit) {
      payload.status = AssignmentSubmissionStatus.ASKED_FOR_RESUBMIT
      this.eventEmitter.emit('assignment.askedForResubmission', {
        submissionId: evaluateAssignmentDto.submissionId,
      })
    }else{
      this.eventEmitter.emit('assignment.evaluated', {
        submissionId: evaluateAssignmentDto.submissionId,
      })
    }
    delete payload.submissionId
    delete payload.askForResubmit
    // todo: send mail and notification
    return this.submissionRepository.update(evaluateAssignmentDto.submissionId, payload)
  }

  async submissionsForAAssignment(assignmentId, {limit=10, page=1, status = 'all'}) {

    const skip = (page-1) * limit;
    const query: any = {
      assignmentId
    }

    if(status!='all') {
      query.status = status
    }
    const [results, totalCount] = await this.submissionRepository.findAndCount({
      where: query,
      skip,
      relations: {
        user: true,
        attachments: true
      },
      take: limit
    })

    const pendingSubmissionCount  = await this.submissionRepository.count({
      where: {
        assignmentId,
        status: AssignmentSubmissionStatus.SUBMITTED
      }
    })

    const askedForResubmissionCount  = await this.submissionRepository.count({
      where: {
        assignmentId,
        status: AssignmentSubmissionStatus.ASKED_FOR_RESUBMIT
      }
    })

    const evaluatedCount  = await this.submissionRepository.count({
      where: {
        assignmentId,
        status: AssignmentSubmissionStatus.EVALUATED
      }
    })

    return {
      results: results?.map(submission => ({...submission, user: {
        fullName: submission?.user?.fullName,
        email: submission?.user?.email,
        id: submission?.user?.id,
      }})), 
      totalCount,
      pendingSubmissionCount,
      askedForResubmissionCount,
      evaluatedCount

    }
    
  }

  @OnEvent('assignment.evaluated')
  async handleAssignmentEvaluated(payload: any) {
    const submission = await this.submissionRepository.findOne({where:{id: payload.submissionId}})
    const assignment = await this.assignmentRepository.findOneBy({id: submission.assignmentId})

    await this.notificationGateway.sendInstantNotification({
      receiverType: NotificationReceiver.INDIVIDUAL_USERS,
      receivers: [submission.userId],
      message: `আপনার এসাইনমেন্ট "${assignment.name}" সাবমিশনটি মূল্যায়ন করা হয়েছে `
    })


    await this.mailService.sendAssignmentEvaluationMail({
      userId: submission.userId,
      assignmentName: assignment.name,
      remarks: payload.remarks
    })
  
  }

  @OnEvent('assignment.askedForResubmission')
  async handleAskForResubmission(payload: any) {
    const submission = await this.submissionRepository.findOne({where:{id: payload.submissionId}})
    const assignment = await this.assignmentRepository.findOneBy({id: submission.assignmentId})
   await this.notificationGateway.sendInstantNotification({
      receiverType: NotificationReceiver.INDIVIDUAL_USERS,
      receivers: [submission.userId],
      message: `আপনার এসাইনমেন্ট "${assignment.name}" পুনরায় জমা সাবমিট করার জন্য  অনুরোধ করা হয়েছে`
    })
  

    return await this.mailService.sendAssignmentResubmitRequestMail({
      userId: submission.userId,
      assignmentName: assignment.name,
      remarks: payload.remarks
    })
  }

  @OnEvent('assignment.created')
  async handleNewAssignmentPublish(payload: any) {
   await this.notificationGateway.sendInstantNotification({
      receiverType: NotificationReceiver.SPECIFIC_COURSES,
      receivers: [payload.courseId],
      message: `আপনাকে একটি এসাইনমেন্ট দেয়া হয়েছে "${payload.name}"`
    })
  }

  @OnEvent('assignment.submitted')
  async handleNewAssignmentSubmission(payload: {
    courseId: number,
    assignmentId: number,
    assignmentName: string,
    userEmail: string,
    userFullName: string,
  }) {
    try {
      await this.notificationGateway.sendInstantNotification({
        receiverType: NotificationReceiver.ALL_ASSIGNMENT_SUBMISSION_UPDATES_ADMIN_RECEIVER,
        notificationType: NotificationType.ADMIN_NOTIFICATION,
        receivers: [payload.courseId],
        linkOrId: `/admin/courses/assignment/${payload.assignmentId}?search=${payload.userEmail}`,
        message: `Got an assignment submission from "${payload.userEmail}" for "${payload.assignmentName}" `
      })
    } catch (error) {
      this.logger.error("Assignment submission notification error",error)
    }

  }

}
