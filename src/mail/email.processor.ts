// mail.processor.ts
import { BullQueueEvents, OnQueueActive, OnQueueError, OnQueueEvent, OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { MailService } from './mail.service';

@Processor('email')
@Injectable()
export class MailProcessor {
  private logger= new Logger(MailProcessor.name)
  constructor(private readonly mailService: MailService) {}
  
  @OnQueueError()
  onError(error) {
    this.logger.error("Email Queue error: ", error)
  }

  @OnQueueFailed()
  onFailed(job:Job, error) {
    this.logger.error(`Queued  job ${job.id} of type ${job.name}  failed : ${job.data?.email || job.data?.user?.email}  `, error)
  }
  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(
      `Processing job ${job.id} of type ${job.name} for ${job.data?.email || job.data?.user?.email}...`,
    );
  }

  @OnQueueEvent(BullQueueEvents.COMPLETED)
  onCompleted(job: Job) {
    this.logger.log(
      `Completed job ${job.id} of type ${job.name} for ${job.data?.email || job.data?.user?.email} with result ${job.returnvalue}`,
    );
  }

  @Process('sendEmailConfirmation')
  async sendEmailConfirmation(job: Job<{ user: any; token: string }>) {
    const { user, token } = job.data;
    
    await this.mailService.sendUserConfirmation(user, token);
  }

  @Process({name: 'sendUserInvitation', concurrency: 1})
  async sendUserInvitation(job: Job<{ user: any; token: string }>) {
    const { user, token } = job.data;
    
    await this.mailService.sendUserInvitation(user, token);
  }


  @Process('sendUserInvitationWithPassword')
  async sendUserInvitationWithPassword(job: Job<{ user: any; url: string; password: string }>) {
    const { user, url, password } = job.data;
    
    await this.mailService.sendUserInvitationWithPassword(user, url, password);
  }

  @Process('sendResetPasswordMail')
  async sendResetPasswordMail(job: Job<{ user: any; token: string }>) {
    const { user, token } = job.data;
    
    await this.mailService.sendResetPasswordMail(user, token);
  }

  @Process('sendPayoutApprovedMail')
  async sendPayoutApprovedMail(job: Job<{ user: any; amount: number; payoutMethod: string; accountNumber: string }>) {
    const { user, amount, payoutMethod, accountNumber } = job.data;
    
    await this.mailService.sendPayoutApprovedMail({ user, amount, payoutMethod, accountNumber });
  }

  @Process('sendPayoutPaidMail')
  async sendPayoutPaidMail(job: Job<{ user: any; amount: number; payoutMethod: string; accountNumber: string }>) {
    const { user, amount, payoutMethod, accountNumber } = job.data;
    
    await this.mailService.sendPayoutPaidMail({ user, amount, payoutMethod, accountNumber });
  }

  @Process('sendPayoutRejectionMail')
  async sendPayoutRejectionMail(job: Job<{ user: any; amount: number; reviewerMessage: string }>) {
    const { user, amount, reviewerMessage } = job.data;
    
    await this.mailService.sendPayoutRejectionMail({ user, amount, reviewerMessage });
  }

  @Process('sendAccountSuspensionMail')
  async sendAccountSuspensionMail(job: Job<{ email: string }>) {
    const { email } = job.data;
    
    await this.mailService.sendAccountSuspensionMail({ email });
  }

  @Process('sendAssignmentEvaluationMail')
  async sendAssignmentEvaluationMail(job: Job<{ userId: string; assignmentName: string; remarks: string }>) {
    const { userId, assignmentName, remarks } = job.data;
    
    await this.mailService.sendAssignmentEvaluationMail({ userId, assignmentName, remarks });
  }

  @Process('sendAssignmentResubmitRequestMail')
  async sendAssignmentResubmitRequestMail(job: Job<{ userId: string; assignmentName: string; remarks: string }>) {
    const { userId, assignmentName, remarks } = job.data;
    
    await this.mailService.sendAssignmentResubmitRequestMail({ userId, assignmentName, remarks });
  }

  @Process('sendCourseCertificateMail')
  async sendCourseCertificateMail(job: Job<{ email: string; courseName: string; fullName: string; url: string }>) {
    const { email, courseName, fullName, url } = job.data;
    
    await this.mailService.sendCourseCertificateMail({ email, courseName, fullName, url });
  }


  
}
