import { ApiProperty } from '@nestjs/swagger';
import { MinLength } from 'class-validator';

export class PasswordResetDTO {
  
  @ApiProperty()
  @MinLength(6)
  password: string;

  @ApiProperty()
  reset_token: string;
}
