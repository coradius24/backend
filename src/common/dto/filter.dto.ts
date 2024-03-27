import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterDto {
  @IsOptional()
  @IsString()
  @ApiProperty()
  search?: string;
}
