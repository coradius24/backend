import { ApiProperty } from "@nestjs/swagger";
import { IsDefined } from "class-validator";

export class CouponQueryDto {
    @ApiProperty()   
    @IsDefined()
    code: string

    @ApiProperty()   
    @IsDefined()
    courseId: number
    
}