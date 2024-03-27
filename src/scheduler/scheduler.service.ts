import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import {  SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

@Injectable()
export class SchedulerService {
  constructor(private schedulerRegistry: SchedulerRegistry, 

    // private notificationGateway: NotificationGateway
    // @InjectRepository(Notification) private notificationRepository: Repository<Notification>,
    private eventEmitter: EventEmitter2
    ) {
  
    }
  private async restartSavedCronTasks(): Promise<void> {
    this.eventEmitter.emit('userCreated', {name: "Solaiman Shadin"});

    this.eventEmitter.emit('notification.restoreSchedules')
    this.eventEmitter.emit('liveClass.restoreSchedules')
    
    console.log("Rescheduling corn jobs in server restart... ")
    // const scheduledNotifications = await this.notificationRepository.findBy({
    //   isScheduled: true
    // })

  
  }

  async onModuleInit(): Promise<void> {
    await this.restartSavedCronTasks();
  }

  addNotificationSchedule(notificationId, dateTimeString,  callbackFn, customScheduleKey?) {
    const dateTime = new Date(dateTimeString)
    const job = new CronJob(dateTime, callbackFn);
  
    this.schedulerRegistry.addCronJob(customScheduleKey||`notification:${notificationId}`, job);
    job.start();
  }

  addLiveClassSchedule(liveClassId, dateTimeString,  callbackFn, customScheduleKey?) {
    const dateTime = new Date(dateTimeString)
    const job = new CronJob(dateTime, callbackFn);
  
    this.schedulerRegistry.addCronJob(customScheduleKey||`liveClass:${liveClassId}`, job);
    job.start();
  }
  
  removeNotificationFromSchedule(notificationId) {
    this.schedulerRegistry.deleteCronJob(`notification:${notificationId}`);
  }

  removeSchedule(customScheduleKey) {
    this.schedulerRegistry.deleteCronJob(customScheduleKey);

  }
  
}
