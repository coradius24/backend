import { ApiPropertyOptional } from '@nestjs/swagger';

export class ToolsAccessesQueryDto {
  @ApiPropertyOptional()
  search: string;

  @ApiPropertyOptional()
  toolId: number;

}

