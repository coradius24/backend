import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import {  ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationGateway } from './notification.gateway';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationType } from './enums/notification.enums';
import { AuthGuard } from 'src/auth/auth.guard';
import { FeatureGuard } from 'src/auth/feature.guard';
import { UserNotificationQueryDto } from './dto/user-notification-query.dto';
import { NotificationService } from './notification.service';


@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard, FeatureGuard)
@Controller('admin/notifications')
export class NotificationAdminController {
    constructor (
        private notificationGateway: NotificationGateway,
        private notificationService: NotificationService
    ) {

    }

    @ApiBearerAuth()
    @Get('/')
    @UseGuards(AuthGuard)
    myNotifications(@Req() req, @Query() userNotificationQueryDto: UserNotificationQueryDto) {
        return this.notificationService.findNotificationsOfAUser(req.user.sub, userNotificationQueryDto.cursor, userNotificationQueryDto.limit, true)
    }

    @ApiOperation({summary: 'Sent notification to receiverType : all, individualUsers, specificCourses, batchCourseParents, courseCategories'})
    @Post('')
    sendNotification( @Body() createNotificationDto: CreateNotificationDto) {
        if(createNotificationDto.scheduled) {
            return this.notificationGateway.scheduleANotification({...createNotificationDto, notificationType: NotificationType.MANUAL_NOTIFICATION
            })
        }

        return this.notificationGateway.sendInstantNotification({...createNotificationDto, notificationType: NotificationType.MANUAL_NOTIFICATION})
        
    }
    

}
