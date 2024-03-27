import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './../users/users.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { join } from 'path';
import { User } from 'src/users/entities/user.entity';
import { BullModule } from '@nestjs/bull';
import { MailQueueService } from './mail-queue.service';
import { MailProcessor } from './email.processor';

@Global()
@Module({
  imports: [
    // SmsModule,
    TypeOrmModule.forFeature([User]),
    BullModule.registerQueue({
      name: 'email',
      
    }),
    MailerModule.forRoot({
      // transport: 'smtps://user@example.com:topsecret@smtp.example.com',
      // or

      transport: {
        host: 'mail.privateemail.com',

        secure: true,
        port: 465,
        auth: {
          // user: 'no-reply@upspotacademy.com',
          user: 'system@upspotlimited.com',
          pass: 'sBJaPOn73URZ2vw'
      
          // pass: 'sBJaPOn73URZ2vw',
        },
      },
      defaults: {
        from: '"Upspot Academy" <system@upspotlimited.com>',
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(), // or new PugAdapter() or new EjsAdapter()
        options: {
          strict: false,
        },
      },
    }),
  ],
  providers: [MailService, MailQueueService, MailProcessor],
  exports: [MailService, MailQueueService], // 👈 export for DI
})
export class MailModule {}
