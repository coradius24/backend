import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({default: 10})
  @Type(() => Number)
  readonly limit?: number;

  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({default: 1})
  @Type(() => Number)
  page?: number;
}
