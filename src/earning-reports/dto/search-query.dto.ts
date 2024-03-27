import {  ApiPropertyOptional } from "@nestjs/swagger";

// samiuli437	$8.88
export class SearchQueryDto {
    @ApiPropertyOptional()
    search?: string
}
