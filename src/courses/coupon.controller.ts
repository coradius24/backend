import { FeatureGuard } from 'src/auth/feature.guard';
import { AuthGuard } from 'src/auth/auth.guard';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PaginationDto } from "src/common/dto/pagination.dto";
import CouponService from "./coupon.service";
import { CouponQueryDto } from "./dto/coupon-validation-query.dto";
import { CreateCouponDto } from './dto/coupon-create.dto';
import { UpdateCouponDto } from './dto/coupon-update.dto';
import { OptionalAuthGuard } from 'src/auth/optionalAuth.guard';

@Controller()
@ApiTags('Coupons')
class CouponController {
    constructor(private couponService: CouponService) { }

    @UseGuards(OptionalAuthGuard)
    @Get('coupons/validity')
    checkCouponValidity(@Query()couponQueryDto: CouponQueryDto, @Req() req) {
        return this.couponService.checkValidity({...couponQueryDto, requestingUser:req.user })
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @Get('coupons/my-reward-coupons')
    getMyRewardCoupons(@Req() req) {
        return this.couponService.getAvailableRewardCouponsOfUser(req.user.sub)
    }

    @Get('admin/coupons/reward-coupons') 
    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    getAllRewardCoupons() {
        return this.couponService.getAllRewardCoupons()
    }
    @UseGuards(AuthGuard)
    @Get('admin/coupons/users/:userId/reward-coupons')
    getRewardCouponsOfAUser(@Param() userId: number) {
        return this.couponService.getAvailableRewardCouponsOfUser(userId)
    }

    @Post('admin/coupons') 
    @ApiBearerAuth()
    @UseGuards(AuthGuard, FeatureGuard)
    createCoupon(@Body() createCouponDto: CreateCouponDto) {
        return this.couponService.createCoupon(createCouponDto)
    }

    @Patch('admin/coupons/:id') 
    @ApiBearerAuth()
    @UseGuards(AuthGuard, FeatureGuard)
    updateCoupon(@Param('id') id: number, @Body() updateCouponDto: UpdateCouponDto) {
        return this.couponService.updateCoupon(id, updateCouponDto)
    }

    @Get('admin/coupons')
    @ApiBearerAuth()
    @UseGuards(AuthGuard, FeatureGuard)
    getAllCoupons(@Query() paginationQuery: PaginationDto) {
        return this.couponService.findAllCoupons(paginationQuery)
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard, FeatureGuard)
    @Delete('admin/coupons/:id')
    removeCoupon(@Param('id') id: number) {
        return this.couponService.removeCoupon(id)
    }
}

export default CouponController