import { Controller, Get, Post, Body,  Query, Req, UseGuards } from '@nestjs/common';
import { EarningReportsService } from './earning-reports.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { FeatureGuard } from 'src/auth/feature.guard';
import { CreatePayoutRequestDto } from './dto/create-payput-request.dto';
import { EarningReportQueryDto } from './dto/earning-report-query.dto';

@ApiTags('Earning Reports')
@Controller('earning-reports')
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class EarningReportsController {
  constructor(private readonly earningReportsService: EarningReportsService) { }
 

  @Get('my-earnings')
  @UseGuards(FeatureGuard)
  findMyReports(@Req() req, @Query() paginationDto: PaginationDto, @Query() earningReportQueryDto: EarningReportQueryDto) {
    return this.earningReportsService.findReportsOfAUser(req.user.sub, paginationDto, {...(earningReportQueryDto||{}), excludeCurrentDay: true});
  }

  @Get('my-wallet')
  @UseGuards(FeatureGuard)
  findMyWallet(@Req() req) {
    return this.earningReportsService.getWalletOfAUser(req.user.sub, {excludeCurrentDay: true});
  }

  @Get('my-shortlink')
  getMySmartLink(@Req() req) {
    return this.earningReportsService.getShortLinkOfAUser(req.user.sub);
  }


  @Get('my-payouts')
  getMyPayouts(@Req() req, @Query() paginationDto: PaginationDto,  @Query() earningReportQueryDto: EarningReportQueryDto) {
    return this.earningReportsService.getPayoutOfAUser(req.user.sub, paginationDto,earningReportQueryDto || {});
  }

  @Post('payout-request')
  createPayoutRequest(@Req() req, @Body() createPayoutRequest: CreatePayoutRequestDto) {
    return this.earningReportsService.createPayoutRequest(req.user, createPayoutRequest);
  }




}
