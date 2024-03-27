import { FeatureGuard } from 'src/auth/feature.guard';
import { AuthGuard } from 'src/auth/auth.guard';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateSmsDto } from './dto/create-sms.dto';
import { SmsService } from './sms.service';

@ApiTags('SMS')
@Controller('admin/sms')
@ApiBearerAuth()
@UseGuards(AuthGuard, FeatureGuard)
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post()
  sendBulkSms(@Body() payload: CreateSmsDto) {
    return this.smsService.sendSmsToReceiverGroup(payload)
  }

  @Get('balance')
  getSmsBalance() {
    return this.smsService.checkSmsBalance()
  }


  
}
