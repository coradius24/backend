import { Controller, Get,  Param,  Post,  Req, UseGuards } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { ApiBearerAuth,  ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';

@ApiTags('Tools')
@Controller('tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('my-tools')
  findLoggedInUsersTool(@Req() req ) {
    return this.toolsService.getToolsOfAUser(req.user.sub, true, true);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('my-tools/courses/:courseId')
  findLoggedInUsersToolOfACourse(@Req() req, @Param('courseId') courseId: number ) {
    return this.toolsService.getToolsOfAUserByCourseId(req.user.sub,courseId, true, true );
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('uply/login')
  loginToUply(@Req() req ) {
    return this.toolsService.loginToUply(req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('getyourtools/login')
  loginToGetYourTools(@Req() req ) {
    return this.toolsService.loginToGetYourTools(req.user.sub);
  }


}
