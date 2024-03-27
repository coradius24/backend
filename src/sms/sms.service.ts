
import { User } from 'src/users/entities/user.entity';
import { CreateSmsDto } from './dto/create-sms.dto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { transformPhone } from 'src/pre-registration/dto/create-pre-registration.dto';
import { SmsReceiver } from './enums/sms.enums';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In, Not } from 'typeorm';
import { Course } from 'src/courses/entities/course.entity';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { Payment } from 'src/payments/entities/payment.entity';
import { PaymentStatus } from 'src/payments/enums/payments.enum';

@Injectable()
export class SmsService {
  constructor(
    private configService: ConfigService,
    private readonly httpService: HttpService,    @InjectRepository(User)  private userRepository: Repository<User>,
    @InjectRepository(Enrollment)  private enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Course)  private courseRepository: Repository<Course>,
    @InjectRepository(Payment) private paymentRepository: Repository<Payment>,


  ){}

  async sendBulkSms(mobileNumbers, body) {
    const toUser = mobileNumbers?.map(number => `88${transformPhone(number)}`)
    const url = this.configService.get('SMS_ENDPOINT') + `?apikey=${this.configService.get('SMS_API_KEY')}&secretkey=${this.configService.get('SMS_API_SECRET')}&content=[{"callerID":"8809612","toUser":"${toUser}","messageContent": "${body}"}]`
    const res = await this.httpService.axiosRef.get(url)
    return {
        success: res?.status === 200
    }
  }

  async sendSmsToReceiverGroup({receiverType, receivers, message}: CreateSmsDto) {
    let phoneNumbers = []
    if(receiverType ===  SmsReceiver.ALL) {
        const users = await this.userRepository.find({
            select: ['mobileNumber'],
            where: {
                mobileNumber: Not(IsNull())
            }
        })
        phoneNumbers = users.map(user=>user.mobileNumber)
    }else if(receiverType ===  SmsReceiver.SPECIFIC_COURSES) {
        const data = await this.enrollmentRepository.find({
            where: {
                courseId: In(receivers)
            },
            relations: {
                user: true
            }
        }) 
        phoneNumbers = data.map(d=> d.user.mobileNumber)
    }else if(receiverType ===  SmsReceiver.BATCH_COURSE_PARENTS) {
        const courses = await this.courseRepository.find({
            select: ['id'],
            where: [{
                parentCourseId: In(receivers)
            },  {
                id: In(receivers)
            }]
        })

        const data = await this.enrollmentRepository.find({
            where: {
                courseId: In(courses?.map(d=> d.id))
            },
            relations: {
                user: true
            }
        }) 
        phoneNumbers = data.map(d=> d.user.mobileNumber)

    }else if(receiverType ===  SmsReceiver.COURSE_CATEGORIES) {
        const courses = await this.courseRepository.find({
            select: ['id'],
            where: [{
                categoryId: In(receivers)
            }]
        })

        const data = await this.enrollmentRepository.find({
            where: {
                courseId: In(courses?.map(d=> d.id))
            },
            relations: {
                user: true
            }
        }) 
        phoneNumbers = data.map(d=> d.user.mobileNumber)

    }else if(receiverType ===  SmsReceiver.HAVING_DUES_OF_SPECIFIC_COURSES) {
        const promises =  receivers.map(async courseId => {
            return  this.getAllDues({paginated: false, courseId, search: "" }, (row) => row.map(d=>d?.user?.mobileNumber))
          }) 
          const promiseRes = await Promise.all(promises)
          promiseRes.forEach(users=>phoneNumbers.push(...users))
    }else if(receiverType ===  SmsReceiver.FULL_PAID_COURSES) {
        const promises =  receivers.map(async courseId => {
            return  this.getFullPaidUserMobileNumberByCourseId(courseId)
          }) 
          const promiseRes = await Promise.all(promises)
          promiseRes.forEach(users=>phoneNumbers.push(...users))
    }
    else if(receiverType ===  SmsReceiver.INDIVIDUAL_USERS) {
        const users = await this.userRepository.find({
            select: ['mobileNumber'],
            where: {
                id: In(receivers),
                mobileNumber: Not(IsNull()) 
            }
        })
        phoneNumbers = users.map(user=>user.mobileNumber)
    }else if(receiverType ===  SmsReceiver.PHONE_NUMBERS) {
        phoneNumbers = [...receivers]
    }
    return await this.sendBulkSms(phoneNumbers, message)
  }

  async checkSmsBalance() {
    const url = this.configService.get('SMS_BALANCE_API')
    const res = await this.httpService.axiosRef.get(url)
    return {
        balance: res?.data?.Balance
    }
  }

  sendWelcomeSms(phone, email) {
    const text = `ধন্যবাদ, আপনার UpSpot Academy একাউন্টটি ${email} থেকে সফল ভাবে রেজিষ্ট্রেশন হয়েছে।`
    return this.sendBulkSms([phone], text)
  }

//   unfortune copy 
async getAllDues({ limit = 10, page = 1, search, courseId, paginated = false }, formatter?) {
    const skip = (page - 1) * limit;
    const take = limit;

    const subquery = this.paymentRepository
      .createQueryBuilder('subquery')
      .select('MAX(subquery.id)', 'lastPaymentId')
      .addSelect('subquery.userId', 'userId')
      .addSelect('subquery.courseId', 'courseId')
      .groupBy('subquery.userId, subquery.courseId')
      .where('subquery.paymentStage = :paymentStage', {
        paymentStage: "completed"
      });
    // .andWhere('subquery.due > 0');

    const query = this.paymentRepository
      .createQueryBuilder('payment')
      .innerJoin(
        `(${subquery.getQuery()})`,
        'latestPayments',
        'latestPayments.lastPaymentId = payment.id'
      )
      .andWhere('payment.paymentStage = :paymentStage', { paymentStage: PaymentStatus.COMPLETED })

    if (search) {
      query.andWhere('(user.fullName LIKE :search OR user.email LIKE :search OR user.id = :searchId)', {
        search: `%${search}%`,
        searchId: search,
      });
    }

    if (courseId !== undefined) {
      query.andWhere('payment.courseId = :courseId', { courseId });
    }

    if (paginated) {
      const [payments, totalCount] = await query
        .andWhere('payment.due > 0')
        .orderBy('payment.id', 'DESC')
        .skip(skip)
        .take(take)
        .leftJoinAndMapOne('payment.course', 'payment.course', 'course', 'course.id = payment.courseId')
        .leftJoinAndMapOne('payment.user', 'payment.user', 'user', 'user.id = payment.userId')
        .getManyAndCount();

      return {
        totalCount,
        page,
        limit,
        results: formatter ? formatter(payments) : payments.map((payment) => ({
          due: payment.due,
          id: payment.id,
          userId: payment?.user?.id,
          course: {
            title: payment.course?.title,
            batchTitle: payment.course?.batchTitle,
            id: payment.course?.id,
          },
          user: {
            fullName: payment?.user?.fullName,
            id: payment?.user?.id,
            mobileNumber: payment?.user?.mobileNumber,

            email: payment?.user?.email,
          }
        })),
      };
    } else {
      const results = await query
        .andWhere('payment.due > 0')
        .orderBy('payment.id', 'DESC')
        .leftJoinAndMapOne('payment.course', 'payment.course', 'course', 'course.id = payment.courseId')
        .leftJoinAndMapOne('payment.user', 'payment.user', 'user', 'user.id = payment.userId')
        .getMany();

      return formatter ? formatter(results) : results.map((payment) => ({
        due: payment.due,
        id: payment.id,
        course: {
          title: payment.course?.title,
          batchTitle: payment.course?.batchTitle,
          id: payment.course?.id,
        },
        userId: payment?.user?.id,
        user: {
          fullName: payment?.user?.fullName,
          id: payment?.user?.id,
          email: payment?.user?.email,
        }
      }));
    }
  }

//   unfortunate copy
async getFullPaidUserMobileNumberByCourseId(courseId) {
    const fullPaidCourses = await this.paymentRepository.find({
      where: {
        courseId,
        isFullPaid: true
      },
      relations: { user: true },
      select: ['user']
    })
    return fullPaidCourses?.map(course => course.user?.mobileNumber)
  }

}
