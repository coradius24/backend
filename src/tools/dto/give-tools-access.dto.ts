import { ApiProperty } from '@nestjs/swagger';
import {  IsNumber,  } from 'class-validator';

export class GiveToolsAccessDto {
  @IsNumber()
  @ApiProperty()
  userId: number;

  @IsNumber()
  @ApiProperty()
  toolId: number;

}

