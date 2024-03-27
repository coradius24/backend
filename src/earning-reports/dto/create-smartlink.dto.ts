import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDefined,  IsNumber,  } from "class-validator";

// samiuli437	$8.88
export class CreateSmartLinkDto {
    @ApiProperty()
    @IsNumber()
    @IsDefined()
    userId: number

    @ApiPropertyOptional()
    @IsNumber()
    @IsDefined()
    courseId: number


}
