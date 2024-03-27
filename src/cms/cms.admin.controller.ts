import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { Controller, Post, Body, Patch, Param, Delete, UseGuards, Get, Query, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { FeatureGuard } from 'src/auth/feature.guard';
import { CmsService } from './cms.service';
import { CreateFeaturedInstructorDto } from './dto/create-fearured-instructor.dto';
import { UpdateFeaturedInstructorsOrderDto } from './dto/update-featured-instructors-order.dto';
import { UpsertPageDto } from './dto/upsert-page.dto';
import { UpdateTeamMembersOrderDto } from './dto/update-team-members-order.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';

@Controller('admin/cms')
@ApiTags('CMS')
@ApiBearerAuth()
@UseGuards(AuthGuard, FeatureGuard)
export class CmsAdminController {
  constructor(private readonly cmsService: CmsService) {}

 
  @Patch('page')
  updatePage(@Body() payload: UpsertPageDto) {
    return this.cmsService.upsertPageData(payload);
  }

  @Post('featured-instructors')
  addFeaturedInstructor(@Body() payload: CreateFeaturedInstructorDto) {
    return this.cmsService.createFeaturedInstructor(payload);
  }

  @Patch('featured-instructors/order')
  updateFeaturedInstructorsOrder(@Body() payload: UpdateFeaturedInstructorsOrderDto) {
    return this.cmsService.updateFeaturedInstructorsOrder(payload.payloadArray);
  }

  @Delete('featured-instructors/:id')
  remove(@Param('id') id: number) {
    return this.cmsService.removeFeaturedInstructor(id);
  }

  @Get('team-members')
  getTeamMembers(@Query() paginationDto: PaginationDto) {
    return this.cmsService.getTeamMembers(paginationDto, 'all');
  }

  @Post('team-members')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'photo', maxCount: 1 }
  ]))
  addTeamMember(@Body() payload: CreateTeamMemberDto,  @UploadedFiles() images) {
    const photo = images.photo
    ? { buffer: images.photo[0].buffer, originalname: images.photo[0].originalname }
    : null;
    return this.cmsService.createTeamMember(payload, photo);
  }

  @Patch('team-members/re-order/members')
  updateTeamMembersOrder(@Body() payload: UpdateTeamMembersOrderDto) {
    return this.cmsService.updateTeamMembersOrder(payload.payloadArray);
  }

  @Patch('team-members/:id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'photo', maxCount: 1 }
  ]))
  updateTeamMember(@Param('id') id: number, @Body() payload: CreateTeamMemberDto,  @UploadedFiles() images) {
    const photo = images.photo
    ? { buffer: images.photo[0].buffer, originalname: images.photo[0].originalname }
    : null;
    return this.cmsService.updateTeamMember(id, payload, photo);
  }
  

  @Delete('team-members/:id')
  removeTeamMember(@Param('id') id: number) {
    return this.cmsService.removeTeamMember(id);
  }
}
