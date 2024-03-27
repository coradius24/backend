import { ROLE, USER_STATUS } from './../../users/enums/user.enums';
import { TokenType  } from './../auth.service';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class JWTPayloadDTO {
  
  @ApiProperty()
  sub: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  @ApiProperty({ enum: ROLE })
  @IsEnum(ROLE)
  role: ROLE

  @ApiProperty()
  @ApiProperty({ enum: USER_STATUS })
  @IsEnum(USER_STATUS)
  status: USER_STATUS

  @ApiProperty()
  token_type: TokenType;
}
