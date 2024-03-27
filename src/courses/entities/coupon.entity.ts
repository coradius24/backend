import {  Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
export enum CouponDiscountType {
    FLAT = 'flat',
    PERCENTAGE = 'percentage'
}

export enum CouponScope{ 
    COURSE_SPECIFIC = 'courseSpecific',
    ALL_COURSES = 'allCourses',
}

export enum CouponPurpose{ 
    GENERAL = 'general',
    VIDEO_FEEDBACK_REWARD = 'videoFeedbackReward',
}

@Entity({name: 'coupons'})
export class Coupon {
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: 'varchar', length: '50'})
    code: string

    @Column({type: 'int'})
    discountAmount: 10

    @Column({type: 'enum', enum: CouponScope, default: CouponScope.ALL_COURSES})
    scope: string


    @Column({type: 'simple-array', nullable: true})
    courseIds: number[]

    @Column({type: 'enum', enum: CouponDiscountType, default: CouponDiscountType.FLAT})
    discountType: string

    @Column({type: 'enum', enum: CouponPurpose, default: CouponPurpose.GENERAL})
    purpose: string

    @Column({type: 'datetime', default: () => 'CURRENT_TIMESTAMP'})
    startFrom: Date

    @Column({type: 'datetime', nullable: true})
    expiry: Date

    @CreateDateColumn()
    createdAt: Date

    @Column({type: 'int', nullable: true})
    createdBy: number


}