// bulkRemoveDTO.ts

import {  IsArray, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkUnenrollDTO {
  @ApiProperty({
    description: 'An array of user IDs',
    type: 'array',
    items: { type: 'integer' },
    example: [1, 2, 3],
    default: [],
  })
  @IsArray()
  @ArrayNotEmpty()
  userIds: number[];
}
