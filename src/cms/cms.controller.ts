import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CmsService } from './cms.service';

@Controller('cms')
@ApiTags('CMS')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get('featured-instructors')
  getFeaturedInstructors() {
    return this.cmsService.getFeaturedInstructors();
  }

  @Get('pages/:pageId')
  getPageData(@Param('pageId') pageId: string) {
    return this.cmsService.getPageData(pageId);
  }

  @Get('team-members')
  getTeamMembers(@Query() paginationDto: PaginationDto) {
    return this.cmsService.getTeamMembers(paginationDto, 'public');
  }
  


}
