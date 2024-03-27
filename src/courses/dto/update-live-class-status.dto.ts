import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateLiveClassStatusDto {
  @ApiProperty()
  @IsBoolean()
  isOnGoing: boolean;
}
