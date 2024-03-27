import { TokenType  } from './../auth.service';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyTokenDTO {
  
  @ApiProperty()
  token: string;

  @ApiProperty()
  token_type: TokenType;
}
