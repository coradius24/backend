import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsEnum } from "class-validator"
import { NotificationReceiver } from "../enums/notification.enums"

export class CreateNotificationDto {
    @ApiProperty({default: NotificationReceiver.INDIVIDUAL_USERS, description: `Available options : ${Object.values(NotificationReceiver).map(value => value).join(', ')} `})
    @IsEnum(NotificationReceiver)
    receiverType: NotificationReceiver

    @ApiProperty({default: []})
    receivers: [number]

    @ApiProperty()
    message: string

    @ApiPropertyOptional()
    scheduled: Date
}
