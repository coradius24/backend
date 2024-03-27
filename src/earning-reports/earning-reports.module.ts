import { UsersModule } from 'src/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { EarningReportsService } from './earning-reports.service';
import { EarningReportsController } from './earning-reports.controller';
import { Payout } from './entities/payout.entity';
import { EarningReportsAdminController } from './earning-reports.admin.controller';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([Payout])],
  controllers: [EarningReportsController, EarningReportsAdminController],
  providers: [EarningReportsService],
  exports: [EarningReportsService, TypeOrmModule.forFeature([Payout])]
})

export class EarningReportsModule {}
