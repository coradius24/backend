import { UsersModule } from './../users/users.module';
import { CoursesModule } from './../courses/courses.module';
import { EarningReportsModule } from './../earning-reports/earning-reports.module';
import { AdminPaymentsController } from './payments.admin.controller';
import { EnrollmentsModule } from './../enrollments/enrollments.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { HttpModule } from '@nestjs/axios';
import { Payment } from './entities/payment.entity';
import { Course } from 'src/courses/entities/course.entity';
import { User } from 'src/users/entities/user.entity';
import { ToolsModule } from 'src/tools/tools.module';

@Module({
  imports: [HttpModule, UsersModule,  EnrollmentsModule , EarningReportsModule, ToolsModule, TypeOrmModule.forFeature([Payment, Course, User]), CoursesModule],
  controllers: [PaymentsController, AdminPaymentsController],
  providers: [PaymentsService, ConfigService],
  exports: [PaymentsService, ConfigService]
})
export class PaymentsModule {}
