import { Body, Controller, Get, Param, Patch, Post, Put, Req, Request, Response, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';
import { AuthGuard } from 'src/auth/auth.guard';
import { changePasswordDto } from './dto/change-password.dto';
import { KycDocumentDto } from './dto/kyc.dto';
import { ProfilePhotoDto } from './dto/profile-photo.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import UserProfileDTO from './dto/user-profile-dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private configService: ConfigService ) { }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, type: UserProfileDTO })
  @Get('/profile')
  async getUserProfile(@Request() req: any, @Response() res) {
    const user = await this.userService.findByEmail(req.user.email)
    const requestedBearerToken = req.headers.authorization?.split('Bearer')?.[1]
    if (requestedBearerToken) {
      res.cookie('upspot_access_token', requestedBearerToken?.trim(), {
        httpOnly: false,
        secure: true,
        sameSite: 'None',
        domain: this.configService.get('COOKIE_DOMAIN'),
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }).json(plainToClass(UserProfileDTO, user));
    }else{
      res.json(plainToClass(UserProfileDTO, user))
    }
 
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, type: UserProfileDTO })

  @Patch('/profile')
  async updateUserProfile(@Request() req: any, @Body() modelData: UpdateProfileDto) {
    const user = await this.userService.updateUserProfile(req.user.sub, modelData as any)
    return plainToClass(UserProfileDTO, user);
  }

  @Put('photo')
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, cb) => {
        // Check if the file's MIME type is an image
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 1024 * 1024,
      },
    }),
  )
  @UseGuards(AuthGuard)
  @ApiBody({
    description: 'Profile photo upload',
    type: ProfilePhotoDto,
  })
  async addProfilePicture(@Req() request: any, @UploadedFile() file) {
    return this.userService.addProfilePhoto(request.user.sub, file.buffer, file.originalname);
  }


  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('/change-password')
  changePassword(@Request() req: any, @Body() body: changePasswordDto) {
    return this.userService.changePassword(req.user.email, body.currentPassword, body.newPassword)
  }

  @ApiResponse({ status: 200, type: UserProfileDTO })
  @Get('/instructor/:id')
  async findInstructorById(@Param('id') id: number) {
    const user = await this.userService.findInstructorById(id)
    return plainToClass(UserProfileDTO, user);
  }

  @Get('/instructors')
  async findInstructors() {
    return this.userService.findAllInstructors()
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('kyc-document')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'frontPhoto', maxCount: 1 }, 
    { name: 'backPhoto', maxCount: 1 },
  ]))

  create(@Req() req, @Body() kycDto: KycDocumentDto, @UploadedFiles() documents) {
    const frontPhoto = documents.frontPhoto
    ? { buffer: documents.frontPhoto[0].buffer, originalname: documents.frontPhoto[0].originalname }
    : null;

  const backPhoto = documents.backPhoto
    ? { buffer: documents.backPhoto[0].buffer, originalname: documents.backPhoto[0].originalname }
    
    : null;

    return this.userService.uploadKycDocument(req.user.sub, kycDto, {
      frontPhoto,
      backPhoto
    })
  }

  
  
}
