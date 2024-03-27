import { Controller, Get,  UseGuards, Request } from '@nestjs/common';
import { AccessControlService } from './access-control.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags("AccessControl")
@Controller('access-control')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AccessControlController {
  constructor(private readonly accessControlService: AccessControlService) {}

  @Get('my-features')
  findMyFeatures(@Request() req) {
    return this.accessControlService.findMyFeatures(req.user);
  }

}
