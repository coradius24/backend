import { OAuthProvider } from './enums/auth.enums';
import { plainToClass } from 'class-transformer';
import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SignUpDto } from './dto/signup.dto';
import { MailService } from 'src/mail/mail.service';
import UserProfileDTO from 'src/users/dto/user-profile-dto';
import { JWTPayloadDTO } from './dto/jwt-payload.dto';
import { HttpService } from '@nestjs/axios';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FilesService } from 'src/files/files.service';
import { USER_STATUS } from 'src/users/enums/user.enums';
import { MailQueueService } from 'src/mail/mail-queue.service';
import { SmsService } from 'src/sms/sms.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Page } from 'src/cms/entities/page.entity';
import { Repository } from 'typeorm';
export type TokenType = 'login' | 'signUp' | 'passwordReset' | 'passwordSet'
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService,
    private readonly httpService: HttpService,
    private readonly filesService: FilesService,
    private mailService: MailService, // Inject the MailService
    private smsService: SmsService, // Inject the MailService
    private mailQueueService: MailQueueService, 
    private eventEmitter: EventEmitter2,
    @InjectRepository(Page) private pageRepository: Repository<Page>
  ) {
    
    eventEmitter.on('user.invitationSent', async (payload) => {
      this.sendSetPasswordToken(payload.email)
    })
  }

  async signIn(email: string, pass: string, isAdministrativeRole: boolean): Promise<any> {
    try {
      const result = await this.usersService.matchUserPassword(email, pass, isAdministrativeRole);
      if(result?.status === USER_STATUS.disabled) {
        return new ForbiddenException('আপনার অ্যাকাউন্ট ডিজেবল করা হয়েছে, সহায়তার জন্য সাপোর্টে যোগাযোগ করুন!', 'accountDisabled')
      }
      const access_token = await this.signJWT(result, 'login');
      return {
        access_token,
        user: plainToClass(UserProfileDTO, result) ,
      };
    } catch (error) {
      throw new UnauthorizedException();

    }
    
  }

  async signUp(signUpDto: SignUpDto & {
    federated?: {
      facebook?: string,
      google?: string,
      picture? : string
    },
    photo?: any
  }) {
    const payload: any = {...signUpDto}

    if(payload?.federated) {
      payload.status = 1
     
     }
     if(payload?.photo) {
      payload.photoId = payload?.photo?.id;
     }

     const user = await this.usersService.createUser(payload);
     const token = await this.signJWT(user, 'signUp')
     if(!payload.federated) {
      await this.mailService.sendUserConfirmation(user, token);
      if(user.mobileNumber && user.email) {
        const settings = await this.pageRepository.findOneBy({
          id: 'settings'
        })
        if(settings?.content?.sendWelcomeSms) {
          await this.smsService.sendWelcomeSms(user.mobileNumber, user.email)
        }

      }

     }

     const access_token = await this.signJWT(user, 'login');
      return {
        access_token,
        user: plainToClass(UserProfileDTO, user) ,
      };
  }

  async verifyEmail(token: string) {
    const payload: JWTPayloadDTO = await this.jwtService.verify(token);
    if(payload && payload.token_type == 'signUp' ) {
      await this.usersService.updateUser(payload.sub, {status:1})
      return {success: true}
    }  

    throw new BadRequestException('Invalid token!')
    
  }

  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);

    if(!user) {
      throw new NotFoundException('No user with this email!')
    }
    if(user?.status === USER_STATUS.disabled) {
      return new ForbiddenException('আপনার অ্যাকাউন্ট ডিজেবল করা হয়েছে, সহায়তার জন্য সাপোর্টে যোগাযোগ করুন!', 'accountDisabled')
    }
    const token = await this.signJWT(user, 'passwordReset')
    await this.mailService.sendResetPasswordMail(user, token);

    return {
      success: true
    }
  }

  async resetPassword(token: string, password: string) {
    const payload: JWTPayloadDTO = await this.jwtService.verify(token);
    if(payload?.token_type !== 'passwordReset' )  {
      throw new BadRequestException('Invalid token!')
    }
    return await this.usersService.setPassword(payload.sub ,password)
  }

  async setPassword(token: string, password: string) {
    const payload: JWTPayloadDTO = await this.jwtService.verify(token);
    if(payload?.token_type !== 'passwordSet' )  {
      throw new BadRequestException('Invalid token!')
    }
    return await this.usersService.setPassword(payload.sub ,password)
  }

  private async sendSetPasswordToken(email) {
    const user = await this.usersService.findByEmail(email);

    if(!user) {
      throw new NotFoundException('No user with this email!')
    }

    const token = await this.signJWT(user, 'passwordSet')
    await this.mailQueueService.enqueueUserInvitationMail(user, token);

    return {
      success: true
    }

  }

  private async signJWT(user, token_type: TokenType): Promise<string> { 
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      token_type,
    };
    return await this.jwtService.signAsync(payload);
  }

  async verifyToken(token: string, token_type: TokenType) { 
    const payload: JWTPayloadDTO = await this.jwtService.verify(token);
    if(token_type === payload.token_type) {
      return payload
    }
    throw new BadRequestException('Invalid Token')
  }

  async oAuthLogin(token: string, provider: OAuthProvider) { 
    const body : any= {
      federated: {}
    };
    
    if(provider === 'facebook') {
      try {
        const token_res = await this.httpService.axiosRef.get(`https://graph.facebook.com/USER-ID?fields=id,name,email,picture&access_token=${token}`)
        const data = token_res?.data;
        if(data?.error) {
          throw new UnauthorizedException()
        }

        body.federated[provider] = data.id
        body.fullName = data.name;
        body.email =  data.email;

        if(data.picture) {
          body.federated.picture = data?.picture?.data?.url
        }
      } catch (error) {
        throw new UnauthorizedException()
      }
      

    }else if(provider === 'google') {
      const token_res = await this.httpService.axiosRef.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`)
      const data = token_res?.data;

      if(data?.error) {
        throw new UnauthorizedException()
      }
      body.federated[provider] = data.aud
      body.fullName = data.given_name + ' ' + data.family_name;
      body.email =  data.email;

      if(data.picture) {
        body.federated.picture = data.picture
      }
    }else {
      throw new UnauthorizedException()
    }
    const result = await this.usersService.findByEmail(body?.email);
    if(body?.federated?.picture && !result?.photo) {
        const picture_res = await this.httpService.axiosRef.get(body?.federated?.picture, {
          responseType: 'arraybuffer'

        })
        const pictureData = Buffer.from(picture_res?.data);
        const photo = await this.filesService.uploadPublicFile(pictureData, 'profile-pic.png', {}, {
          ContentType: 'image/jpeg'
        })
        body.photo = photo;

    }
    if(!result) {
     return await this.signUp(body)
    }

    if(!result?.federated?.[provider]) {
      const updatePayload: any = {
        federated: {
          ...(result?.federated||{}),
          ...body?.federated
        }
      }
      if(body?.photo && !result?.photo) {
        updatePayload.photo = body.photo
      }
      await this.usersService.updateUser(result.id, updatePayload)
    }

    const access_token = await this.signJWT(result, 'login');
    return {
      access_token,
      user: plainToClass(UserProfileDTO, result) ,
    };

    
  }
}
