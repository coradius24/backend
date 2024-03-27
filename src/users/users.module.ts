import { FilesModule } from 'src/files/files.module';
import { Profile } from 'src/users/entities/profile.entity';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Course } from 'src/courses/entities/course.entity';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { KycDocument } from './entities/kyc-document.entity';
import { UsersAdminController } from './users.admin.controller';

@Module({
  imports: [FilesModule, TypeOrmModule.forFeature([User, Profile, Course, Enrollment, KycDocument])],
  controllers: [UsersController, UsersAdminController],
  providers: [UsersService],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
