import { ReviewAttachmentType } from './../reviews/enums/review.enums';
import { Coupon, CouponPurpose, CouponScope } from './entities/coupon.entity';
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, In, Not, Repository, IsNull } from 'typeorm';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Review } from 'src/reviews/entities/review.entity';
import { Payment } from 'src/payments/entities/payment.entity';
import { PaymentStatus } from 'src/payments/enums/payments.enum';
import { Lesson } from './entities/course-lesson.entity';
import { LessonType } from './enums/course.enums';

@Injectable()
class CouponService{
    constructor(
        @InjectRepository(Coupon)  private couponRepository: Repository<Coupon>,
        @InjectRepository(Review)  private reviewRepository: Repository<Review>,
        @InjectRepository(Payment)  private paymentRepository: Repository<Payment>,
        @InjectRepository(Lesson)  private lessonRepository: Repository<Lesson>,
        
        
    ) {}

    async createCoupon(createCouponDto) {
        if(createCouponDto?.code) {
            createCouponDto.code = createCouponDto.code?.toUpperCase()
        }
        const matchCoupon = await this.couponRepository
        .findOneBy({code: createCouponDto.code})
        if(matchCoupon) {
            throw new BadRequestException(`A Coupon already exists by this code : ${matchCoupon.code}`)
        }

        return this.couponRepository.insert(createCouponDto)
    }

    async findAllCoupons({limit = 10, page= 1}: PaginationDto) {
        const skip = (page-1) * limit;
        const order: any = {
            id: 'DESC'
        }

        const [results, totalCount] = await this.couponRepository.findAndCount({
            order,
            skip, 
            take: limit
        })

        const currentTime = new Date()
        const checkCouponStatus = (startFrom, expiry) => {
            if(startFrom && currentTime <  startFrom) {
                return 'scheduled'
            }

            if(expiry && currentTime >  expiry) {
                return 'expired'
            }

            return 'active'
        }
        return {
            results: results.map(coupon => ({
                ...coupon,
                status: checkCouponStatus(coupon.startFrom, coupon.expiry)

            })), 
            totalCount,
            page,
            limit

        }
    }

    updateCoupon(id, updateCouponDto) {
        if(updateCouponDto?.code) {
            updateCouponDto.code = updateCouponDto.code?.toUpperCase()
        }
        return this.couponRepository.update(id, updateCouponDto)
    }

    removeCoupon(id:  number) {
        return this.couponRepository.delete(id)
    }

    getAllRewardCoupons() {
        return this.couponRepository.find({
            where: {
                purpose: CouponPurpose.VIDEO_FEEDBACK_REWARD
            }
        })
    }
    async getAvailableRewardCouponsOfUser(userId) {
        const query: any = {
            userId,
            attachmentType: ReviewAttachmentType.VIDEO
        }

        const givenVideoFeedbacks = await this.reviewRepository.find({
            where: query,
            select: ['batchCourseId']
        })
        const videoFeedbackGivenCourseIds = givenVideoFeedbacks?.map(d=> d.batchCourseId);

        const lessonsWithRewardCoupons = await this.lessonRepository.find({
            where: {
                lessonType: LessonType.FEEDBACK ,
                courseId: In(videoFeedbackGivenCourseIds),
                rewardCoupon: Not(IsNull())
            },
            select: ['rewardCoupon']
        })
        const rewardCoupons = lessonsWithRewardCoupons?.map(d=>d.rewardCoupon)
        
        const couponUsedPayments = await this.paymentRepository.find({
            where: {
                couponApplied: In(rewardCoupons),
                paymentStage: PaymentStatus.COMPLETED
            },
            select: ['couponApplied']

          
        })
        const alreadyUsedCoupons = couponUsedPayments?.map(d=>d.couponApplied)
        
        const availableCoupons = rewardCoupons.filter(coupon => !alreadyUsedCoupons.includes(coupon))

        if(!availableCoupons?.length)  {
            return new NotFoundException('No reward coupon found')
        }
        return availableCoupons
    }

    async checkValidity({code, courseId, requestingUser}) {
        const couponDetails = await this.couponRepository
        .createQueryBuilder('coupon')
        .where('coupon.code = :code', { code: code?.toUpperCase() })
        .andWhere(new Brackets(qb => {
          qb.where('coupon.courseIds = :courseId', { courseId })
            .orWhere('coupon.scope = :scope', { scope: CouponScope.ALL_COURSES });
        }))
        .getOne()
        ;
      

        if(!couponDetails) {
            throw new BadRequestException('Invalid coupon code!')
        }

        const currentTime = new Date()
        if(couponDetails.startFrom && couponDetails.startFrom > currentTime) {
            throw new BadRequestException('This coupon not active yet!')
        }

        if(couponDetails.expiry && currentTime > couponDetails.expiry) {
            throw new BadRequestException('Coupon expired!')
        }
        
        if(couponDetails.purpose === CouponPurpose.VIDEO_FEEDBACK_REWARD ) {
            if(!requestingUser) {
                throw new BadRequestException('এই কুপন প্রয়োগ করতে আপনাকে অবশ্যই লগ ইন করতে হব!')

            }
            const userId = requestingUser.id || requestingUser.sub
            const query: any = {
                userId,
                attachmentType: ReviewAttachmentType.VIDEO
            }
            if(couponDetails.courseIds?.length && couponDetails.scope != CouponScope.ALL_COURSES) {
                query.batchCourseId = courseId
            }
            const isUserEligible = await this.reviewRepository.findOne({
                where: query,
                select: ['id']
            })
            if(!isUserEligible) {
                throw new BadRequestException('দুঃখিত, এই কুপনটি আপনার জন্য প্রযোজ্য নয়!')

            }
            const hasAlreadyUsed = await this.paymentRepository.findOne({
                where: {
                    userId,
                    paymentStage: PaymentStatus.COMPLETED,
                    couponApplied: code
                }
            })
            if(hasAlreadyUsed) {
                throw new BadRequestException('দুঃখিত, এই কুপনটি কেবল একবারই যোগ্য, যা আপনি ইতিমধ্যে ব্যবহার করে ফেলেছেন!')

            }
            // todo: check if he used it already
        }
        return couponDetails
    }



}


export default CouponService