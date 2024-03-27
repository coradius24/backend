import { FeaturedInstructor } from './entities/featured-instructors.entity';
import { Module } from '@nestjs/common';
import { CmsService } from './cms.service';
import { CmsController } from './cms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CmsAdminController } from './cms.admin.controller';
import { Page } from './entities/page.entity';
import { TeamMember } from './entities/team-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FeaturedInstructor, Page, TeamMember])],
  controllers: [CmsController, CmsAdminController],
  providers: [CmsService],
})
export class CmsModule {}
