import { UpdateSeenCountDto } from './dto/update-seen-count.dto';
import { NotificationService } from './notification.service';
import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationGateway } from './notification.gateway';
import { UserNotificationQueryDto } from './dto/user-notification-query.dto';
import { PushTokenDto } from './dto/push-token.dto';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
    constructor (private notificationService: NotificationService,private notificationGateway: NotificationGateway) {

    }
    
    @ApiBearerAuth()
    @Get('/')
    @UseGuards(AuthGuard)
    myNotifications(@Req() req, @Query() userNotificationQueryDto: UserNotificationQueryDto) {
        return this.notificationService.findNotificationsOfAUser(req.user.sub, userNotificationQueryDto.cursor, userNotificationQueryDto.limit)
    }

    // @ApiBearerAuth()
    // @Get('/my-seen-count')
    // @UseGuards(AuthGuard)
    // mySeenNotificationCount(@Req() req) {
    //     return this.notificationService.getSeenNotificationCount(req.user.sub)
    // }



    @ApiBearerAuth()
    @Patch('/seen')
    @UseGuards(AuthGuard)
    updateSeenNotificationCount(@Req() req, @Query('seenCount') seenCount: number) {
        return this.notificationService.updateSeen(req.user.sub, seenCount)
    }

    @ApiBearerAuth()
    @Post('/push-token-sync')
    @UseGuards(AuthGuard)
    pushTokenSync(@Req() req, @Body() payload: PushTokenDto) {
        return this.notificationService.syncPushToken(req.user.sub, payload)
    }
  
}
