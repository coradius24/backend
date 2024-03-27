import { ToolsAccessesQueryDto } from './dto/tools-accesses-query.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, Query } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GiveToolsAccessDto } from './dto/give-tools-access.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { FeatureGuard } from 'src/auth/feature.guard';

@ApiTags('Tools')
@Controller('admin/tools')
@ApiBearerAuth()
@UseGuards(AuthGuard,FeatureGuard)
export class ToolsAdminController {
  constructor(private readonly toolsService: ToolsService) {}

  @Post()
  create(@Body() createToolDto: CreateToolDto) {
    return this.toolsService.create(createToolDto);
  }

  @Get()
  findAllToolsByFilter(@Query() paginationDto: PaginationDto,) {
    return this.toolsService.findAllToolsByFilter(paginationDto);
  }

  @Get('access/users/:userId')
  findAccessableToolsByUserId(@Param('userId') userId: number) {
    return this.toolsService.getToolsOfAUser(userId, true, false);
  }

  @Delete('access/:toolId/:userId') 
  removeAccess(@Param('toolId') toolId: number, @Param('userId') userId: number) {
    return this.toolsService.removeAccess(toolId, userId);
  }




  @Get('access')
  allToolAccesses(@Query() paginationDto: PaginationDto, @Query() filterDto:  ToolsAccessesQueryDto ) {
    return this.toolsService.getAllToolAccess(paginationDto, filterDto);
  }

  @Post('access')
  giveToolAccess(@Req() req, @Body() payload: GiveToolsAccessDto) {
    return this.toolsService.giveToolAccess(payload,  req.user.sub);
  }

  @Post('bulk-access-to-all-paid-students/:courseId/:toolId')
  giveToolAccessInBulk(@Req() req, @Param('courseId') courseId : number,@Param('toolId') toolId : number) {
    return this.toolsService.giveCourseAssociateToolsInBulk(courseId, toolId,  req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateToolDto: UpdateToolDto) {
    return this.toolsService.update(+id, updateToolDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.toolsService.remove(+id);
  }
}
