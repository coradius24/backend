import { ToolsAdminController } from './tools.admin.controller';
import { Enrollment } from './../enrollments/entities/enrollment.entity';
import { ToolsAccess } from './entities/tools-accces.entity';
import { Module } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { ToolsController } from './tools.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tools } from './entities/tool.entity';
import { FilesModule } from 'src/files/files.module';
import { Payment } from 'src/payments/entities/payment.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [FilesModule, TypeOrmModule.forFeature([Tools, ToolsAccess, Enrollment, Payment, User])],
  controllers: [ToolsController, ToolsAdminController],
  providers: [ToolsService],
  exports: [ToolsService]
})
export class ToolsModule {}
