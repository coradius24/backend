// profile.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

class ProfileDTO {
  @ApiProperty()
  @IsString()
  @IsOptional()
  skills?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  biography?: string;

  @ApiPropertyOptional()
  @IsOptional()
  dateOfBirth?: Date;

  @ApiProperty()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  photo?: string;

  @ApiProperty()
  socialLinks: {
    twitter?: string;
    facebook?: string;
    linkedin?: string;
  };

  constructor(data: ProfileDTO) {
    Object.assign(this, data);
  }
}


export class UserProfileWithoutPhotoDTO {

  @ApiProperty()
  @IsString()
  @IsOptional()
  skills?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  biography?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  dateOfBirth?: Date;

  @ApiProperty()
  @IsString()

  @ApiProperty()
  socialLinks: {
    twitter?: string;
    facebook?: string;
    linkedin?: string;
  };

}

export default ProfileDTO;
