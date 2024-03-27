import { FeatureUserMap } from './entities/feature-user-map.entity';
import { FeatureRoleMap } from './entities/feature-role-map.entity';
import { FeatureCatalog } from './entities/feature-catalog.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Global, Module } from '@nestjs/common';
import { AccessControlService } from './access-control.service';
import { AccessControlController } from './access-control.controller';
import { Feature } from './entities/feature.entity';
import { AccessControlAdminController } from './access-control.admin.controller';
import { User } from 'src/users/entities/user.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([FeatureCatalog, FeatureRoleMap, FeatureUserMap, Feature,User])],
  controllers: [AccessControlController, AccessControlAdminController],
  providers: [AccessControlService],
  exports: [TypeOrmModule.forFeature([FeatureCatalog, FeatureRoleMap, FeatureUserMap, Feature]), AccessControlService]
})
export class AccessControlModule {}
