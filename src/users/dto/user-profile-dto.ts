import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsEmail, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { USER_STATUS, ROLE, PASSWORD_VERSION } from '../enums/user.enums';
import ProfileDTO from './profile-entity-dto';

class UserProfileDTO {
  @ApiProperty()
  @IsInt()
  id: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  fullName: string;

  @ApiProperty()
  @IsOptional()
  isKycVerified: boolean

  @ApiProperty()
  @IsEmail()
  @IsOptional()
  email: string;

  @Exclude()
  password: string;

  @Exclude()
  passwordVersion: PASSWORD_VERSION;

  @Exclude()
  lastPasswordChanged: Date;

  @ApiProperty({ enum: ROLE })
  @IsEnum(ROLE)
  @IsOptional()
  role: ROLE;

  @ApiProperty({ enum: USER_STATUS })
  @IsEnum(USER_STATUS)
  @IsOptional()
  status: USER_STATUS;

  @ApiProperty()
  @IsString()
  @IsOptional()
  mobileNumber: string;

  @ApiProperty()
  createdAt: Date;

  @Exclude()
  profileId: number;

  @ApiProperty({ type: ProfileDTO })
  profile?: ProfileDTO | null;

  constructor(data: Partial<UserProfileDTO>) {
    Object.assign(this, data);
  }
}



export default UserProfileDTO;
