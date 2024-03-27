import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { SupportsService } from './supports.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('supports')
@UseGuards(AuthGuard)
@ApiBearerAuth()
@ApiTags('Supports')
export class SupportsController {
  constructor(private readonly supportsService: SupportsService) {}

  @Get()

  getSupportBoard(@Req() req) {
    return this.supportsService.getSupportBoard(req.user?.sub);
  }

}
