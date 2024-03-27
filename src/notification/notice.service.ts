import { EnrollmentsService } from 'src/enrollments/enrollments.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { promisify } from 'util';
import { Notice } from './entities/notice.entity';
import {  Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { NotificationReceiver } from './enums/notification.enums';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { NoticeQueryDto } from './dto/notice-query.dto';
import { SOCKET_USER_CACHE_HASH_MAP } from './constants/notification.const';
import { RedisClient } from 'redis';
import { Cache } from 'cache-manager'
import { NoticeDepartment } from './entities/notice-department.entity';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NoticeService {
  private redisClient: RedisClient;

  constructor( 
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(Notice) private noticeRepository: Repository<Notice>,
    @InjectRepository(NoticeDepartment) private noticeDepartmentRepository: Repository<NoticeDepartment>,
    @InjectRepository(Notification) private notificationRepository: Repository<Notification>,


    private enrollmentService: EnrollmentsService
  ) { 
    this.redisClient = this.cacheManager.store.getClient();
  }

  async getDepartments() {
     const [results, totalCount] = await this.noticeDepartmentRepository.findAndCount()
     return {
      results, 
      totalCount   
     }
  }
  
  createDepartment(payload) {
    return this.noticeDepartmentRepository.insert(payload)
  }

  updateDepartment(id, payload) {
    return this.noticeDepartmentRepository.update(id, payload)
  }

  deleteDepartment(id) {
    return this.noticeDepartmentRepository.delete(id)
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
      courseCategories: []
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
  
  async createNotice(createNoticeDto: CreateNoticeDto, callerUserId) {
    const body : any= {
      ...createNoticeDto,
      createdBy: callerUserId
    }
    if(body.scheduled) {
      body.deliveryTime = createNoticeDto.scheduled
      body.isScheduled = 1;
    }else {
      body.deliveryTime = new Date()

    }

    return await this.noticeRepository.insert(body)
    
  } 

  async findAll({limit = 10, page= 1}, {receivers, receiverType, scheduledOnly = 'false', instantOnly = 'false'}: NoticeQueryDto) {
    const skip = (page-1) * limit;
    const take = limit
    const query:any = {}
    if(scheduledOnly === 'true') {
      query.isScheduled = true
    }if(instantOnly === 'true') {
      query.isScheduled = false
    }
    if(
      receiverType === NotificationReceiver.SPECIFIC_COURSES || 
      receiverType === NotificationReceiver.COURSE_CATEGORIES || 
      receiverType === NotificationReceiver.BATCH_COURSE_PARENTS ||
      receiverType === NotificationReceiver.INDIVIDUAL_USERS
    ) {
      query.receiverType = receiverType
      query.receivers = receivers
    }else if(receiverType == NotificationReceiver.ALL) {
      query.receiverType = query.receiverType

    }
    const order: any = {
      deliveryTime: 'DESC',
    }
    const [results, totalCount] = await this.noticeRepository.findAndCount({
      where: query,
      skip,
      take,
      order

    })

    return  {
      results, 
      totalCount,
      limit,
      page
    }
  }

  async  findNoticesOfAUser(userId, {page = 1, limit = 10}) {
    let rooms: any = {}
    if(userId) {
       rooms = await this.getRoomsByUserId(userId)

    }
    
    const conditions = new Brackets(qb => {
      qb.where('isScheduled = :isScheduled', { isScheduled: false });
     
  
      qb.andWhere(
        new Brackets(innerQb => {
          if (rooms?.courses?.length > 0) {
            innerQb.orWhere('receiverType = :specificCourses AND receivers IN (:...courses)', {
              specificCourses: NotificationReceiver.SPECIFIC_COURSES,
              courses: rooms.courses,
            });
          }
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
          if(userId) {
            innerQb.orWhere('receiverType = :individualUsers AND receivers = :userId', {
              individualUsers: NotificationReceiver.INDIVIDUAL_USERS,
              userId: userId,
            });
          }
         
          innerQb.orWhere('receiverType = :all', {
            all: NotificationReceiver.ALL,
          });
        })
      );
    });
  const skip = (page-1) * limit
  
    const query = this.noticeRepository
      .createQueryBuilder('notice')
      .where(conditions)
      .orderBy('notice.deliveryTime', 'DESC')
      .skip(skip)
      .take(limit);
  
    const results = await query.getMany();
    const countConditions = new Brackets(qb => {
      qb.where('isScheduled = :isScheduled', { isScheduled: false });
      
  
      qb.andWhere(
        new Brackets(innerQb => {
          if (rooms?.courses?.length > 0) {
            innerQb.orWhere('receiverType = :specificCourses AND receivers IN (:...courses)', {
              specificCourses: NotificationReceiver.SPECIFIC_COURSES,
              courses: rooms?.courses,
            });
          }
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
          if(userId) {
            innerQb.orWhere('receiverType = :individualUsers AND receivers = :userId', {
              individualUsers: NotificationReceiver.INDIVIDUAL_USERS,
              userId: userId,
            });
          }
          innerQb.orWhere('receiverType = :all', {
            all: NotificationReceiver.ALL,
          });
        })
      );
    });

    const countQuery = this.noticeRepository
      .createQueryBuilder('notice')
      .where(countConditions)
      .leftJoinAndSelect('notice.department', 'noticeDepartment')
 
  
    const totalCount = await countQuery.getCount()


    return {
      totalCount,
      results,
      page, 
      limit
    };
  }

  updateNotice(noticeId, payload) {
    return this.noticeRepository.update(noticeId, payload)
  }

  async deleteNotice(noticeId: number) {
    try {
      await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .from(Notification)  // Assuming NotificationEntity is your entity name
      .where("linkOrId = :noticeId", { noticeId: String(noticeId) })
      .execute();

    } catch (error) {
      
    }

    await this.noticeRepository.update(noticeId, {thumbnailId: null})
    
    return await this.noticeRepository.delete(noticeId)
  }


}
