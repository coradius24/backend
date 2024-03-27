import { ApiProperty } from '@nestjs/swagger';
import { MinLength } from 'class-validator';

export class PasswordSetDTO {
  
  @ApiProperty()
  @MinLength(6)
  password: string;

  @ApiProperty()
  token: string;
}
