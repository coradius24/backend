import { ROLE, USER_STATUS } from 'src/users/enums/user.enums';
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class CreateUserDto {
    @ApiProperty()
    fullName: string

    @ApiProperty()
    @IsEmail()
    email: string

    @ApiProperty({default: ROLE.student})
    role: number


    @ApiPropertyOptional({default: ''})
    mobileNumber: string

    @ApiPropertyOptional({default: ''})
    password: string

}
