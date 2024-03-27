import { PayoutStatsDto } from './dto/payout-stats-query.dto';
import { EnrollmentSpikesQueryDto } from './../enrollments/dto/enrollment-chart-query.dto';
import { UpdateReviewerStatusDto } from './dto/update-reviewer-status.dto';
import { Controller, Get, Post, Body,  Param, Query, UseGuards, Req, Patch } from '@nestjs/common';
import { EarningReportsService } from './earning-reports.service';

import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { FeatureGuard } from 'src/auth/feature.guard';
import { CreatePayoutRequestDto } from './dto/create-payput-request.dto';
import { EarningReportQueryDto } from './dto/earning-report-query.dto';
import { CreateSmartLinkDto } from './dto/create-smartlink.dto';
import { UpdatePayoutRequestDto } from './dto/update-payout-request.dto';
import { PayoutsQueryDto } from './dto/payouts-query.dto';
import { SearchQueryDto } from './dto/search-query.dto';
import { InsertExtraClicksDto } from './dto/insert-extra-clicks.dto';
import { UpdateSmartLinkStatusDto } from './dto/update-smartlink-status.dto';

@ApiTags('Earning Reports (Admin)')
@Controller('admin/earning-reports')
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class EarningReportsAdminController {
  constructor(private readonly earningReportsService: EarningReportsService) { }

  @Get('/daily')
  @ApiOperation({ summary: 'Get daily earning and click reports of all students' })
  @UseGuards(FeatureGuard)
  getDailyReports( @Query() paginationDto: PaginationDto, @Query() earningReportQueryDto: EarningReportQueryDto) {
    return this.earningReportsService.getDailyReports( paginationDto, earningReportQueryDto || {});
  }


  @Get('')
  @UseGuards(FeatureGuard)
  @ApiOperation({ summary: 'Get earning of all students' })
  getReports( @Query() paginationDto: PaginationDto, @Query() earningReportQueryDto: EarningReportQueryDto) {
    return this.earningReportsService.getReports( paginationDto, earningReportQueryDto || {});
  }

  @Get('balances')
  @ApiOperation({ summary: 'Get wallet(balance,totalEarning,totalWithdraw) of all students' })
  @UseGuards(FeatureGuard)
  getUserBalances( @Query() paginationDto: PaginationDto, @Query() searchQueryDto: SearchQueryDto) {
    return this.earningReportsService.getWallets( paginationDto, searchQueryDto);
  }


  @Get('users/:userId')
  @UseGuards(FeatureGuard)
  @ApiOperation({ summary: 'Get daily earning report of a student by userId' })

  findReportOfAUser(@Param('userId') userId: number, @Query() paginationDto: PaginationDto, @Query() earningReportQueryDto: EarningReportQueryDto) {
    return this.earningReportsService.findReportsOfAUser(userId, paginationDto, earningReportQueryDto || {});
  }

  @Get('wallets/users/:userId')
  @ApiOperation({ summary: 'Get wallet information(balance,withdraw,totalEarning) by userId ' })

  @UseGuards(FeatureGuard)
  findMyWallet(@Param('userId') userId: number) {
    return this.earningReportsService.getWalletOfAUser(userId);
  }

  @Get('shortlinks/users/:userId')
  @UseGuards(FeatureGuard)
  @ApiOperation({ summary: 'Get smartlinks by userId' })

  getMySmartLink(@Param('userId') userId: number) {
    return this.earningReportsService.getShortLinkOfAUser(userId);
  }

  @Post('shortlinks/')
  @ApiOperation({ summary: 'Generate Smart Link for student' })
  @UseGuards(FeatureGuard)
  generateSmartLink(@Body() createSmartLinkDto: CreateSmartLinkDto) {
    return this.earningReportsService.createShortLink(createSmartLinkDto.userId, createSmartLinkDto.courseId);
  }

  @Patch('shortlinks/:shortLinkId/status')
  @ApiOperation({ summary: 'Update shortlink status' })
  @UseGuards(FeatureGuard)
  updateSmartLink(@Param('shortLinkId') shortLinkId: number, @Body() payload: UpdateSmartLinkStatusDto) {
    return this.earningReportsService.updateShortUrlStatus(shortLinkId, payload.status);
  }

  @Get('payouts')
  @UseGuards(FeatureGuard)
  @ApiOperation({ summary: 'Get payouts of students' })

  getPayouts(@Query() paginationDto: PaginationDto,  @Query() payoutsQueryDto: PayoutsQueryDto) {
    return this.earningReportsService.getPayouts(paginationDto, payoutsQueryDto || {});
  }

  @Get('payouts/users/:userId')
  @UseGuards(FeatureGuard)
  @ApiOperation({ summary: 'Get payout histories of a student' })

  getPayoutsOfAUser(@Param('userId') userId: number, @Query() paginationDto: PaginationDto,  @Query() earningReportQueryDto: EarningReportQueryDto) {
    return this.earningReportsService.getPayoutOfAUser(userId, paginationDto,earningReportQueryDto || {});
  }

  // @Post('payouts/users/:userId')
  // @ApiOperation({ summary: 'Admin create payout manully for student' })
  // @UseGuards(FeatureGuard)
  // createPayoutRequest(@Param('userId') userId: number, @Body() createPayoutRequest: CreatePayoutRequestDto) {
  //   return this.earningReportsService.createPayoutRequest(userId, createPayoutRequest);
  // }

  @Patch('payouts/:id')
  @ApiOperation({ summary: 'Update payout request of student by payoutId' })
  @UseGuards(FeatureGuard)
  updatePayoutStatus(@Req() req, @Param('id') id: number, @Body() updatePayoutRequest: UpdatePayoutRequestDto) {
    return this.earningReportsService.updatePayoutStatus(req.user.sub, id,  updatePayoutRequest.payoutStatus);
  }

  @Patch('payouts/:id/review')
  @ApiOperation({ summary: 'Update payout request review status after reviewer review' })
  @UseGuards(FeatureGuard)
  updateReviewerStatus(@Req() req, @Param('id') id: number, @Body() updateReviewerStatus: UpdateReviewerStatusDto) {
    return this.earningReportsService.updateReviewStatus(req.user.sub, id,  updateReviewerStatus.reviewerMessage, updateReviewerStatus.reject);
  }

  @Get('payout-stats')
  @UseGuards(FeatureGuard)
  getPayoutStats(@Query() query: PayoutStatsDto) {
    return this.earningReportsService.getPayoutStats(query);
  }

  @Get('daily-spikes')
  @UseGuards(FeatureGuard)
  getShortenerClickSpikes(@Query() query: EnrollmentSpikesQueryDto) {
    return this.earningReportsService.getDailyClickSpikes(query.startDate, query.endDate);
  }

  @Post('extra-clicks')
  @UseGuards(FeatureGuard)
  insertExtraClicks(@Body() payload: InsertExtraClicksDto) {
    return this.earningReportsService.insertExtraClicks(payload.shortLinkSlug, payload.clickCount);
  }

  @Post('all-student-bulk-smartlink/:courseId')
  @UseGuards(FeatureGuard)
  bulkSmartLinkGeneration(@Param('courseId') courseId: number) {
    return this.earningReportsService.createShortLinksForAllStudentsOfACourse(courseId);
  }


}
