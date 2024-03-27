import { OptionalAuthGuard } from './../auth/optionalAuth.guard';
import {  Controller, Get, Post, Body ,Delete, Query,Param, Req, UseGuards } from '@nestjs/common';
import {  ApiBearerAuth,  ApiTags } from '@nestjs/swagger';
import { NotificationGateway } from './notification.gateway';

import { NoticeService } from './notice.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateNoticeDepartmentDto } from './dto/create-notice-department.dto';


@ApiTags('NoticeBoard')
@ApiBearerAuth()

@Controller('notices')
export class NoticeController {
    constructor (private notificationGateway: NotificationGateway, private noticeService: NoticeService ) {

    }

   @Get()
   @UseGuards(OptionalAuthGuard)
   getMyNotices(@Req() req, @Query() paginationQuery: PaginationDto) {
        return  this.noticeService.findNoticesOfAUser(req?.user?.sub, paginationQuery)
   }

}
