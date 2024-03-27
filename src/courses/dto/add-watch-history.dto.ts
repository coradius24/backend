import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';

export class WatchHistoryDto {
  @ApiProperty()
  @IsOptional()
  @IsInt()
  lessonId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  watchTimeInSecond?: number;

//   @ApiPropertyOptional()
//   @IsOptional()
//   @IsInt()
//   completePercentage?: number;
}
