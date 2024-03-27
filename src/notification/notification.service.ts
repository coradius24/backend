import { SubscribedTopic } from './entities/subscribed-topic.entity';
import { promisify } from 'util';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { SeenNotification } from './entities/seen-notification.entity';
import { Inject, Injectable, forwardRef, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository,  Brackets, In } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationReceiver, NotificationType } from './enums/notification.enums';
import { Cache } from 'cache-manager'
import { RedisClient } from 'redis';
import { NotificationRoomPrefix, SOCKET_USER_CACHE_HASH_MAP } from './constants/notification.const';
import { EnrollmentsService } from 'src/enrollments/enrollments.service';
import { Notice } from './entities/notice.entity';
import { User } from 'src/users/entities/user.entity';
import { NotificationToken } from './entities/notification-token.entity';
import firebase from './firebaseAdmin';
import { sanitizeTopicName } from 'src/common/utils/utils';



@Injectable()
export class NotificationService {
  private redisClient: RedisClient;
  private logger = new Logger(NotificationService.name)

  constructor( 
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(SeenNotification) private seenNotificationRepository: Repository<SeenNotification>,
    @InjectRepository(Notice) private noticeRepository: Repository<Notice>,
    @InjectRepository(Notification) private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationToken) private notificationTokenRepository: Repository<NotificationToken>,
    @InjectRepository(SubscribedTopic) private subscribedTopicRepository: Repository<SubscribedTopic>,


    @Inject(forwardRef(() => EnrollmentsService))
    private enrollmentService: EnrollmentsService,
    @InjectRepository(User) private userRepository: Repository<User>,


  ) { 
    this.redisClient = this.cacheManager.store.getClient();
  }

  getAllScheduledNotifications() {
    return this.notificationRepository.findBy({isScheduled: true})
  }
  async updateSeenCount(userId, count) {
    const existingRecord =  await this.seenNotificationRepository.findOneBy({userId})
    if(existingRecord) {
      return this.seenNotificationRepository.update(existingRecord.id, {count})
    }else{

    }
  } 

  async getRoomsByUserId(userId) {
    const redisHgetAsync = promisify(this.redisClient.hget).bind(this.redisClient);

    const socketData = await redisHgetAsync(SOCKET_USER_CACHE_HASH_MAP, userId)
    if(socketData) {
      const rooms = JSON.parse(socketData || "{}")?.rooms
      return rooms
    } 
    const enrolledCoursesOfAUser = await this.enrollmentService.getEnrolledCoursesOfAUser(userId)
    const dataMap = {
      courses: [],
      parentCourses: [],
      courseCategories: [],
      adminChannels: []
    }
    enrolledCoursesOfAUser?.forEach((enrollment) => {
      if(!dataMap.courseCategories?.includes(enrollment?.course?.category?.id) ){
        dataMap.courseCategories.push(enrollment?.course?.category?.id)
      }
      if(!dataMap.courses?.includes(enrollment?.course?.id)  ) {
        if(!enrollment?.course?.parentCourseId) {
          dataMap.courses.push(enrollment?.course?.id)
        }else {
          dataMap.parentCourses.push(enrollment?.course?.id)
        }
      }
                  
    })

    return dataMap
  }
  async updateSeen(userId, seenCount) {
    //  const rooms = await this.getRoomsByUserId(userId)


    // const countConditions = new Brackets(qb => {
    //   qb.where('isScheduled = :isScheduled', { isScheduled: false });
      
  
    //   qb.andWhere(
    //     new Brackets(innerQb => {
    //       if (rooms?.courses?.length > 0) {
    //         innerQb.orWhere('receiverType = :specificCourses AND receivers IN (:...courses)', {
    //           specificCourses: NotificationReceiver.SPECIFIC_COURSES,
    //           courses: rooms?.courses,
    //         });
    //       }
    //       if (rooms?.parentCourses?.length > 0) {
    //         innerQb.orWhere('receiverType = :batchCourseParents AND receivers IN (:...parentCourses)', {
    //           batchCourseParents: NotificationReceiver.BATCH_COURSE_PARENTS,
    //           parentCourses: rooms.parentCourses,
    //         });
    //       }
    //       if (rooms?.courseCategories?.length > 0) {
    //         innerQb.orWhere('receiverType = :courseCategoryIds AND receivers IN (:...courseCategories)', {
    //           courseCategoryIds: NotificationReceiver.COURSE_CATEGORIES,
    //           courseCategories: rooms.courseCategories,
    //         });
    //       }
    //       innerQb.orWhere('receiverType = :individualUsers AND receivers = :userId', {
    //         individualUsers: NotificationReceiver.INDIVIDUAL_USERS,
    //         userId: userId,
    //       });
    //       innerQb.orWhere('receiverType = :all', {
    //         all: NotificationReceiver.ALL,
    //       });
    //     })
    //   );
    // });

    // const countQuery = this.notificationRepository
    //   .createQueryBuilder('notification')
    //   .where(countConditions)
 
  
    // const count = await countQuery.getCount()
    const count = seenCount

    const existingRecord =  await this.seenNotificationRepository.findOneBy({userId})
    if(existingRecord) {
      return this.seenNotificationRepository.update(existingRecord.id, {count})
    }else{
      return this.seenNotificationRepository.insert({userId, count})

    }
    
   } 

  async getSeenNotificationCount(userId) {
    return (await this.seenNotificationRepository.findOneBy({userId}))?.count || 0

  }

  create(createNotificationDto) {
    return this.notificationRepository.insert(createNotificationDto)
  }

  update(id, payload: any) {
    return this.notificationRepository.update(id,payload )
  }


  async  findNotificationsOfAUser(userId, cursor?: any, limit: number = 10, adminOnly= false) {
    const rooms = await this.getRoomsByUserId(userId)
    const user = await this.userRepository.findOne({
      where: {id: userId},
      select: ['id','createdAt']
    })
    if(!user || !user?.createdAt) {
      this.logger.error(`Notification Requested user Not FOund with userId: ${userId}`)
      return new  BadRequestException(`User not found with userId ${userId}`)
    }
    const userCreatedAt = user.createdAt;

    const conditions = new Brackets(qb => {
      qb.where('isScheduled = :isScheduled', { isScheduled: false });
       qb.andWhere('deliveryTime >= :deliveryTime', { deliveryTime: userCreatedAt
        // userCreateDate: user.createdAt
       });
      if (cursor) {
        qb.andWhere('deliveryTime <= :cursor', { cursor: new Date(cursor) });
      }
      if(adminOnly) {
        qb.andWhere(`notificationType = :notificationType`, {
          notificationType: NotificationType.ADMIN_NOTIFICATION
        });
      }

  
      qb.andWhere(
        new Brackets(innerQb => {
          if (rooms?.courses?.length > 0) {
            innerQb.orWhere('receiverType = :specificCourses AND receivers IN (:...courses)', {
              specificCourses: NotificationReceiver.SPECIFIC_COURSES,
              courses: rooms.courses,
            });
          }
          if (rooms?.fullPaidCourses?.length > 0) {
            innerQb.orWhere('receiverType = :fullPaidCourses AND receivers IN (:...courses)', {
              fullPaidCourses: NotificationReceiver.FULL_PAID_COURSES,
              courses: rooms.fullPaidCourses,
            });
          }
          if (rooms?.coursesWithDues?.length > 0) {
            innerQb.orWhere('receiverType = :coursesWithDues AND receivers IN (:...courses)', {
              coursesWithDues: NotificationReceiver.HAVING_DUES_OF_SPECIFIC_COURSES,
              courses: rooms.coursesWithDues,
            });
          }
          if(rooms?.adminChannels?.includes(NotificationReceiver.PENDING_WITHDRAW_UPDATES_ADMIN_RECEIVER)) {
            innerQb.orWhere(`receiverType = :receiverType`, {
              receiverType: NotificationReceiver.PENDING_WITHDRAW_UPDATES_ADMIN_RECEIVER
            });
          }

          if(rooms?.adminChannels?.includes(NotificationReceiver.AWAITING_WITHDRAW_UPDATES_ADMIN_RECEIVER)) {
            innerQb.orWhere(`receiverType = :receiverType`, {
              receiverType: NotificationReceiver.AWAITING_WITHDRAW_UPDATES_ADMIN_RECEIVER
            });
          }

          if(rooms?.adminChannels?.includes(NotificationReceiver.ALL_ASSIGNMENT_SUBMISSION_UPDATES_ADMIN_RECEIVER)) {
            innerQb.orWhere(`receiverType = :receiverType`, {
              receiverType: NotificationReceiver.ALL_ASSIGNMENT_SUBMISSION_UPDATES_ADMIN_RECEIVER
            });
          }else if(rooms?.adminChannels?.includes(NotificationReceiver.MY_ASSIGNMENT_SUBMISSION_UPDATES_ADMIN_RECEIVER)) {
            innerQb.orWhere(`receiverType = :receiverType AND receivers IN (:...courses)`, {
              courses: rooms.instructorOfCourses,
              receiverType: NotificationReceiver.ALL_ASSIGNMENT_SUBMISSION_UPDATES_ADMIN_RECEIVER
            });
          }

          // todo: to add refund
          
          if (rooms?.parentCourses?.length > 0) {
            innerQb.orWhere('receiverType = :batchCourseParents AND receivers IN (:...parentCourses)', {
              batchCourseParents: NotificationReceiver.BATCH_COURSE_PARENTS,
              parentCourses: rooms.parentCourses,
            });
          }
          if (rooms?.courseCategories?.length > 0) {
            innerQb.orWhere('receiverType = :courseCategoryIds AND receivers IN (:...courseCategories)', {
              courseCategoryIds: NotificationReceiver.COURSE_CATEGORIES,
              courseCategories: rooms.courseCategories,
            });
          }
          
          innerQb.orWhere('receiverType = :individualUsers AND receivers = :userId', {
            individualUsers: NotificationReceiver.INDIVIDUAL_USERS,
            userId: userId,
          });
          innerQb.orWhere('receiverType = :all', {
            all: NotificationReceiver.ALL,
          });
        })
      );
    });
  const extendedLimit = Number(limit) + 1 
  
    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .where(conditions)
      .orderBy('notification.deliveryTime', 'DESC')
      .take(extendedLimit);
  
    const results = await query.getMany();
    const countConditions = new Brackets(qb => {
      qb.where('isScheduled = :isScheduled', { isScheduled: false });
      if(adminOnly) {
        qb.andWhere(`notificationType = :notificationType`, {
          notificationType: NotificationType.ADMIN_NOTIFICATION
        });
      }
      if (cursor) {
        qb.andWhere('deliveryTime <= :cursor', { cursor: new Date(cursor) });
      }
      qb.andWhere(
        new Brackets(innerQb => {
          if (rooms?.courses?.length > 0) {
            innerQb.orWhere('receiverType = :specificCourses AND receivers IN (:...courses)', {
              specificCourses: NotificationReceiver.SPECIFIC_COURSES,
              courses: rooms?.courses,
            });
          }
          if (rooms?.fullPaidCourses?.length > 0) {
            innerQb.orWhere('receiverType = :fullPaidCourses AND receivers IN (:...courses)', {
              fullPaidCourses: NotificationReceiver.FULL_PAID_COURSES,
              courses: rooms.fullPaidCourses,
            });
          }
          if (rooms?.coursesWithDues?.length > 0) {
            innerQb.orWhere('receiverType = :coursesWithDues AND receivers IN (:...courses)', {
              coursesWithDues: NotificationReceiver.HAVING_DUES_OF_SPECIFIC_COURSES,
              courses: rooms.coursesWithDues,
            });
          }
          if(rooms?.adminChannels?.includes(NotificationReceiver.PENDING_WITHDRAW_UPDATES_ADMIN_RECEIVER)) {
            innerQb.orWhere(`receiverType = :receiverType`, {
              receiverType: NotificationReceiver.PENDING_WITHDRAW_UPDATES_ADMIN_RECEIVER
            });
          }

          if(rooms?.adminChannels?.includes(NotificationReceiver.AWAITING_WITHDRAW_UPDATES_ADMIN_RECEIVER)) {
            innerQb.orWhere(`receiverType = :receiverType`, {
                receiverType: NotificationReceiver.PENDING_WITHDRAW_UPDATES_ADMIN_RECEIVER
            });
          }
          if(rooms?.adminChannels?.includes(NotificationReceiver.ALL_ASSIGNMENT_SUBMISSION_UPDATES_ADMIN_RECEIVER)) {
            innerQb.orWhere(`receiverType = :receiverType`,
            {
              receiverType: NotificationReceiver.ALL_ASSIGNMENT_SUBMISSION_UPDATES_ADMIN_RECEIVER
          });
          }else if(rooms?.adminChannels?.includes(NotificationReceiver.MY_ASSIGNMENT_SUBMISSION_UPDATES_ADMIN_RECEIVER)) {
            innerQb.orWhere(`receiverType = :receiverType AND receivers IN (:...courses)`, {
              courses: rooms.instructorOfCourses,
              receiverType: NotificationReceiver.ALL_ASSIGNMENT_SUBMISSION_UPDATES_ADMIN_RECEIVER
            });
          }
           // todo: to add refund
          if (rooms?.parentCourses?.length > 0) {
            innerQb.orWhere('receiverType = :batchCourseParents AND receivers IN (:...parentCourses)', {
              batchCourseParents: NotificationReceiver.BATCH_COURSE_PARENTS,
              parentCourses: rooms.parentCourses,
            });
          }
          if (rooms?.courseCategories?.length > 0) {
            innerQb.orWhere('receiverType = :courseCategoryIds AND receivers IN (:...courseCategories)', {
              courseCategoryIds: NotificationReceiver.COURSE_CATEGORIES,
              courseCategories: rooms.courseCategories,
            });
          }
          innerQb.orWhere('receiverType = :individualUsers AND receivers = :userId', {
            individualUsers: NotificationReceiver.INDIVIDUAL_USERS,
            userId: userId,
          });
          innerQb.orWhere('receiverType = :all', {
            all: NotificationReceiver.ALL,
          });
        })
      );
    });

    const countQuery = this.notificationRepository
      .createQueryBuilder('notification')
      .where(countConditions)
 
  
    const totalCount = await countQuery.getCount()
    const nextCursorData = results?.length === extendedLimit ?  results.pop() : null

    const nextCursor = nextCursorData?.deliveryTime?.toISOString() || null


    const totalSeenCount =  await this.getSeenNotificationCount(userId)
    return {
      totalCount,
      totalSeenCount,
      results,
      nextCursor,
    };
  }

  updateNotice(noticeId, payload) {
    return this.noticeRepository.update(noticeId, payload)
  }

  findNotificationById(id) {
    return this.notificationRepository.findOneBy({
      id
    })
  }

  deleteScheduledNotificationById(id) {
    
    return this.notificationRepository.delete({
      isScheduled: true,
      id
    })
  }

  getPushTokensByUserIds(userIds: number[]) {
    return  this.notificationTokenRepository.findBy({
      userId: In(userIds),
      status: 'active',
    })
  }
  async unsubscribeFromAllTopics(userId: number) {
    try {
      const subscribedTopics = await this.subscribedTopicRepository.findBy({
        userId
      })
      const tokens = await this.getPushTokensByUserIds([userId])
      const unsubscribePromises = subscribedTopics.map(topic =>
        firebase.messaging().unsubscribeFromTopic(tokens?.map(pushToken=>pushToken.token), topic.topic)
      );
      await Promise.all(unsubscribePromises);
      await this.subscribedTopicRepository.delete({
        userId
      })
    } catch (error) {
      console.error(`Error unsubscribing from topics: ${error}`);
      throw error;
    }
  }

  async syncPushTopics(userId) {
    await this.unsubscribeFromAllTopics(userId)

    const pushTokens = await this.getPushTokensByUserIds([userId])
    await firebase.messaging().subscribeToTopic(pushTokens?.map(pushToken=>pushToken.token) , sanitizeTopicName('allDevices'))

    const topics = ['allDevices']

    const rooms = (await this.getRoomsByUserId(userId)) || {}
    if (rooms?.courses?.length > 0) {
      const joinRoomPromises = rooms?.courses?.map(courseId => {
        topics.push(sanitizeTopicName(NotificationRoomPrefix.specificCourse+ courseId))
        return firebase.messaging().subscribeToTopic(pushTokens?.map(pushToken=>pushToken.token) , sanitizeTopicName(NotificationRoomPrefix.specificCourse+ courseId))
      } )

      await Promise.allSettled(joinRoomPromises)
    }
    if (rooms?.fullPaidCourses?.length > 0) {
      const joinRoomPromises = rooms?.fullPaidCourses?.map(courseId => {
        topics.push(sanitizeTopicName(NotificationRoomPrefix.fullPaidCourses + courseId))

        return firebase.messaging().subscribeToTopic(pushTokens?.map(pushToken=>pushToken.token) , sanitizeTopicName(NotificationRoomPrefix.fullPaidCourses + courseId))
      } )

      await Promise.allSettled(joinRoomPromises)
    }
    if (rooms?.coursesWithDues?.length > 0) {
      const joinRoomPromises = rooms?.coursesWithDues?.map(courseId => {
        topics.push(sanitizeTopicName(NotificationRoomPrefix.coursesWithDues + courseId))

        return firebase.messaging().subscribeToTopic(pushTokens?.map(pushToken=>pushToken.token) , sanitizeTopicName(NotificationRoomPrefix.coursesWithDues + courseId))
      } )

      await Promise.allSettled(joinRoomPromises)
    }

    // todo: to add refund
    
    if (rooms?.parentCourses?.length > 0) {
      const joinRoomPromises = rooms?.parentCourses?.map(courseId => {
        topics.push(sanitizeTopicName(NotificationRoomPrefix.batchCourseParent + courseId))

        return firebase.messaging().subscribeToTopic(pushTokens?.map(pushToken=>pushToken.token) , sanitizeTopicName(NotificationRoomPrefix.batchCourseParent + courseId))
      } )

      await Promise.allSettled(joinRoomPromises)
    }
    if (rooms?.courseCategories?.length > 0) {
      const joinRoomPromises = rooms?.courseCategories?.map(courseId => {
        topics.push(sanitizeTopicName(NotificationRoomPrefix.batchCourseParent + courseId))

        return firebase.messaging().subscribeToTopic(pushTokens?.map(pushToken=>pushToken.token) , sanitizeTopicName(NotificationRoomPrefix.courseCategory + courseId))
      } )

      await Promise.allSettled(joinRoomPromises)
    }

    await this.subscribedTopicRepository.createQueryBuilder()
    .insert()
    .into(SubscribedTopic)
    .values(topics?.map(topic => ({topic, userId })))
    .execute();

  }
  async syncPushToken(userId, payload) {
    const notificationToken = await this.notificationTokenRepository.findOneBy({
      userId,
      status: 'active',
      token: payload.token
    })
    if(!notificationToken) {
      await this.notificationTokenRepository.insert({
        userId,
        status: 'active',
        token: payload.token,
        device: payload.device
      })
    }
    await this.syncPushTopics(userId)
    return {
      ok: true
    }
  }


  

}
