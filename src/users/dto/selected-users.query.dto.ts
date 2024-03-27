import {  ApiPropertyOptional } from "@nestjs/swagger";

export class SelectedUsersQueryDto {
    @ApiPropertyOptional({default: []})
    ids: [number]
}
