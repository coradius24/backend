import { OptionalAuthGuard } from './../auth/optionalAuth.guard';
import { Controller, Get, Post, Body, UseGuards, Req, Query } from '@nestjs/common';
import { PreRegistrationService } from './pre-registration.service';
import { CreatePreRegistrationDto } from './dto/create-pre-registration.dto';
import { ApiTags } from '@nestjs/swagger';
import { PreRegistrationStatusQueryDto } from './dto/pre-registration-status.query.dto';

@ApiTags('Pre Registration')
@Controller('pre-registrations')
export class PreRegistrationController {
  constructor(private readonly preRegistrationService: PreRegistrationService) {}

  @UseGuards(OptionalAuthGuard)
  @Post()
  create( @Req() req, @Body() createPreRegistrationDto: CreatePreRegistrationDto) {
    return this.preRegistrationService.create(createPreRegistrationDto, req?.user?.sub);
  }

  @UseGuards(OptionalAuthGuard)
  @Get('status')
  getPreRegistrationStatus(@Req() req, @Query() queryDto: PreRegistrationStatusQueryDto) {
    return this.preRegistrationService.checkEligibility(req?.user?.sub, queryDto);
  }

 
}
