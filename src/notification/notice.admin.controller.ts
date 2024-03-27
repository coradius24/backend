import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import {  ApiBearerAuth,  ApiTags } from '@nestjs/swagger';
import { NotificationGateway } from './notification.gateway';
import { NotificationType } from './enums/notification.enums';
import { AuthGuard } from 'src/auth/auth.guard';
import { FeatureGuard } from 'src/auth/feature.guard';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { NoticeService } from './notice.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { NoticeQueryDto } from './dto/notice-query.dto';
import { sanitizeAndTruncateString } from 'src/common/utils/utils';
import { CreateNoticeDepartmentDto } from './dto/create-notice-department.dto';


@ApiTags('NoticeBoard')
@ApiBearerAuth()
@UseGuards(AuthGuard, FeatureGuard)
@Controller('admin/notices')
export class NoticeAdminController {
    constructor (private notificationGateway: NotificationGateway, private noticeService: NoticeService ) {

    }

    @Post() 
    async createNotice(@Req() req,  @Body() createNoticeDto: CreateNoticeDto) {
        

        const notice = await this.noticeService.createNotice(createNoticeDto, req?.user?.sub)
        if(createNoticeDto.scheduled) {
            return await this.notificationGateway.scheduleANotification({
                message: createNoticeDto.title,
                body: sanitizeAndTruncateString(createNoticeDto.body, 62) ,
                scheduled: createNoticeDto.scheduled,
                receivers: createNoticeDto.receivers,
                receiverType: createNoticeDto.receiverType,
                notificationType: NotificationType.NOTICE,
                linkOrId: notice.raw?.insertId
            })
        }
        
        await this.notificationGateway.sendInstantNotification({
            message: createNoticeDto.title,
            body: sanitizeAndTruncateString(createNoticeDto.body, 62) ,
            receivers: createNoticeDto.receivers,
            receiverType: createNoticeDto.receiverType,
            notificationType: NotificationType.NOTICE,
            linkOrId: notice.raw?.insertId
        })

        return notice
    }

   @Get()
   getAllNotices(@Query() paginationQuery: PaginationDto, @Query() noticeQuery: NoticeQueryDto) {
        return  this.noticeService.findAll(paginationQuery, noticeQuery)
   }


   @Post('/departments') 
   createNoticeDepartment(@Body() payload: CreateNoticeDepartmentDto){
     return  this.noticeService.createDepartment(payload)
   }

   @Get('/departments') 
   getDepartments(){
     return  this.noticeService.getDepartments()
   }

   @Delete('/departments/:id') 
   deleteDepartment(@Param('id') id: number){
     return  this.noticeService.deleteDepartment(id)
   }

   @Delete(':id') 
   deleteNotice(@Param('id') id: number){
     return  this.noticeService.deleteNotice(id)
   }
}
