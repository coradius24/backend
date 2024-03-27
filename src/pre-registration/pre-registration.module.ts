import { User } from 'src/users/entities/user.entity';
import { PreRegistration } from './entities/pre-registration.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { PreRegistrationService } from './pre-registration.service';
import { PreRegistrationController } from './pre-registration.controller';
import { PreRegistrationAdminController } from './pre-registration.admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PreRegistration, User])],
  controllers: [PreRegistrationController, PreRegistrationAdminController],
  providers: [PreRegistrationService],
})
export class PreRegistrationModule {}
