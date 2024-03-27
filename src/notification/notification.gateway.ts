import { AccessControlService } from './../access-control/access-control.service';
import { ROLE } from 'src/users/enums/user.enums';
import { Payment } from './../payments/entities/payment.entity';
import { SchedulerService } from './../scheduler/scheduler.service';
import { NotificationType, NotificationReceiver, AdminNotificationChannel } from './enums/notification.enums';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Server, Socket } from 'socket.io';
import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer } from '@nestjs/websockets';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationRoomPrefix, SOCKET_USER_CACHE_HASH_MAP } from './constants/notification.const';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from 'src/auth/constants';
import { Inject, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager'
import { RedisClient } from 'redis';
import { promisify } from 'util';
import { EnrollmentsService } from 'src/enrollments/enrollments.service';
import { Notification } from './entities/notification.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LiveClass } from 'src/courses/entities/live-class.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import { Course } from 'src/courses/entities/course.entity';
import firebase from './firebaseAdmin';
import { sanitizeTopicName } from 'src/common/utils/utils';

@WebSocketGateway({
  namespace: 'notifications',
  cors: '*:*'

})
export class NotificationGateway {
  private redisClient: RedisClient;
  private logger = new Logger(NotificationGateway.name)
  constructor(private readonly notificationService: NotificationService, private jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private enrollmentService: EnrollmentsService,
    private schedulerService: SchedulerService,
    private eventEmitter: EventEmitter2,
    @InjectRepository(Payment) private paymentRepository: Repository<Payment>,
    @InjectRepository(Course) private courseRepository: Repository<Course>,
    @InjectRepository(LiveClass) private liveClassRepository: Repository<LiveClass>,

    
    private accessControlService: AccessControlService,
    private readonly connection: Connection

  ) {
    this.redisClient = this.cacheManager.store.getClient();


    eventEmitter.on('notification.restoreSchedules', async () => {
      const scheduledNotifications = await this.notificationService.getAllScheduledNotifications()
      const jobPromises = scheduledNotifications?.map(scheduledNotification => {
        console.log("Restoring notification schedule:", scheduledNotification.id)
        function addMinutes(date, minutes) {
          date.setMinutes(date.getMinutes() + minutes);

          return date;
        }

        const currentTime = addMinutes(new Date(), 1)
        const deliveryTime = new Date(scheduledNotification.deliveryTime) < currentTime ? currentTime : scheduledNotification.deliveryTime;

        return this.schedulerService.addNotificationSchedule(scheduledNotification.id, deliveryTime, async () => {
          const notification = await this.notificationService.findNotificationById(scheduledNotification.id)
          if(!notification) {
            this.logger.error("Tired to send failed notification", scheduledNotification.id)
            return new NotFoundException('Notification not found, maybe deleted')
          }
          await this.sendInstantNotification(scheduledNotification as any, false)

          if (scheduledNotification.notificationType === NotificationType.NOTICE && Number(scheduledNotification.linkOrId)) {
            try {
              await this.notificationService.updateNotice(scheduledNotification.linkOrId, { isScheduled: false })
            } catch (error) {

            }
          }
          return await this.notificationService.update(scheduledNotification.id, { isScheduled: false })
        })

      });

      await Promise.all(jobPromises)

      // Handle the user creation event in this module
      // Send notifications, update data, etc.
    });

  }
  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.server.on('connection', async (socket) => {
      const [tokenType, token] = socket.handshake.headers.authorization?.split(' ') ?? [];
      if (!token || tokenType != 'Bearer') {
        socket.disconnect(true)
        return;
      }
      let payload;
      try {
        payload = await this.jwtService.verifyAsync(token, {
          secret: jwtConstants.secret,
        });
        if (payload.token_type !== 'login') {
          socket.disconnect(true)
          return;
        }
      } catch (error) {
        socket.disconnect(true)
        return;
      }


      payload.currentSocket = socket.id
      const redisHsetAsync = promisify(this.redisClient.hset).bind(this.redisClient);
      const redisHgetAsync = promisify(this.redisClient.hget).bind(this.redisClient);
      const redisHdelAsync = promisify(this.redisClient.hdel).bind(this.redisClient);

      const socketData = await redisHgetAsync(SOCKET_USER_CACHE_HASH_MAP, payload.sub)

      payload.allSockets = JSON.parse(socketData || "{}").allSockets || []

      payload.allSockets.push(socket.id)

      const joinedRooms = await this.joinUserToAvailableRooms(socket, payload.sub, payload.role)
      payload.rooms = joinedRooms;
      // const usersOldNotifications = await this.notificationService.findNotificationsOfAUser(payload.sub,
      //   joinedRooms
      // )

      // this.server.to(socket.id).emit('previousNotifications', usersOldNotifications)
      await redisHsetAsync(SOCKET_USER_CACHE_HASH_MAP, payload.sub, JSON.stringify(payload));
      socket.on('disconnect', async () => {
        const socketData = await redisHgetAsync(SOCKET_USER_CACHE_HASH_MAP, payload.sub)
        payload.allSockets = JSON.parse(socketData || "{}").allSockets?.filter(socId => socId != socket.id)

        if (payload.allSockets?.length) {
          await redisHsetAsync(SOCKET_USER_CACHE_HASH_MAP, payload.sub, JSON.stringify(payload));
        } else {
          await redisHdelAsync(SOCKET_USER_CACHE_HASH_MAP, payload.sub)
        }

      })
    })
  }


  joinRooms(client: Socket, roomList: string[]) {
    for (const room of roomList) {
      client.join(room);
    }
  }

  // Example usage in a controller or service
  async joinUserToAvailableRooms(socket: Socket, userId: number, userRole: ROLE) {
    const enrolledCoursesOfAUser = await this.enrollmentService.getEnrolledCoursesOfAUser(userId)
    const dataMap = {
      courses: [],
      fullPaidCourses: [],
      coursesWithDues: [],
      parentCourses: [],
      courseCategories: [],
      adminChannels: [],
      instructorOfCourses: [],

    }
    if(userRole !== ROLE.student) {
      if(userRole === ROLE.instructor) {
        dataMap.instructorOfCourses = await this.getCourseIdsOfInstructors(userId)

      }
      dataMap.adminChannels = await this.handleJoinAdminNotificationsRooms(socket, userId, dataMap.instructorOfCourses)
    }
    const promises = []
    enrolledCoursesOfAUser?.forEach((enrollment) => {
      if (!dataMap.courseCategories?.includes(enrollment?.course?.category?.id)) {
        promises.push(this.handleJoinCourseCategoryRoom(socket, enrollment?.course?.category?.id))
        dataMap.courseCategories.push(enrollment?.course?.category?.id)
      }
      if (!dataMap.courses?.includes(enrollment?.course?.id)) {
        promises.push(this.handleJoinCourseRoom(socket, enrollment?.course?.id))
        if (!enrollment?.course?.parentCourseId) {
          dataMap.courses.push(enrollment?.course?.id)
        } else {
          dataMap.parentCourses.push(enrollment?.course?.id)
        }
      }

      if (!dataMap.parentCourses?.includes(enrollment?.course?.id)) {
        promises.push(this.handleJoinParentCourseRoom(socket, enrollment?.course?.parentCourseId))
      }


    })

    const fullPaidCourses = await this.paymentRepository.find({
      where: {
        userId,
        isFullPaid: true
      },
      select: ['courseId']
    })

    const tempPartialDues = [...dataMap.courses]
   
    fullPaidCourses?.forEach((payment) => {
      promises.push(this.handleJoinFullPaidCourseRoom(socket, payment.courseId))
      dataMap.fullPaidCourses.push(payment.courseId)
      const indexToRemove = tempPartialDues.findIndex(
        (dueCourseId) => dueCourseId === payment.courseId
      );
    
      if (indexToRemove !== -1) {
        tempPartialDues.splice(indexToRemove, 1);
      }
    
      dataMap.coursesWithDues = tempPartialDues;
    
    })

    dataMap.coursesWithDues?.forEach(courseId => {
      promises.push(this.handleJoinCourseWithDuesRoom(socket, courseId))
    })



    await Promise.all(promises)
    return dataMap

  }

  @SubscribeMessage('joinCourseRoom')
  handleJoinCourseRoom(client: Socket, courseId: number) {
    client.join(NotificationRoomPrefix.specificCourse + courseId);
  }

  @SubscribeMessage('joinParentCourseRoom')
  handleJoinParentCourseRoom(client: Socket, courseId: number) {
    client.join(NotificationRoomPrefix.batchCourseParent + courseId);
  }

  @SubscribeMessage('joinAdminNotificationsRoom')
  async handleJoinAdminNotificationsRooms(client: Socket, userId, instructorOfCourses) {
    
    const adminNotificationChannelMap = {
      [AdminNotificationChannel.PaymentUpdates]: false,
      [AdminNotificationChannel.AllAssignmentSubmissionUpdates]: false,
      [AdminNotificationChannel.MyAssignmentSubmissionUpdates]: false,
      [AdminNotificationChannel.PendingWithdrawUpdates]: false,
      [AdminNotificationChannel.AwaitingWithdrawUpdates]: false,
      [AdminNotificationChannel.RefundUpdates]: false,
  
    }
    const joinedRooms = []
    try {
      const features = await this.accessControlService.findAllFeaturesByUserId(userId)
      features?.forEach(feature=> {
        if  (feature?.frontendSectionGroup === 'AdminNotificationsChannel') {
          adminNotificationChannelMap[feature.id] = true
          joinedRooms.push(feature.id+'_admin_receiver')
        }
      })
    } catch (error) {
      
    }
   

    if(adminNotificationChannelMap[AdminNotificationChannel.RefundUpdates]) {
      client.join(AdminNotificationChannel.RefundUpdates);
    }
    if(adminNotificationChannelMap[AdminNotificationChannel.PaymentUpdates]) {
      client.join(AdminNotificationChannel.PaymentUpdates);
    }
   
    if(adminNotificationChannelMap[AdminNotificationChannel.PendingWithdrawUpdates]) {
      client.join(AdminNotificationChannel.PendingWithdrawUpdates);
    }

    if(adminNotificationChannelMap[AdminNotificationChannel.AwaitingWithdrawUpdates]) {
      client.join(AdminNotificationChannel.AwaitingWithdrawUpdates);
    }

    if(adminNotificationChannelMap[AdminNotificationChannel.AllAssignmentSubmissionUpdates]) {
      client.join(AdminNotificationChannel.AllAssignmentSubmissionUpdates);
    }else if(adminNotificationChannelMap[AdminNotificationChannel.MyAssignmentSubmissionUpdates]) {
      
      instructorOfCourses?.forEach(courseId => {
        client.join(AdminNotificationChannel.MyAssignmentSubmissionUpdates+':'+courseId);
      })


    }

    return joinedRooms
  }

  @SubscribeMessage('joinCourseCategoryRoom')
  handleJoinCourseCategoryRoom(client: Socket, catId: number) {
    client.join(NotificationRoomPrefix.courseCategory + catId);
  }

  @SubscribeMessage('joinFullPaidCourseRoom')
  handleJoinFullPaidCourseRoom(client: Socket, courseId: number) {
    client.join(NotificationRoomPrefix.fullPaidCourses + courseId);
  }

  @SubscribeMessage('joinCourseWithDuesRoom')
  handleJoinCourseWithDuesRoom(client: Socket, courseId: number) {
    client.join(NotificationRoomPrefix.coursesWithDues + courseId);
  }

  @SubscribeMessage('joinCommonRoom')
  handleJoinCommonRoom(client: Socket) {
    client.join('commonRoom');
  }

  @SubscribeMessage('newNotification')
  create(@MessageBody() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.create(createNotificationDto);
  }

  @SubscribeMessage('findAllNotification')
  findAll() {
    return [{ data: '1' }];
  }

  async sendInstantNotification({
    receiverType,
    receivers = [],
    notificationType = NotificationType.SYSTEM_GENERATED,
    message,
    linkOrId = null,
    body = null
  }: {
    receiverType: NotificationReceiver,
    receivers?: number[],
    notificationType?: NotificationType,
    message: string,
    linkOrId?: any,
    body?: string
  }, saveToDatabase = true) {

    const getRoomPrefix = (receiverType) => {
      switch (receiverType) {
        case NotificationReceiver.SPECIFIC_COURSES:
          return NotificationRoomPrefix.specificCourse
        case NotificationReceiver.BATCH_COURSE_PARENTS:
          return NotificationRoomPrefix.batchCourseParent
        case NotificationReceiver.COURSE_CATEGORIES:
          return NotificationRoomPrefix.courseCategory
        case NotificationReceiver.FULL_PAID_COURSES:
          return NotificationRoomPrefix.fullPaidCourses
        case NotificationReceiver.HAVING_DUES_OF_SPECIFIC_COURSES:
          return NotificationRoomPrefix.coursesWithDues
       
      }

    }
    const notificationBody: Partial<Notification> = {
      notificationType,
      message: message,
      receivers: receivers,
      receiverType: receiverType,
      deliveryTime: new Date(),
      linkOrId,
      body
    }
    if (receiverType === NotificationReceiver.ALL) {
      this.server.emit('notification', notificationBody);
      try {
        await firebase
        .messaging()
        .sendToTopic('allDevices', {
          notification: { title: 'Notification from Upspot Academy', body:   notificationBody.message },
        }, {android: { priority: 'high' }})
        .catch((error: any) => {
          console.error("push notification error",error);
        });
      } catch (error) {
        console.log("Push notification error", error)
      }
    } else if (receiverType === NotificationReceiver.INDIVIDUAL_USERS ) {
      
      receivers?.forEach(async (receiverId) => {
        const redisHgetAsync = promisify(this.redisClient.hget).bind(this.redisClient);

        const socketData = await redisHgetAsync(SOCKET_USER_CACHE_HASH_MAP, receiverId)
        const allSockets = JSON.parse(socketData || "{}").allSockets

        allSockets?.forEach(socketId => {
          this.server.to(socketId).emit('notification', notificationBody);
        });
      })
      try {
        const pushTokens = await this.notificationService.getPushTokensByUserIds(receivers)
        const pushPromises = pushTokens?.map((pushToken) => {
          return firebase
          .messaging()
          .send({
            notification: { title: 'Notification from Upspot Academy', body:  notificationBody.message },
            token: pushToken.token,
            android: { priority: 'high' },
          })
          .catch((error: any) => {
            console.error("push notification error",error);
          });
        })

        await Promise.allSettled(pushPromises)
        
      } catch (error) {
        console.error("push notification error",error);

      }
    }else if(receiverType.includes('_admin_receiver')) {
      const receiver = receiverType?.replace('_admin_receiver', '')
      //  this expection is for assignment submission as notification revicer can be two type here. inlcued personalized
      if(receiverType === NotificationReceiver.ALL_ASSIGNMENT_SUBMISSION_UPDATES_ADMIN_RECEIVER || receiverType === NotificationReceiver.MY_ASSIGNMENT_SUBMISSION_UPDATES_ADMIN_RECEIVER) {

        this.server.to(NotificationReceiver.ALL_ASSIGNMENT_SUBMISSION_UPDATES_ADMIN_RECEIVER?.replace('_admin_receiver', '')).emit('notification', notificationBody);

        receivers?.forEach((receiverId) => {
         this.server.to(NotificationReceiver.MY_ASSIGNMENT_SUBMISSION_UPDATES_ADMIN_RECEIVER?.replace('_admin_receiver', '')+':'+receiverId).emit('notification', notificationBody);
        })
      }else {
        this.server.to(receiver).emit('notification', notificationBody);
      }

    } else {
      receivers?.forEach(async (receiverId) => {
        this.server.to(getRoomPrefix(receiverType) + receiverId).emit('notification', notificationBody);
        try {
          await firebase
          .messaging()
          .sendToTopic(sanitizeTopicName(getRoomPrefix(receiverType) + receiverId) , {
            notification: { title: 'Notification from Upspot Academy' , body:  notificationBody.message },
          }, {android: { priority: 'high' }})
          .catch((error: any) => {
            console.error("push notification error",error);
          });
        } catch (error) {
          console.log("Push notification error", error)
        }
      })

      
    }

    if (saveToDatabase) {
      return await this.notificationService.create(notificationBody)
    }
    return { success: true }
  }


  async sendLiveClassUpdates(courseId, liveClasses: LiveClass) {
    if(liveClasses?.course?.id) {
      const course = await this.courseRepository.findOneBy({ id: courseId })
      liveClasses.course = {
        title: course.title,
        id: course.id,
        liveClassSchedule: course.liveClassSchedule,
        thumbnail: course.thumbnail?.url || null,
        instructor: {
            id: course?.instructor?.id,
            fullName: course?.instructor?.fullName,
            photo: course?.instructor?.photo?.url || null,
            title: course?.instructor?.profile?.title || ''
        },

      } as any
    }
    await this.server.to(NotificationRoomPrefix.specificCourse+courseId).emit('liveClassUpdates', liveClasses);
  }

  async removeLiveClassSchedule(courseId, liveClass) {
    try {
      await this.schedulerService.removeSchedule('liveClassStartSchedule:'+courseId)
      await this.sendLiveClassUpdates(courseId, {...liveClass, isOnGoing: false})
    } catch (error) {
      
    }
    try {
      await this.schedulerService.removeSchedule('liveClassEndSchedule:'+courseId)
      await this.sendLiveClassUpdates(courseId, {...liveClass, isOnGoing: false})

    } catch (error) {
      
    }
  }
  async addLiveClassSchedule(courseId, liveClasses: LiveClass) {
    try {
      await this.removeLiveClassSchedule(courseId, liveClasses)
    } catch (error) {
      
    }

    await this.schedulerService.addLiveClassSchedule(liveClasses.id, liveClasses.dateTime, async () => {

      await this.sendLiveClassUpdates(courseId, {
        ...liveClasses,
        isOnGoing: true
      })
      await this.liveClassRepository.update(liveClasses.id, {isOnGoing: true})
    }, 'liveClassStartSchedule:'+courseId)


    const endDateTime = new Date(liveClasses.dateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + 90);
    // endDateTime.setMinutes(endDateTime.getMinutes() + 5);

    await this.schedulerService.addLiveClassSchedule(liveClasses.id, endDateTime, async () => {

      await this.sendLiveClassUpdates(courseId, {
        ...liveClasses,
        isOnGoing: false
      })
      await this.liveClassRepository.update(liveClasses.id, {isOnGoing: false})

    }, 'liveClassEndSchedule:'+courseId)
  }




  // sendInstantCoursesNotification(coursesId: number[], payload: any,notificationType = NotificationType.MANUAL_NOTIFICATION) {    

  //   const notificationBody: Partial<Notification>  = {
  //     notificationType, 
  //     message: payload.message,
  //     receivers: coursesId,
  //     receiverType: NotificationReceiver.SPECIFIC_COURSES,
  //     deliveryTime: new Date()
  //    }
  //   coursesId?.forEach((courseId) => {
  //     this.server.to(NotificationRoomPrefix.specificCourse + courseId).emit('notification', notificationBody);
  //   })

  //   return this.notificationService.create(notificationBody)
  // }
  async scheduleANotification({ notificationType, message, receivers, receiverType, scheduled, linkOrId = null, body = null }, customScheduleKey?) {
    const notificationBody: Partial<Notification> = {
      notificationType,
      message: message,
      isScheduled: true,
      receivers: receivers,
      receiverType: receiverType,
      deliveryTime: new Date(scheduled),
      linkOrId,
      body
    }
    const currentTime = new Date()
    if (notificationBody.deliveryTime < currentTime) {
      throw new BadRequestException('Date in past can not be scheduled')
    }

    const notification = await this.notificationService.create(notificationBody)

    const notificationId = notification.raw.insertId;
     await this.schedulerService.addNotificationSchedule(notificationId, scheduled, async () => {
      // todo
      const scheduledNotification = await this.notificationService.findNotificationById(notificationId)
      // Send only if its still available
      if(scheduledNotification && scheduledNotification?.isScheduled){
        await this.sendInstantNotification(notificationBody as any, false)
      }

      if (notificationBody.notificationType === NotificationType.NOTICE && Number(notificationBody.linkOrId)) {
        try {
          return await this.notificationService.updateNotice(notificationBody.linkOrId, { isScheduled: false })
        } catch (error) {

        }
      }
      return await this.notificationService.update(notificationId, { isScheduled: false })
    }, customScheduleKey)
    return {
      notificationId,
      success: true
    }
  }




  // unfortuned copy 
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
      })
      // .andWhere('subquery.due > 0');
  
    const query = this.paymentRepository
      .createQueryBuilder('payment')
      .innerJoin(
        `(${subquery.getQuery()})`,
        'latestPayments',
        'latestPayments.lastPaymentId = payment.id'
      )
      .where('payment.paymentStage = :paymentStage', {
        paymentStage: "completed"
      });
  
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
        user: {
          fullName: payment?.user?.fullName,
          id: payment?.user?.id,
          email: payment?.user?.email,
        }
      }));
    }
  }

  // 
  async findCoInstructorsByUserId(userId: number): Promise<any[]> {
    try {
      if(!Number(userId)) {
        return []
      }
      const query = `
        SELECT *
        FROM courses_co_instructors_users
        WHERE usersId = ${userId}
      `;
  
      return this.connection.query(query);
    } catch (error) {

      return []
    }
   
  }

  // get 
  async getCourseIdsOfInstructors(userId) {
    const coursesOfCoMentors = await this.findCoInstructorsByUserId(userId)
    const instructorOfCourses = []

    const courseOfMentors = await this.courseRepository.find({
      where: {
        instructor: {id: userId}
      },
      select: ['id']
    })

    coursesOfCoMentors?.forEach(course => {
      // client.join(AdminNotificationChannel.MyAssignmentSubmissionUpdates+':'+course.courseId);
      instructorOfCourses.push(course.courseId)
    })

    courseOfMentors?.forEach(course => {
      instructorOfCourses.push(course.id)
    })

    return instructorOfCourses

  }

  syncPushTopics(userId) {
    return  this.syncPushTopics(userId)
  }

}
