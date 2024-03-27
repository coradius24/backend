import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DbModule } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailModule } from './mail/mail.module';
import { FilesModule } from './files/files.module';
import { CourseCategoryModule } from './course-category/course-category.module';
import { CoursesModule } from './courses/courses.module';
import { ToolsModule } from './tools/tools.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AccessControlModule } from './access-control/access-control.module';
import { BlogsModule } from './blogs/blogs.module';
import { CacheModule } from '@nestjs/cache-manager';
import type { RedisClientOptions } from 'redis';
import { EarningReportsModule } from './earning-reports/earning-reports.module';
import { NotificationModule } from './notification/notification.module';
import * as redisStore from 'cache-manager-redis-store';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SchedulerModule } from './scheduler/scheduler.module';
import { GalleryModule } from './gallery/gallery.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { PreRegistrationModule } from './pre-registration/pre-registration.module';
import { CourseCertificateModule } from './course-certificate/course-certificate.module';
import { SmsModule } from './sms/sms.module';
import { CmsModule } from './cms/cms.module';
import { BullModule } from '@nestjs/bull';
import { SupportsModule } from './supports/supports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'development-local'
          ? '.development.local.env'
          : process.env.NODE_ENV === 'development'
            ? '.development.env'
            : '.production.env',
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService) => {
        const redisStoreOptions: RedisClientOptions = {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          ttl: 0,
          password: configService.get<number>('REDIS_PASSWORD'),
        };

        return {
          store: redisStore,
          ...redisStoreOptions,
        };
      },
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule], // Import ConfigModule to use ConfigService
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          password: configService.get<any>('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
   


    DbModule,
    UsersModule,
    AuthModule,
    MailModule,
    FilesModule,
    CourseCategoryModule,
    CoursesModule,
    EnrollmentsModule,
    ToolsModule,
    PaymentsModule,
    ReviewsModule,
    AccessControlModule,
    BlogsModule,
    EarningReportsModule,
    NotificationModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    SchedulerModule,
    GalleryModule,
    AssignmentsModule,
    PreRegistrationModule,
    CourseCertificateModule,
    SmsModule,
    CmsModule,
    SupportsModule,
    // BullModule.forRoot({
    //   redis: {
    //     host: 'localhost',
    //     port: 6379,
    //   },
    // }),



  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
