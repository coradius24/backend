import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class MailQueueService {
  constructor(
    @InjectQueue('email') private emailQueue: Queue
  ) { }

  async enqueueEmailConfirmationMail(user: any, token: string): Promise<void> {
    await this.emailQueue.add('sendEmailConfirmation', { user, token });
  }

  async enqueueUserInvitationMail(user: any, token: string): Promise<void> {
    await this.emailQueue.add('sendUserInvitation', { user, token });
  }

  async enqueueUserInvitationWithPasswordMail(user: any, url: string, password: string): Promise<void> {
    await this.emailQueue.add('sendUserInvitationWithPassword', { user, url, password });
  }

  async enqueueResetPasswordMail(user: any, token: string): Promise<void> {
    await this.emailQueue.add('sendResetPasswordMail', { user, token });
  }

  async enqueuePayoutApprovedMail(data: { user: any; amount: number; payoutMethod: string; accountNumber: string }): Promise<void> {
    await this.emailQueue.add('sendPayoutApprovedMail', data);
  }

  async enqueuePayoutPaidMail(data: { user: any; amount: number; payoutMethod: string; accountNumber: string }): Promise<void> {
    await this.emailQueue.add('sendPayoutPaidMail', data);
  }

  async enqueuePayoutRejectionMail(data: { user: any; amount: number; reviewerMessage: string }): Promise<void> {
    await this.emailQueue.add('sendPayoutRejectionMail', data);
  }
  async enqueueAssignmentEvaluationMail(data: { userId: string; assignmentName: string; remarks: string }): Promise<void> {
    await this.emailQueue.add('sendAssignmentEvaluationMail', data);
  }

  async enqueueAssignmentResubmitRequestMail(data: { userId: string; assignmentName: string; remarks: string }): Promise<void> {
    await this.emailQueue.add('sendAssignmentResubmitRequestMail', data);
  }

  async enqueueCourseCertificateMail(data: { email: string; courseName: string; fullName: string; url: string }): Promise<void> {
    await this.emailQueue.add('sendCourseCertificateMail', data);
  }


  async enqueueAccountSuspensionMail(data: { email: string }): Promise<void> {
    await this.emailQueue.add('sendAccountSuspensionMail', data);
  }


}
