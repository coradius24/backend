import { HttpModule } from '@nestjs/axios';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { User } from 'src/users/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Global, Module, forwardRef } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';
import { Course } from 'src/courses/entities/course.entity';
import { Payment } from 'src/payments/entities/payment.entity';

@Global()
@Module({
  imports: [HttpModule,TypeOrmModule.forFeature([User, Enrollment, Course, Payment])],
  controllers: [SmsController],
  providers: [SmsService, ConfigService],
  exports : [SmsService]
})
export class SmsModule {}
