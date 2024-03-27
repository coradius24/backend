import { EnrollmentsModule } from './../enrollments/enrollments.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { SupportsService } from './supports.service';
import { SupportsController } from './supports.controller';
import { Support } from './entities/support.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Support, User]),
    EnrollmentsModule
  ],
  controllers: [SupportsController],
  providers: [SupportsService],
})
export class SupportsModule { }
