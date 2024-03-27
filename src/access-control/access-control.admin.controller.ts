import { UpdateFeatureUserMapDto } from './dto/update-feature-user-map.dto';
import { AddToFeatureUserMapDto } from './dto/add-to-feature-user-map.dto';
// import { UpdateFeatureDto } from './dto/update-access-control.dto';
import { CatalogQueryDto } from './dto/catalog-query.dto';

// import { AddToFeatureCatalogDto } from './dto/add-to-feature-catalog.dto';
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { AccessControlService } from './access-control.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FeatureGuard } from 'src/auth/feature.guard';
// import { AddFeatureDto } from './dto/add-feature.dto';
// import { AddToFeatureRoleMapDto } from './dto/add-to-feature-role-map.dto';

@ApiTags("AccessControl")
@Controller('admin/access-control')
@UseGuards(AuthGuard, FeatureGuard)
@ApiBearerAuth()
export class AccessControlAdminController {
  constructor(private readonly accessControlService: AccessControlService) {}

  
  // @Post('features')
  // createFeature(@Body() addFeatureDto: AddFeatureDto) {
  //   return this.accessControlService.addFeature(addFeatureDto);
  // }

  @Get('features')
  findAllFeatures() {
    return this.accessControlService.findAllFeatures();
  }

  @Get('features/users/:userId')
  findAllFeaturesByUserId(@Param('userId') userId: number) {
    return this.accessControlService.findAllFeaturesByUserId(userId);
  }

  @Patch('feature-user-map')
  upsertToFeatureUserMap(@Body() updateFeatureUserMapDto: UpdateFeatureUserMapDto) {
    return this.accessControlService.updateToFeatureUserMap(updateFeatureUserMapDto);
  }
  // @Post('catalog')
  // addFeatureToCatalog(@Body() addToFeatureCatalogDto: AddToFeatureCatalogDto) {
  //   return this.accessControlService.addFeatureToCatalog(addToFeatureCatalogDto);
  // }

  // @Post('feature-role-map')
  // addToFeatureRoleMap(@Body() addToFeatureRoleMapDto: AddToFeatureRoleMapDto) {
  //   return this.accessControlService.addToFeatureRoleMap(addToFeatureRoleMapDto);
  // }

  // @Post('feature-user-map')
  // addToFeatureUserMap(@Body() addToFeatureUserMapDto: AddToFeatureUserMapDto) {
  //   return this.accessControlService.addToFeatureUserMap(addToFeatureUserMapDto);
  // }



  // @Get('catalog')
  // findCatalogByRole(@Query() query: CatalogQueryDto) {
  //   return this.accessControlService.findCatalogByRole(query.role);
  // }

  // @Get('feature-ids/:userId')
  // findFeatureIdsOfAUser(@Param('userId') userId: number) {
    
  //   return "Todo: to implement"
  // }
 
  // @Patch('features/:id')
  // updateFeature(@Param('id') id: string, @Body() updateFeatureDto: UpdateFeatureDto) {
  //   return this.accessControlService.updateFeature(+id, updateFeatureDto);
  // }

  // @Delete('feature-user-map/:featureId/:userId')
  // removeFeatureUserMap(@Param('userId') userId: number, @Param('featureId') featureId: number,) {
  //   return this.accessControlService.removeFeatureUserMap(userId, featureId);
  // }
}
