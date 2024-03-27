import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDefined } from "class-validator";

export class AssignmentSubmissionDto {
    @ApiProperty()
    @IsDefined()
    assignmentId: number

    @ApiProperty({
      type: 'array',
      items: { type: 'string', format: 'binary' },
      description: 'Document files',
    })
    attachments: any[];

    @ApiPropertyOptional()
    submissionNote: string
}
