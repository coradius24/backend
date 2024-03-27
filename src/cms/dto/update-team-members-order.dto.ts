

import { ApiProperty } from "@nestjs/swagger";

export class UpdateTeamMembersOrderDto {

    @ApiProperty({ type: [Object] })
    payloadArray: Array<{ id: number; serialId: number }>;
  
}
