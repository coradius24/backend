import { ConfigService } from '@nestjs/config';
import { PasswordSetDTO } from './dto/password-set.dto';
import { VerifyTokenDTO } from './dto/verify-token-dto';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Request, Response, UseGuards } from '@nestjs/common';
import {  ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ForgetPasswordDTO } from './dto/forget-password.dto';
import { PasswordResetDTO } from './dto/password-reset.dto';
import SignInResponseDTO from './dto/signin-response.dto';
import { SignInDto } from './dto/signin.dto';
import { SignUpDto } from './dto/signup.dto';
import { AuthGuard } from './auth.guard';
import { OAuthLoginDTO } from './dto/oauth-dto';
import { OptionalAuthGuard } from './optionalAuth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService
    ) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiResponse({
    status: 200,
    type: SignInResponseDTO,
  })
 async  signIn(@Body() signInDto: SignInDto, @Response() res) {
    const result =  await this.authService.signIn(signInDto.email, signInDto.password, signInDto.isAdministrativeRole);
    res.cookie('upspot_access_token', result.access_token, {
        httpOnly: false,
        secure: true, // Note: Set to 'true' for HTTPS connections
        sameSite: 'None', // Explicitly set the SameSite attribute
        domain: this.configService.get('COOKIE_DOMAIN'),
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }).json(result);

  }

  @HttpCode(HttpStatus.OK)
  @Post('signup')
  @ApiResponse({
    status: 200,
    type: SignInResponseDTO,
  })
  async signUp(@Body() signUpDto: SignUpDto, @Response() res) {
    const result = await this.authService.signUp(signUpDto);
    res.cookie('upspot_access_token', result.access_token, {
      httpOnly: false,
      secure: true, 
      sameSite: 'None',
      domain: this.configService.get('COOKIE_DOMAIN'),
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }).json(result);
  }

  @HttpCode(HttpStatus.OK)
  @Get('verify-email/:token')
  verifyEmail(@Param('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  requestPasswordReset(@Body() body: ForgetPasswordDTO) {
    return this.authService.requestPasswordReset(body.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('set-password')
  setPassword(@Body() body: PasswordSetDTO) {
    return this.authService.setPassword(body.token, body.password);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  resetPassword(@Body() body: PasswordResetDTO) {
    return this.authService.resetPassword(body.reset_token, body.password);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-token')
  verifyToken(@Body() body: VerifyTokenDTO) {
    return this.authService.verifyToken(body.token, body.token_type);
  }

  @HttpCode(HttpStatus.OK)
  @Post('oauth')
  oAuthLogin(@Body() body: OAuthLoginDTO) {
    return this.authService.oAuthLogin(body.token, body.provider);
  }


  @UseGuards(OptionalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('logout')
  logout(@Response() res) {
    try {
      res.cookie('upspot_access_token', '', {
        httpOnly: false,
          secure: true, // Note: Set to 'true' for HTTPS connections
          sameSite: 'None', // Explicitly set the SameSite attribute
          domain: this.configService.get('COOKIE_DOMAIN'),
          expires: 0
      }).json({
        success: true
      });
    } catch (error) {
      return {
        success: true
      }
    }
   
  }
  
}
