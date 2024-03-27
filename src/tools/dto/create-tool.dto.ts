import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OwnershipType, ToolsType } from '../enums/tools.enums';

export class CreateToolDto {
  @IsString()
  @ApiProperty()
  name: string;

  @IsEnum(ToolsType)
  @ApiProperty({default: ToolsType.EXTERNAL_LINK})
  type: ToolsType;

  @IsEnum(OwnershipType)
  @ApiProperty({default: OwnershipType.COMMON_FOR_ALL})
  ownershipType: OwnershipType;

  @IsOptional()
  @ApiPropertyOptional()
  link?: string;

  @IsOptional()
  @ApiPropertyOptional()
  courseId?: number[];

  @IsOptional()
  @ApiPropertyOptional()
  thumbnailId?: number;

}

