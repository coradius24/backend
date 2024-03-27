import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBooleanString } from "class-validator";

export class CreateTeamMemberDto {
    @ApiProperty()
    fullName: string;

    @ApiProperty()
    title: string;

    @ApiPropertyOptional()
    socialLinks: {
      twitter?: string;
      facebook?: string;
      linkedin?: string;
    };

    @ApiPropertyOptional({
        type: 'string',
        format: 'binary', description: 'Reviewer Photo File', required: false
    })
    photo: any;

    @ApiPropertyOptional({default: true})
    isPublic: boolean;
}
