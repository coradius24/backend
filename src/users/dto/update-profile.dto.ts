
import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import ProfileDTO, { UserProfileWithoutPhotoDTO } from "./profile-entity-dto";


export class UpdateProfileDto  {
   
    @ApiProperty()
    @IsString()
    @IsOptional()
    fullName?: string;
  
    @ApiProperty()
    @IsString()
    @IsOptional()
    mobileNumber?: string;
  
  
    @ApiProperty({ type: UserProfileWithoutPhotoDTO })
    profile?: ProfileDTO | null;
  

}

