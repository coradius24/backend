import { NotificationReceiver } from 'src/notification/enums/notification.enums';
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum } from 'class-validator';

export class CreateNoticeDto {
    @ApiProperty({default: NotificationReceiver.INDIVIDUAL_USERS, description: `Available options : ${Object.values(NotificationReceiver).map(value => value).join(', ')} `})
    @IsEnum(NotificationReceiver)
    receiverType: NotificationReceiver

    @ApiPropertyOptional({default: []})
    receivers?: [number]

    @ApiProperty()
    title: string

    @ApiProperty()
    body: string

    @ApiPropertyOptional()
    scheduled?: Date

    @ApiPropertyOptional()
    thumbnailId?: number

    @ApiPropertyOptional()
    departmentId?: number
}
