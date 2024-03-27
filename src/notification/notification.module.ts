import { LiveClass } from 'src/courses/entities/live-class.entity';
import { NotificationToken } from './entities/notification-token.entity';
import { Course } from 'src/courses/entities/course.entity';
import { Payment } from './../payments/entities/payment.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { NoticeController } from './notice.controller';
import { NoticeDepartment } from './entities/notice-department.entity';
import { Notice } from './entities/notice.entity';
import { EnrollmentsModule } from './../enrollments/enrollments.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeenNotification } from './entities/seen-notification.entity';
import { Global, Module, forwardRef } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { Notification } from './entities/notification.entity';
import { NotificationController } from './notification.controller';
import { NotificationAdminController } from './notification.admin.controller';
import { NoticeAdminController } from './notice.admin.controller';
import { NoticeService } from './notice.service';
import { User } from 'src/users/entities/user.entity';
import { SubscribedTopic } from './entities/subscribed-topic.entity';

@Global()
@Module({
  imports: [ScheduleModule, forwardRef(() => EnrollmentsModule) ,TypeOrmModule.forFeature([Notification, SeenNotification,Notice, NoticeDepartment, Payment, Course, User, NotificationToken, SubscribedTopic, LiveClass])],
  providers: [NotificationGateway, NotificationService, NoticeService],
  controllers: [NotificationController, NotificationAdminController, NoticeAdminController, NoticeController],
  exports: [NotificationGateway, NotificationService, NoticeService, ScheduleModule]
})
export class NotificationModule {}
