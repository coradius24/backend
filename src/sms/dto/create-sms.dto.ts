import { ApiProperty } from "@nestjs/swagger"
import { IsEnum } from "class-validator"
import { SmsReceiver } from "../enums/sms.enums"

export class CreateSmsDto {
    @ApiProperty({default: SmsReceiver.INDIVIDUAL_USERS, description: `Available options : ${Object.values(SmsReceiver).map(value => value).join(', ')} `})
    @IsEnum(SmsReceiver)
    receiverType: SmsReceiver

    @ApiProperty({default: []})
    receivers: [number]

    @ApiProperty()
    message: string
}
