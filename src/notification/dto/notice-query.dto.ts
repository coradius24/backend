import { NotificationReceiver } from 'src/notification/enums/notification.enums';
import {  ApiPropertyOptional } from "@nestjs/swagger";

export class NoticeQueryDto {
    @ApiPropertyOptional({default: NotificationReceiver.INDIVIDUAL_USERS, description: `Available options : ${Object.values(NotificationReceiver).map(value => value).join(', ')} `})
   
    receiverType: NotificationReceiver

    @ApiPropertyOptional({default: []})
    receivers: [number]

    @ApiPropertyOptional({default: 'false'})
    scheduledOnly?: string

    @ApiPropertyOptional({default: 'false'})
    instantOnly?: string

}
