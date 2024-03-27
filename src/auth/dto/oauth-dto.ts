import { OAuthProvider } from './../enums/auth.enums';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class OAuthLoginDTO {
  
  @ApiProperty()
  token: string;

  @ApiProperty()
  @IsEnum(OAuthProvider)
  provider: OAuthProvider;
}
