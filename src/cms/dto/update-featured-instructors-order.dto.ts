

import { ApiProperty } from "@nestjs/swagger";

export class UpdateFeaturedInstructorsOrderDto {

    @ApiProperty({ type: [Object] })
    payloadArray: Array<{ userId: number; serialId: number }>;
  
}
