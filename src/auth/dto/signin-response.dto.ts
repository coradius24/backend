// login-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import UserProfileDTO from 'src/users/dto/user-profile-dto';

class SignInResponseDTO {
  @ApiProperty()
  access_token: string;

  @ApiProperty({ type: UserProfileDTO })
  user: UserProfileDTO;

  constructor(data: SignInResponseDTO) {
    Object.assign(this, data);
  }
}

export default SignInResponseDTO;
