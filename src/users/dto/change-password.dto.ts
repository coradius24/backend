import { ApiProperty } from '@nestjs/swagger';
import { MinLength } from 'class-validator';

export class  changePasswordDto{
  @ApiProperty()
  currentPassword: string;

  @ApiProperty()
  @MinLength(6)
  newPassword: string;
}
