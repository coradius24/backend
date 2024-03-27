import { ApiProperty } from "@nestjs/swagger";

export class ArchivePreRegistrationDto {
    @ApiProperty({default: []})
    ids: number[]
    
    @ApiProperty({default: true})
    isArchived: boolean
}
