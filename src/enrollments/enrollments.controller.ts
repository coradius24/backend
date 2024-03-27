import { Controller, Get,  UseGuards, Req } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';

@ApiTags('Enrollments')
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('my-enrollments')
  getCoursesOfLoggedInUser(@Req() req) {
    return this.enrollmentsService.getEnrolledCoursesOfAUser(req.user.sub);
  }

  // @ApiBearerAuth()
  // @UseGuards(AuthGuard)
  // @Get('supports')
  // getSupportBoards(@Req() req) {
  //   return this.enrollmentsService.getSupportBoardOfUser(req.user.sub);
  // }
  
}
