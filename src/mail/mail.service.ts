import { ConfigService } from '@nestjs/config';
import { User } from './../users/entities/user.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';


@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    @InjectRepository(User) private userRepository: Repository<User>,
    private configService: ConfigService,
  ) { }

  async sendUserConfirmation(user: any, token: string) {
    const url = `${this.configService.get('CLIENT_DOMAIN')}/user/verify?token=${token}`;
    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Welcome to Upspot Academy! Confirm your Email',
      template: './confirmation', // `.hbs` extension is appended automatically
      context: { // ✏️ filling curly brackets with content
        name: user.fullName,
        url,
      },
    });
  }

  async sendUserInvitationWithPassword(user: any, url: string, password) {
    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Welcome to Upspot Academy! Login Credentials',
      template: './userInvitationWithPassword', // `.hbs` extension is appended automatically
      context: { // ✏️ filling curly brackets with content
        name: user.fullName,
        email: user.email,
        password,
        url
      },
    });
  }

  async sendUserInvitation(user: any, token: string) {
    const url = `${this.configService.get('CLIENT_DOMAIN')}/user/set-password?token=${token}`;
    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Welcome to Upspot Academy! Set your password',
      template: './userInvitation', // `.hbs` extension is appended automatically
      context: { // ✏️ filling curly brackets with content
        name: user.fullName,
        url,
      },
    });
  }

  async sendResetPasswordMail(user: any, token: string) {
    const url = `${this.configService.get('CLIENT_DOMAIN')}/login/forgot_password_request/verify?token=${token}`;
    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Upspot Academy - Password Reset Request',
      template: './passwordResetRequest', // `.hbs` extension is appended automatically
      context: { // ✏️ filling curly brackets with content
        name: user.fullName,
        url,
      },
    });
  }

  async sendPayoutApprovedMail({
    user,
    amount,
    payoutMethod,
    accountNumber
  }) {
    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Upspot Academy - withdraw request approved ',
      template: './earningPaymentApproved', // `.hbs` extension is appended automatically
      context: { // ✏️ filling curly brackets with content
        name: user.fullName,
        amount,
        payoutMethod,
        accountNumber
      },
    });
  }

  async sendPayoutPaidMail({
    user,
    amount,
    payoutMethod,
    accountNumber
  }) {
    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Upspot Academy - withdraw payment transfared ',
      template: './earningPaymentPaid', // `.hbs` extension is appended automatically
      context: { // ✏️ filling curly brackets with content
        name: user.fullName,
        amount,
        payoutMethod,
        accountNumber
      },
    });
  }

  async sendPayoutRejectionMail({
    user,
    amount,
    reviewerMessage
  }) {
    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Upspot Academy - Earning payment',
      template: './earningPaymentRejection', // `.hbs` extension is appended automatically
      context: { // ✏️ filling curly brackets with content
        name: user.fullName,
        amount,
        reviewerMessage
      },
    });
  }

  async sendAccountSuspensionMail({
    email,
  }) {
    await this.mailerService.sendMail({
      to: email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Upspot Academy: Account Suspension Notice',
      template: './accountSuspension', // `.hbs` extension is appended automatically
      context: { // ✏️ filling curly brackets with content        
      },
    });
  }

  async sendAssignmentEvaluationMail({
    userId,
    assignmentName,
    remarks
  }) {
    const user = await this.userRepository.findOneBy({ id: userId })

    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Upspot Academy - Assignment',
      template: './assignmentEvaluation', // `.hbs` extension is appended automatically
      context: { // ✏️ filling curly brackets with content
        name: user.fullName,
        assignmentName,
        remarks
      },
    });
  }


  async sendAssignmentResubmitRequestMail({
    userId,
    assignmentName,
    remarks
  }) {
    const user = await this.userRepository.findOneBy({ id: userId })
    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Upspot Academy - Assignment Rejected',
      template: './assignmentResubmitRequest', // `.hbs` extension is appended automatically
      context: { // ✏️ filling curly brackets with content
        name: user.fullName,
        assignmentName,
        remarks
      },
    });
  }

  async sendCourseCertificateMail({
    email,
    courseName,
    fullName,
    url
  }) {
    await this.mailerService.sendMail({
      to: email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Upspot Academy - Course Certificate',
      template: './courseCertificate', // `.hbs` extension is appended automatically
      context: { // ✏️ filling curly brackets with content
        name: fullName,
        courseName,
        url
      },
    });
  }

}
