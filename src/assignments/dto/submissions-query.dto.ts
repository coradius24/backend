import { AssignmentSubmissionStatus } from './../enums/assignment.enum';
import { ApiPropertyOptional } from "@nestjs/swagger";

export class SubmissionsQueryDto {
    @ApiPropertyOptional({default: 'all'})
    status: AssignmentSubmissionStatus
}