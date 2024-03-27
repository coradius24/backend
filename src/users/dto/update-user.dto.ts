import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { USER_STATUS } from '../enums/user.enums';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @ApiPropertyOptional({enum: USER_STATUS})
    status: string

    @ApiPropertyOptional()
    email: string
}
