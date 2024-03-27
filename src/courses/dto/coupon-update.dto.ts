import { CreateCouponDto } from './coupon-create.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateCouponDto extends PartialType(CreateCouponDto) {}
