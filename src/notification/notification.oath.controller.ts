import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {  ApiBearerAuth, ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationGateway } from './notification.gateway';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationType } from './enums/notification.enums';
import { AuthGuard } from 'src/auth/auth.guard';
import { FeatureGuard } from 'src/auth/feature.guard';


@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard, FeatureGuard)
@Controller('oauth/notifications')
@ApiExcludeController()
export class NotificationAdminController {
    constructor (private notificationGateway: NotificationGateway ) {

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
