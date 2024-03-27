import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

export class SignInDto {
  @ApiProperty({ default: 'solaimanshadin+1@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ default: 'password' })
  @MinLength(4)
  password: string;

  @ApiPropertyOptional({ default: 'false' })
  isAdministrativeRole: boolean;
}
