import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { MailModule } from 'src/mail/mail.module';
import { Page } from 'src/cms/entities/page.entity';

@Module({
  imports: [
    MailModule,
    UsersModule,
    HttpModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '30d' },
    }),
    TypeOrmModule.forFeature([Page])
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
