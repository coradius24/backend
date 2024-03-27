import { pruneCourse } from 'src/common/utils/courseUtils';
import { NotificationService } from './../notification/notification.service';
import { NotificationGateway } from './../notification/notification.gateway';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { CreateLiveClassDto } from './dto/create-live-class.dto';
import { EnrollmentsService } from 'src/enrollments/enrollments.service';

import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { Repository, In, MoreThan } from 'typeorm';
import { LiveClass } from './entities/live-class.entity';
import { NotificationReceiver, NotificationType } from 'src/notification/enums/notification.enums';
import { CreateCourseDto } from './dto/create-course.dto';
import { SchedulerService } from 'src/scheduler/scheduler.service';

@Injectable()
export class LiveClassService {
    constructor(
        @InjectRepository(LiveClass) private liveClassRepository: Repository<LiveClass>,
        private eventEmitter: EventEmitter2,
        private enrollmentsService: EnrollmentsService,
        private notificationGateway: NotificationGateway,
        private notificationService: NotificationService,
        private schedulerService: SchedulerService,

        @InjectRepository(Course) private coursesRepository: Repository<Course>,

    ) {
        eventEmitter.on('liveClass.restoreSchedules', async () => {
            const scheduledClasses = await this.liveClassRepository.find({
                where: {
                    dateTime: MoreThan(new Date())
                }
            })
            scheduledClasses?.forEach(scheduledClass => {
                console.log("Restoring live class schedules:", scheduledClass.id)
                function addMinutes(date, minutes) {
                    date.setMinutes(date.getMinutes() + minutes);

                    return date;
                }

                const currentTime = addMinutes(new Date(), 1)
                const dateTime = new Date(scheduledClass?.dateTime) < currentTime ? currentTime : scheduledClass?.dateTime;

                this.eventEmitter.emit('liveClass.created', {
                    courseId: scheduledClass.courseId,
                    dateTime: dateTime,
                    previousNotificationId: scheduledClass?.notificationId,
                    liveClassId: scheduledClass?.id,
                    classDto: scheduledClass
                })

            });

            // await Promise.all(jobPromises)

            // Handle the user creation event in this module
            // Send notifications, update data, etc.
        });
    }

    async createLiveClass(createLiveClassDto: CreateLiveClassDto) {
        const currentTime = new Date()
        currentTime.setSeconds(currentTime.getSeconds() + 5)
        const dateTime = new Date(createLiveClassDto.dateTime)
        if (currentTime > dateTime) {
            throw new BadRequestException('DateTime can not be past date and time')
        }
        const liveClassForTheCourse = await this.liveClassRepository.findOneBy({ courseId: createLiveClassDto.courseId })
        let liveClassId = liveClassForTheCourse?.id;
        if (liveClassForTheCourse) {
            await this.liveClassRepository.update(liveClassForTheCourse.id, createLiveClassDto)

        } else {
            const data = await this.liveClassRepository.insert(createLiveClassDto)

            liveClassId = data.identifiers[0].id
        }


        this.eventEmitter.emit('liveClass.created', {
            courseId: createLiveClassDto.courseId,
            dateTime: createLiveClassDto.dateTime,
            previousNotificationId: liveClassForTheCourse?.notificationId,
            liveClassId: liveClassId,
            classDto: { ...(liveClassForTheCourse ? liveClassForTheCourse : {}), ...createLiveClassDto }
        })

        return {
            success: true
        }


    }

    async deleteLiveClass(courseId) {
        const liveClassForTheCourse = await this.liveClassRepository.findOneBy({ courseId: courseId })
    
        
        try {
            await this.notificationGateway.removeLiveClassSchedule(courseId, liveClassForTheCourse)
        } catch (error) {

        }
        return this.liveClassRepository.delete({
            courseId
        })

    }
    async updateClassOngoingStatus(liveClassId, isOnGoing: boolean) {

        const liveClassForTheCourse = await this.liveClassRepository.findOneBy({ id: liveClassId })

        await this.liveClassRepository.update(liveClassForTheCourse.id, { isOnGoing })

        this.eventEmitter.emit('liveClass.ongoingStatusUpdated', {
            courseId: liveClassForTheCourse.courseId,
            dateTime: liveClassForTheCourse.dateTime,
            classDto: { ...liveClassForTheCourse, isOnGoing }
        })

        return {
            success: true
        }


    }
    async findLiveClassByCourseId(courseId: number, user?) {
        if (user) {
            const enrolled = await this.enrollmentsService.checkCourseEnrollment(user.id, courseId)
            if (!enrolled) {
                throw new ForbiddenException('The user do not enrolled to this course')
            }
        }

        // TODO: need to add check for course access
        return await this.liveClassRepository.findBy({ courseId })
    }

    async getLiveClassesOfAUser(userId: number) {
        const enrolledCoursesOfAUser = await this.enrollmentsService.getEnrolledCoursesOfAUser(userId)
        const data = await this.liveClassRepository.find({
            where: {
                courseId: In(enrolledCoursesOfAUser.map(course => course.course.id))
            },
            relations: {
                course: true
            }
        })
        return data?.map(d => ({
            ...d, course: {
                title: d.course.title,
                id: d.course.id,
                batchTitle: d.course.batchTitle,
                liveClassSchedule: d?.course?.liveClassSchedule,
                thumbnail: d.course.thumbnail?.url || null,
                instructor: {
                    id: d.course?.instructor?.id,
                    fullName: d.course?.instructor?.fullName,
                    photo: d.course?.instructor?.photo?.url || null,
                    title: d.course?.instructor?.profile?.title || ''
                },
            }
        }))
    }


    @OnEvent('liveClass.created')
    async handleOnLiveClassCreated(payload: {
        classDto: any,
        dateTime: any,
        courseId: number,
        liveClassId: any,
        previousNotificationId: any
    }) {
        
        let dateTime = new Date(payload.dateTime);
        dateTime.setMinutes(dateTime.getMinutes() - 5);
        const currentTime = new Date()
        if (currentTime >= dateTime) {
            currentTime.setSeconds(currentTime.getSeconds() + 120)
            dateTime = currentTime
        }

        const course = await this.coursesRepository.findOneBy({ id: payload.courseId })
        const classNotificationPayload = {
            ...payload.classDto, course: {
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

            }
        }
        
        await this.notificationGateway.sendLiveClassUpdates(payload.courseId, classNotificationPayload)

        // scheduling for onGoing Status change
        await this.notificationGateway.addLiveClassSchedule(payload.courseId, classNotificationPayload)

        if (payload.previousNotificationId) {
            await this.notificationService.deleteScheduledNotificationById(payload.previousNotificationId)
        }
        const now = new Date().getTime(); // Current time in milliseconds
        const scheduledTime = new Date(payload.dateTime).getTime(); // Scheduled time in milliseconds

        const minutesLeft = Math.ceil((scheduledTime - now) / (60 * 1000)); // Calculate minutes left
        const oneMinuteFromNow = new Date()

        oneMinuteFromNow.setMinutes(oneMinuteFromNow.getMinutes() + 1);
        const enBnNumbers = {
            0: '১',
            1: '১',
            2: '২',
            3: '৩',
            4: '৪',
            5: '৫',
        }


        const { notificationId } = await this.notificationGateway.scheduleANotification({
            notificationType: NotificationType.CLASS_NOTIFICATION,
            receiverType: NotificationReceiver.SPECIFIC_COURSES,
            receivers: [payload.courseId],
            message: `আপনার কোর্স "${course.title}"-এর লাইভ  ক্লাস আর  ${minutesLeft >= 5 ? '৫' : enBnNumbers[minutesLeft]} মিনিট পর শুরু হবে`,
            scheduled: minutesLeft >= 5 ? dateTime : oneMinuteFromNow
        })

        await this.liveClassRepository.update(payload.liveClassId, { notificationId })
    }

    @OnEvent('liveClass.ongoingStatusUpdated')
    async handleOnLiveClassStatusUpdate(payload: any) {

        this.notificationGateway.sendLiveClassUpdates(payload.courseId, payload.classDto)
    }
}
