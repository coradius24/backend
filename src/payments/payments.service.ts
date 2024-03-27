import { AsyncParser } from '@json2csv/node';
import { generateDateList, getDateBefore } from 'src/common/utils/utils';
import { NotificationGateway } from './../notification/notification.gateway';
import { AccessControlService } from './../access-control/access-control.service';
import { EarningReportsService } from './../earning-reports/earning-reports.service';
import { PaginationDto } from './../common/dto/pagination.dto';
import { EnrollmentsService } from 'src/enrollments/enrollments.service';
import { User } from 'src/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment } from './entities/payment.entity';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository, Like } from 'typeorm';
import { Course } from 'src/courses/entities/course.entity';
import { PaymentMethod, PaymentStatus } from './enums/payments.enum';
import * as shurjopay from "shurjopay"
import { ToolsService } from 'src/tools/tools.service';
import { NotificationReceiver } from 'src/notification/enums/notification.enums';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import CouponService from 'src/courses/coupon.service';
import { CouponDiscountType } from 'src/courses/entities/coupon.entity';
import * as moment from 'moment-timezone';
import * as  ExcelJS from 'exceljs';
import { UsersService } from 'src/users/users.service';
import { transformPhone } from 'src/pre-registration/dto/create-pre-registration.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PaymentsService {
  private shurjopay;
  private logger = new Logger(PaymentsService.name)
  constructor(
    private readonly httpService: HttpService,
    private readonly enrollmentService: EnrollmentsService,
    private readonly toolsService: ToolsService,
    private readonly earningReportService: EarningReportsService,
    private readonly accessControlService: AccessControlService,
    private readonly notificationGateway: NotificationGateway,
    private readonly couponService: CouponService,
    private readonly userService: UsersService,

    private eventEmitter: EventEmitter2,
    private configService:
      ConfigService,
    @InjectRepository(Payment) private paymentRepository: Repository<Payment>,
    @InjectRepository(Course) private courseRepository: Repository<Course>,
    @InjectRepository(User) private userRepository: Repository<User>,


  ) {
    this.shurjopay = shurjopay()
    this.shurjopay.config(
      'https://sandbox.shurjopayment.com',
      'sp_sandbox', 'pyyk97hu&6u6',
      'SP',
      `${this.configService.get('CLIENT_DOMAIN')}/shurjopay-response`

    );

    eventEmitter.on('course.accessGiven', async (payload) => {
      const course = await this.courseRepository.findOneBy({ id: payload.courseId })
      const enrollCount = await this.enrollmentService.getEnrollmentCountOfACourse(course.id)

      this.courseRepository.update(course.id, {
        enrollCount
      })
      // if (course.enableSupport) {
      //   try {
      //     await this.chatSignup({
      //       batchTitle: course.batchTitle,
      //       userId: payload.userId,
      //       supportBoard: course.supportDepartment
      //     })
      //     this.logger.log(`Completed signup for support board ${course.supportDepartment}, userId: ${payload.userId} `)

      //   } catch (error) {
      //     this.logger.error(`Failed to signup for support board ${course.supportDepartment}, userId: ${payload.userId} `, JSON.stringify(error, null, 2))
      //   }
      // }

      try {
        this.notificationGateway.syncPushTopics(payload.userId)
      } catch (error) {
        
      }
      return this.notificationGateway.sendInstantNotification({
        receiverType: NotificationReceiver.INDIVIDUAL_USERS,
        receivers: [payload.userId],
        message: `"${course.title}" কোর্সে আপনাকে স্বাগতম 
          `
      })
    })

  }
  async chatCourseWiseSignup({ courseId, supportBoard }) {
    
    this.eventEmitter.emit('chat.bulkSignUp', {courseId, supportBoard})
    return {
      message: "Submitted for processing"
    }
  }

  @OnEvent('chat.bulkSignUp')
  async handleBulkChatSignup(payload) {
    console.log("Start processing bulk signup")
    const enrolledData = await this.enrollmentService.findAllEnrollments({ limit: 10000000, page: 1 }, { search: '', courseId: payload.courseId })
    const chatSignupPromises = enrolledData?.results?.map((enrollmentData) => {
      return this.chatSignup({
        userId: enrollmentData?.user?.id,
        batchTitle: enrollmentData?.course?.batchTitle,
        supportBoard: payload?.supportBoard
      })
    })


    await Promise.allSettled(chatSignupPromises)
    this.logger.log(`Bulk chat signup completed for course: ${payload.courseId}`)
  }
  async chatSignup({
    userId,
    batchTitle,
    supportBoard
  }) {

    const user = await this.userRepository.findOne({
      where: {
        id: userId
      }
    })

    const email = user.email
    const firstName = user.fullName
    const phoneNumber = user.mobileNumber
    const profileImage = user.photo?.url

    const saltOrRounds = 10;
    const passwordHash = await bcrypt.hash(email, saltOrRounds);
    const body: any = {
      email,
      password: passwordHash,
      first_name: firstName,
      last_name: ' ',
      batch: batchTitle,
      phone_number: phoneNumber,
      // profile_image: profileImage
    }

    if (profileImage) {
      body.profile_image = profileImage
    }




    const res = await fetch(`https://upspot.org/${supportBoard}/api_for_upspot_academy.php`, {
      headers: {
        accept: "application/json, text/plain, */*",
        "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: new URLSearchParams(body),
      method: "post",
    })
    return res.json()

    // const res: any = await this.httpService.axiosRef.post(`https://upspot.org/${supportBoard}/include/ajax.php`, formData, {
    //   headers: {"Content-Type": "application/x-www-form-urlencoded"}
    // })

    // console.log("res", res)
    // return res?.data

  }

  async createPaymentGeneric(payload: Omit<Payment, 'course' | 'due' | 'isFullPaid' | 'discountAmount' | 'user' | 'id' | 'createdAt' | 'updatedAt' | 'mainPrice' | 'bankName'> & { courseId: number }, byAdmin = false) {
    const { couponApplied, courseId, userId, amount, paymentStage, paymentMethod, manuallyInsertedBy, transactionId } = payload;

    const course = await this.courseRepository.findOne({
      where: {
        id: courseId
      }
    })
    if (!course) {
      throw new BadRequestException("No course with this courseId: " + courseId)
    }
    const previousPaymentsOfTheUser = await this.paymentRepository.findOne({
      where: {
        userId,
        course: { id: courseId },
        paymentStage: PaymentStatus.COMPLETED
      },
      order: { createdAt: "DESC" },

    })
    if (previousPaymentsOfTheUser?.isFullPaid) {
      return {
        message: "Already payment full filled with no dues",
        status: "paid",
        lastPaymentId: previousPaymentsOfTheUser.id
      }
      // throw new BadRequestException("Already payment full filled with no dues")
    }

    const newPayment: any = await this.paymentRepository.create({
      course,
      userId: userId,
      discountAmount: 0,
      amount,
      isFullPaid: false,
      paymentStage: paymentStage || 'initialized',
      due: 0,
      paymentMethod,
      manuallyInsertedBy,
      transactionId,
      mainPrice: course.discountedPrice
    })

    if (couponApplied && (!previousPaymentsOfTheUser?.due || byAdmin) ) {
      // check for token validatily and get discount amount
      try {
        const couponDetails = await this.couponService.checkValidity({ code: couponApplied, courseId, requestingUser: { id: userId } })

        if (couponDetails) {
          const discountAmount = couponDetails.discountType === CouponDiscountType.PERCENTAGE ? (couponDetails.discountAmount / course.discountedPrice) * 100 : couponDetails.discountAmount;
          newPayment.couponApplied = couponApplied
          newPayment.discountAmount = discountAmount > course.discountedPrice ? course.discountedPrice : discountAmount;
        }
      } catch (error) {

      }

    }
    const coursePrice = course?.discountedPrice; ///course price
    const totalPaymentGranted = amount + newPayment.discountAmount;

    if (totalPaymentGranted >= coursePrice && !previousPaymentsOfTheUser?.due) {
      newPayment.isFullPaid = true
    } else {
      if (previousPaymentsOfTheUser?.due) {
        const newDue = previousPaymentsOfTheUser.due - amount;
        if (newDue <= 0) {
          newPayment.due = 0;
          newPayment.isFullPaid = true;
        }else if((previousPaymentsOfTheUser?.due - totalPaymentGranted) <= 0) {
          newPayment.due = 0;
          newPayment.isFullPaid = true;
        } else {
          newPayment.due = newDue;
        }
      } else {
        newPayment.due = (coursePrice - totalPaymentGranted);
      }

    }


    return newPayment;

  }

  async acknowledgePaymentGeneric(paymentId, transactionId?) {

    const paymentData = await this.paymentRepository.findOne({
      where: {
        id: paymentId
      },
      relations: {
        course: true
      }
    })

    if (paymentData?.paymentStage != PaymentStatus.COMPLETED) {
      await this.paymentRepository.update(paymentId, {
        transactionId,
        paymentStage: PaymentStatus.COMPLETED
      })
    }

    const previousPaymentsForTheCourse = await this.paymentRepository.findBy({
      userId: paymentData.userId,
      course: {
        id: paymentData.course.id
      }
    })

    const totalAmountPaidSoFar = previousPaymentsForTheCourse.reduce((acc, crr) => acc + crr.amount, 0)
    if (paymentData.isFullPaid || (paymentData.course.allowPartialPaymentEnrollment && totalAmountPaidSoFar >= paymentData.course.minimumPartialPayment)) {
      let toolsAccess = false;
      if (paymentData.isFullPaid) {
        try {
          const toolsAccessGiven = await this.toolsService.giveCourseAssociateTools(paymentData.course.id, paymentData.userId)

          this.logger.log(` courseAssociate toolsAccessGiven to userId: ${paymentData.userId}`, toolsAccessGiven)
        } catch (error) {
          this.logger.error(`Tools Access giving error ,userId: ${paymentData.userId}`, error)
        }


        if (paymentData.course.allowWallet) {
          // giving feature access of e Wallet
          try {

            const featuredAdded = await this.accessControlService.addToFeatureUserMap({
              userId: paymentData.userId,
              featureId: 'student_wallet'
            })
            this.logger.log(`student_wallet Feature added, userId: ${paymentData.userId}`, featuredAdded)
          } catch (error) {
            this.logger.error(`student_wallet Feature adding error: ${paymentData.userId}`, error)

          }
        }
        if (paymentData.course.allowEarningReport) {
          // giving feature access of earning Report 
          try {
            const featureAdded = await this.accessControlService.addToFeatureUserMap({
              userId: paymentData.userId,
              featureId: 'student_earning_report'
            })
            this.logger.log(`student_earning_report Feature added, userId: ${paymentData.userId}`, featureAdded)

          } catch (error) {
            this.logger.error(`student_earning_report Feature adding error, UserId ${paymentData.userId}`, error)

          }


        }

        if (paymentData.course.allowSmartLinkGeneration) {
          // creating smart link
          try {
            const featureAdded = await this.earningReportService.createShortLink(paymentData.userId, paymentData.course.id)
            this.logger.log(`SmartLink generated for user: ${paymentData.userId}`, featureAdded)

          } catch (error) {
            this.logger.error(`SmartLink generated error, userId: ${paymentData.userId}`, error)

          }
        }


        toolsAccess = true
      }
      try {
        const enrolled = await this.enrollmentService.create({
          userId: paymentData.userId,
          courseId: paymentData.course.id
        })
        // this.eventEmitter.emit('course.accessGiven', {
        //   userId: paymentData.userId, courseTitle: paymentData.course.title
        // })
        this.logger.log(`Course enrolled , courseId : ${paymentData.course.id}, userId: ${paymentData.userId}`, enrolled)
        // todo
        return {
          message: "Course Enrollment completed!",
          toolsAccess
        }
      } catch (error) {
        this.logger.error(`Course enrollment error , courseId : ${paymentData.course.id}, userId: ${paymentData.userId}`, error)

        return {
          message: "Already enrolled!",
          toolsAccess
        }
      }

    }

  }

  async createPaymentByAdmin(manuallyInsertedBy, createPaymentDto) {

    const { amount, courseId, couponApplied, userId, transactionId, paymentMethod } = createPaymentDto;
    const user = await this.userRepository.findOne({
      where: {
        id: userId
      }
    })
    if (!user) {
      throw new NotFoundException("User not found!")

    }
    const newPayment = await this.createPaymentGeneric({
      userId,
      amount,
      courseId,
      couponApplied,
      paymentStage: PaymentStatus.COMPLETED,
      paymentMethod: paymentMethod || PaymentMethod.SHURJOPAY,
      manuallyInsertedBy,
      transactionId
    }, true)
    let paymentId = null;

    if (newPayment?.status !== 'paid') {
      const paymentSaved = await this.paymentRepository.save(newPayment);
      this.logger.log("Payment Saved", paymentSaved)
      paymentId = paymentSaved.id

    } else {
      paymentId = newPayment.lastPaymentId
    }
    await this.acknowledgePaymentGeneric(paymentId, transactionId)
    return { paymentId, courseId }

  }

  async createShurjoPayPayment(userId, createPaymentDto: CreatePaymentDto, res) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId
      }
    })
    if (!user) {
      throw new NotFoundException("User not found!")

    }
    const { amount, courseId, couponApplied } = createPaymentDto;
    const newPayment = await this.createPaymentGeneric({
      userId,
      amount,
      courseId,
      couponApplied,
      paymentStage: 'initialized',
      paymentMethod: PaymentMethod.SHURJOPAY
    })

    const paymentSaved = await this.paymentRepository.save(newPayment);

    this.shurjopay.makePayment({
      "amount": newPayment.amount,
      "order_id": String(paymentSaved.id),
      "customer_city": "N/A",
      "customer_name": `${user.fullName} (${user.id})`,
      "customer_address": "N/A",
      "currency": "BDT",
      "customer_email": user.email,
      "customer_phone": user.mobileNumber || "N/A",
      "client_ip": 'N/A',
      "value_1": user.id
    },
      (response_data) => {
        return res.send(response_data)

      },
      (error) => {
        return res.send(error)

        // TODO Handle error response
      });



  }


  // This endpoint verifies the payment with the given transaction ID
  async verifyShurjoPayPayment(sp_trxn_id, res) {
    try {
      this.shurjopay.verifyPayment(
        sp_trxn_id,
        async (response_data) => {

          if (response_data?.[0].sp_code != 1000) {
            return res.status(400).send({ success: false, error: "Invalid payment!" })
          }
          const ack = await this.acknowledgePaymentGeneric(response_data?.[0]?.customer_order_id)
          res.status(200).send({
            success: true,
            enrollmentStatus: ack?.message,
            toolsAccess: ack?.toolsAccess
          });
        },
        (error) => {
          res.status(400).send({ success: false, error: error.message });
        }
      );
    } catch (err) {

      res.status(400).send({ success: false, error: err.message });
    }
  }

  async createBkashPayment(userId: number, createPaymentDto: CreatePaymentDto) {
    const { amount, courseId, couponApplied } = createPaymentDto;
    const newPayment = await this.createPaymentGeneric({
      userId,
      amount,
      courseId,
      couponApplied,
      paymentStage: 'initialized',
      paymentMethod: PaymentMethod.BKASH_MERCHANT_WEB
    })

    const merchantInvoiceNumber = `C-${courseId}-B-${'1'}-I-${newPayment.id}`;
    await this.paymentRepository.save(newPayment);

    const token_res: any = await this.httpService.axiosRef.post(this.configService.get('BKASH_BASE_URL') + '/checkout/token/grant', {
      app_key: this.configService.get('BKASH_APP_KEY'),
      app_secret: this.configService.get('BKASH_APP_SECRECT')
    }, {
      headers: {
        username: this.configService.get('BKASH_USERNAME'),
        password: this.configService.get('BKASH_PASSWORD'),
      }
    })
    const { id_token } = token_res?.data;
    await this.httpService.axiosRef.post(this.configService.get('BKASH_BASE_URL') + '/checkout/payment/create', {
      amount,
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber
    }, {
      headers: {
        'X-APP-Key': this.configService.get('BKASH_APP_KEY'),
        Authorization: "Bearer " + id_token
      }
    })

    return 'This action adds a new payment';
  }

  async executeBkashPayment(userId: number, createPaymentDto: CreatePaymentDto) {
    const { amount, courseId, couponApplied } = createPaymentDto;
    const merchantInvoiceNumber = '';
    this.createPaymentGeneric({
      userId,
      amount,
      courseId,
      couponApplied,
      paymentStage: 'initialized',
      paymentMethod: PaymentMethod.BKASH_MERCHANT_WEB
    })

    const token_res: any = await this.httpService.axiosRef.post(this.configService.get('BKASH_BASE_URL') + '/checkout/token/grant', {
      app_key: this.configService.get('BKASH_APP_KEY'),
      app_secret: this.configService.get('BKASH_APP_SECRECT')
    }, {
      headers: {
        username: this.configService.get('BKASH_USERNAME'),
        password: this.configService.get('BKASH_PASSWORD'),
      }
    })
    const { id_token } = token_res?.data;
    await this.httpService.axiosRef.post(this.configService.get('BKASH_BASE_URL') + '/checkout/payment/create', {
      amount,
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber
    }, {
      headers: {
        'X-APP-Key': this.configService.get('BKASH_APP_KEY'),
        Authorization: "Bearer " + id_token
      }
    })

    return 'This action adds a new payment';
  }




  async getGetCourseBaseLatestPaymentIdsOfUser(userId) {
    const payments = await this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.paymentStage = :paymentStage', {
        paymentStage: "completed"
      })
      .select(['payment.courseId', 'MAX(payment.id) as lastPaymentId'])
      .where('payment.userId = :userId', { userId })
      .groupBy('courseId')
      .getRawMany();

    return payments

  }

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



  async getGetCourseBaseLatestPaymentIds() {
    const payments = await this.paymentRepository
      .createQueryBuilder('payment')
      .andWhere('payment.paymentStage = :paymentStage', { paymentStage: PaymentStatus.COMPLETED }).select(['payment.courseId', 'MAX(payment.id) as lastPaymentId'])
      // .where('payment.userId = :userId', { userId })
      .groupBy('courseId')
      .getRawMany();

    return payments

  }

  async getPaymentsOfAUser(userId: number, { limit = 10, page = 1 }: PaginationDto) {
    const skip = (page - 1) * limit;
    const take = limit
    const query: any = {
      userId
    }
    const getLatestPayments = await this.getGetCourseBaseLatestPaymentIdsOfUser(userId)


    const latestPaymentIdCourseMap: any = {}
    getLatestPayments?.forEach(data => {
      latestPaymentIdCourseMap[data.payment_courseId] = data.lastPaymentId
    })
    const [payments, totalCount] = await this.paymentRepository.findAndCount({
      where: query,
      order: {
        id: 'DESC'
      },
      skip,
      take,
      relations: {
        course: true,
      },

    })

    return {
      totalCount,
      page,
      limit,
      results: payments.map(payment => ({
        ...payment,
        isLatestPaymentForTheCourse: latestPaymentIdCourseMap[payment.course?.id] === payment.id,
        course: {
          title: payment.course?.title,
          batchTitle: payment.course?.batchTitle,
          id: payment.course?.id, thumbnail: payment?.course?.thumbnail?.url
        }
      }))
    }
  }

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
  async getPayments({ limit = 10, page = 1, startDate: _startDate, endDate: _endDate, paginated, paymentStage, search }, resultFormatter?) {
    const skip = (page - 1) * limit;
    const take = limit
    const query: any = {}
    if (search) {
      query.user = {};
      if (Number(search)  && !search?.startsWith('0')) {
        query.user.id = search
      } else {
        query.user = [
          { fullName: Like(`%${search}%`) },
          { email: Like(`%${search}%`) },
          { mobileNumber: Like(`%${search}%`) },

        ];
      }

    }

    if (paymentStage && paymentStage !== 'all') {
      query.paymentStage = paymentStage;
    }
    if (_startDate && _endDate) {
      const startDate = moment(_startDate).startOf('day').toDate()
      const endDate = moment(_endDate).endOf('day').toDate()
      query.createdAt = Between(startDate, endDate)
    } else if (_startDate) {
      const startDate = moment(_startDate).startOf('day').toDate()
      query.createdAt = MoreThanOrEqual(startDate)
    } else if (_endDate) {
      const endDate = moment(_endDate).endOf('day').toDate()
      query.createdAt = LessThanOrEqual(endDate)

    }
    const extraFns: any = {

    }
    if (paginated) {
      extraFns.skip = skip;
      extraFns.take = take;
    }

    const [payments, totalCount] = await this.paymentRepository.findAndCount({
      where: query,
      ...extraFns,
      relations: {
        course: true,
        user: true,
      },
      order: {
        id: 'DESC'
      }
    })


    return {
      totalCount,
      page,
      limit,
      results: resultFormatter ? resultFormatter(payments) : payments.map(payment => ({
        ...payment, course: { title: payment.course?.title, price: payment.course?.discountedPrice || payment?.course?.price, batchTitle: payment.course?.batchTitle, id: payment.course?.id, thumbnail: payment?.course?.thumbnail?.url, }, user: {
          fullName: payment?.user?.fullName,
          id: payment?.user?.id,
          email: payment?.user?.email
        }
      }))
    }
  }

  async downloadCsv(query) {
    const formatter = (payments) => payments.map(payment => ({
      ...payment,
      courseTitle: payment.course?.title,
      batchTitle: payment.course?.batchTitle,
      courseId: payment.course?.id,
      fullName: payment?.user?.fullName,
      userId: payment?.user?.id,
      email: payment?.user?.email,
      mobileNumber: '+88' + payment?.user?.mobileNumber,
      createdAt: moment(payment.createdAt).format('lll')
    }))

    const data = await this.getPayments(query, formatter)
    const opts = {
      fields: [
        {
          label: 'UserId',
          value: 'userId'
        },
        {
          label: 'Name',
          value: 'fullName'
        },
        {
          label: 'Mobile Number',
          value: 'mobileNumber'
        },
        {
          label: 'Email',
          value: 'email'
        },
        {
          label: 'Amount Paid',
          value: 'amount'
        },
        {
          label: 'Due Amount',
          value: 'due'
        },
        {
          label: 'Discount',
          value: 'discountAmount'
        },
        {
          label: 'Payment Method',
          value: 'paymentMethod'
        },
        {
          label: 'Course',
          value: 'courseTitle'
        },
        {
          label: 'Batch',
          value: 'batchTitle'
        },
        {
          label: 'Date Time',
          value: 'createdAt'
        }
      ]
    };
    const transformOpts = {};
    const asyncOpts = {};
    const parser = new AsyncParser(opts, asyncOpts, transformOpts);
    const csv = await parser.parse(data?.results).promise();
    return csv
  }

  async downloadDueListCsv(query) {
    const formatter = (payments) => payments.map(payment => ({
      due: payment.due,
      courseTitle: payment.course?.title,
      batchTitle: payment.course?.batchTitle,
      fullName: payment?.user?.fullName,
      email: payment?.user?.email,
      userId: payment?.user?.id,
      mobileNumber: '+88' + payment?.user?.mobileNumber
    }))

    const data = await this.getAllDues(query, formatter)
    const opts = {
      fields: [
        {
          label: 'UserId',
          value: 'userId'
        },
        {
          label: 'Name',
          value: 'fullName'
        },
        {
          label: 'Mobile Number',
          value: 'mobileNumber'
        },
        {
          label: 'Email',
          value: 'email'
        },

        {
          label: 'Due Amount',
          value: 'due'
        },
        {
          label: 'Course',
          value: 'courseTitle'
        },
        {
          label: 'Batch',
          value: 'batchTitle'
        }
      ]
    };
    const transformOpts = {};
    const asyncOpts = {};
    const parser = new AsyncParser(opts, asyncOpts, transformOpts);
    const csv = await parser.parse(data).promise();
    return csv
  }

  async getInvoice(userId, courseId) {
    const previousPaymentsOfTheUser = await this.paymentRepository.find({
      where: {
        userId,
        course: { id: courseId },
        paymentStage: PaymentStatus.COMPLETED
      },
      order: { createdAt: "DESC" },

    })

    const lastPayment = previousPaymentsOfTheUser?.[0]

    if (!lastPayment) {
      const courseData = await this.courseRepository.findOne({
        where: {
          id: courseId
        },
        select: ['id', 'discountedPrice']
      })

      return {
        due: courseData?.discountedPrice,
        isFullPaid: false,
        totalPaid: 0,
        discounted: 0,
      }
    }

    const summary = previousPaymentsOfTheUser?.reduce((acc, crr) => ({ amount: acc.amount + crr.amount, discountAmount: acc.discountAmount + crr.discountAmount }), { amount: 0, discountAmount: 0 })

    return {
      due: lastPayment?.due,
      isFullPaid: lastPayment?.isFullPaid,
      totalPaid: summary.amount,
      discounted: summary.discountAmount,

    }
  }



  async getPaymentsStats() {
    const totalDuesAmount = await this.paymentRepository.sum('due', {
      paymentStage: PaymentStatus.COMPLETED
    })
    const totalPaidAmount = await this.paymentRepository.sum('amount', {
      paymentStage: PaymentStatus.COMPLETED
    })

    return {
      totalDuesAmount,
      totalPaidAmount
    }
  }

  async getDailyPaymentSpikes(_startDate = getDateBefore(15), _endDate: Date = new Date()) {
    try {

      const startDate = moment(_startDate).tz('Asia/Dhaka').startOf('day').toDate()
      const endDate = moment(_endDate).tz('Asia/Dhaka').endOf('day').toDate()
      const paymentData = await this.paymentRepository
        .createQueryBuilder('payment')
        .select('DATE_FORMAT(CONVERT_TZ(payment.createdAt, \'+00:00\', \'+06:00\'), \'%Y-%m-%d\') as paymentDate')
        .addSelect('SUM(payment.amount) as paymentAmount')
        .where('payment.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
        .andWhere('payment.paymentStage = :paymentStage', { paymentStage: PaymentStatus.COMPLETED })
        .groupBy('paymentDate')
        .orderBy('paymentDate', 'ASC')
        .getRawMany();

      // Generate a list of dates between startDate and endDate
      const dateList = generateDateList(startDate, endDate);


      // Convert paymentData to a map for efficient lookups
      const paymentDataMap = paymentData.reduce((map, entry) => {
        map[entry.paymentDate] = entry;
        return map;
      }, {});


      // Fill in missing dates with 0 amount
      const result = dateList.map((date) => ({
        paymentDate: date,
        paymentAmount: Number(paymentDataMap[date]?.paymentAmount) || 0,
      }));

      return result;


    } catch (error) {
      throw new Error(`Error fetching daily payment spikes: ${error.message}`);
    }
  }

  async bulkPaymentAndEnrollFromSheet(userId, courseId, { buffer }) {
    const workbook = new ExcelJS.Workbook();
    // use readFile for testing purpose
    await workbook.xlsx.load(buffer);
    // await workbook.xlsx.readFile(process.argv[2]);
    const jsonData = [];
    const that = this;
    const usersData = []

    workbook.worksheets.forEach(function (sheet) {
      // read first row as data keys
      const firstRow = sheet.getRow(1);
      if (!firstRow.cellCount) return;
      const keys: any[] = firstRow.values as any[];
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber == 1) return;
        const values = row.values
        const obj = {};
        for (let i = 1; i < keys.length; i++) {
          obj[keys[i]] = values[i];
        }

        let paymentMethod = obj['Payment Method'];
        if (paymentMethod == 'Bkash') {
          paymentMethod = 'bkashManual'
        } else if (paymentMethod == 'Nagad') {
          paymentMethod = 'nagadManual'
        } else {
          paymentMethod = 'cash'
        }
        const finalPayload = {
          courseId: Number(courseId),
          paymentMethod,
          amount: obj['Paid Amount'] || 0,
          userId: '', // TODO,
          couponApplied: '',
          transactionId: obj['Transaction Id'] || '',
          mobileNumber: String(obj['Phone']) ? transformPhone(String(obj['Phone'])?.startsWith('0') ? String(obj['Phone']) : '0' + String(obj['Phone'])) : '',
          email: (obj?.['Email']?.hyperlink || obj?.['Email']).replace('mailto:', ''),
          fullName: obj['Name']

        }
        usersData.push(finalPayload)

      })

    });

    const erollmentPromises = usersData?.map(finalPayload => {



      return new Promise(async (resolve, reject) => {

        const email = finalPayload.email

        that.userService.findByEmail(email).then(async (user) => {
          finalPayload.userId = user.id as any;
          try {
            await that.createPaymentByAdmin(userId, finalPayload)
            resolve(finalPayload)
          } catch (error) {
            that.logger.error(`Error from sheet loop payment create, userId: ${finalPayload.userId}`)
            reject(error)
          }
        }).catch(() => {
          this.logger.error(`Bulk enroll: no user with this email ${email}`)
          finalPayload.reason =`No user with this email ${email}` 
          reject(finalPayload)

          // const mobileNumber = finalPayload.mobileNumber;
          // that.userService.createUser({ email, password: null, fullName: finalPayload.fullName, mobileNumber } as any).then(async user => {
          //   // if(user.email && !createUserDto?.password) {
          //   finalPayload.userId = user.id;
          //   try {
          //     that.eventEmitter.emit('user.invitationSent', { email: user.email })
          //     await that.createPaymentByAdmin(userId, finalPayload)
          //     resolve(finalPayload)

          //   } catch (error) {
          //     that.logger.error(`Error from sheet loop payment create, userId: ${finalPayload.userId}`)
          //     reject(error)

          //   }


          // })

        })
      })

      // jsonData.push(finalPayload);
    })

    return Promise.allSettled(erollmentPromises)
    // return {
    //   success: true
    // }

  }

  async unEnrollAllUsersWithDueByCourseId(courseId) {
    const formatter = (payments) => payments.map(payment => (payment?.user?.id))
    const userIds = await this.getAllDues({ paginated: false, courseId, search: '' }, formatter)
    this.enrollmentService.bulkRemoveByUserAndCourse(courseId, userIds)
  }

  async removePayment(id) {
    return await this.paymentRepository.delete(id)
  }



}
