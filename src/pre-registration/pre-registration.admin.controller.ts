import { ArchivePreRegistrationDto } from './dto/archive-pre-registration.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Controller, Get, Patch, Param, Query, Res, UseGuards, Body,  } from '@nestjs/common';
import { PreRegistrationService } from './pre-registration.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PreRegistrationQueryDto } from './dto/pre-registartion.query.dto';
import * as moment from 'moment';
import { AuthGuard } from 'src/auth/auth.guard';
import { FeatureGuard } from 'src/auth/feature.guard';

@ApiTags('Pre Registration')
@UseGuards(AuthGuard, FeatureGuard)
@ApiBearerAuth()
@Controller('admin/pre-registrations')
export class PreRegistrationAdminController {
  constructor(private readonly preRegistrationService: PreRegistrationService) {}


  @Get('download')
  async downloadCsv(@Query() preRegistrationQueryDto: PreRegistrationQueryDto, @Res() res) {
    const csv = await this.preRegistrationService.downloadCsv(preRegistrationQueryDto);
    res.header('Content-Type', 'text/csv');
    const fileName = `free-class-registration(${preRegistrationQueryDto.startDate ? 'from-'+moment(preRegistrationQueryDto.startDate).add(6,'hours').format('DD-MM-YYYY') +'-' : '' }to-${moment(preRegistrationQueryDto.endDate ? preRegistrationQueryDto.endDate : moment().startOf('day')).add(6,'hours').format('DD-MM-YYYY')}).csv`
    res.attachment(fileName);
    res.header('customFileName', fileName);
    res.header('custom-file-name-expose-headers', fileName);

    return res.send(csv);

  }

  @Get()
  findAll(@Query() preRegistrationQueryDto: PreRegistrationQueryDto,@Query() paginationDto: PaginationDto) {
    return this.preRegistrationService.findAll(preRegistrationQueryDto, {
      ...paginationDto,
      paginated: true
    });
  }


  @Patch()
  markAsArchived(@Body() payload: ArchivePreRegistrationDto) {
    return this.preRegistrationService.markAsArchive(payload);
  }

  @Patch('archive-all/')
  archiveAll() {
    return this.preRegistrationService.archiveAll();
  }

}
