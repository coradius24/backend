import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDefined } from "class-validator";

export class EvaluateAssignmentDto {
    @ApiProperty()
    @IsDefined()
    submissionId: number

    @ApiPropertyOptional()
    remarks: string

    @ApiPropertyOptional({
      default: false
    })
    askForResubmit: boolean
}
