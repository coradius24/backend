import { CouponDiscountType, CouponScope } from '../entities/coupon.entity';
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDefined } from "class-validator";
const oneWeekFromNow = new Date();
oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);


export class CreateLiveClassDto {
    @ApiProperty()   
    @IsDefined()
    courseId: number

    @ApiPropertyOptional({default: new Date()})   
    dateTime: Date

    @ApiPropertyOptional()
    noteToStudents?: string

    @ApiPropertyOptional()   
    zoomMeetingLink?: string;

    @ApiPropertyOptional()   
    zoomMeetingId?: string;

    @ApiPropertyOptional()   
    zoomMeetingPassword?: string;

    
}