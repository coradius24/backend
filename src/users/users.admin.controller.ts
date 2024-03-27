import { FeatureGuard } from 'src/auth/feature.guard';
import { MailService } from 'src/mail/mail.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AdminFilterDto } from './dto/admin-filter.dto';
import { ROLE } from 'src/users/enums/user.enums';
import { StudentFilterDto } from './dto/student-filter.dto';
import { SelectedUsersQueryDto } from './dto/selected-users.query.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Body, Controller, Get, Param, Post, Query, Req, UseGuards, ForbiddenException, Patch } from '@nestjs/common';
import { ApiBearerAuth,  ApiBody,  ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PasswordSetByAdminDto } from './dto/password-set-by-admin.dto'
import { ConfigService } from '@nestjs/config';
@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard, FeatureGuard)
@Controller('admin/users')
export class UsersAdminController {
  constructor(private readonly userService: UsersService, private eventEmitter: EventEmitter2,    
    private mailService: MailService,
    private configService: ConfigService
     // Inject the MailService
  ) { }

  @Post('')
  async addUser( @Req() req, @Body() createUserDto: CreateUserDto) {
    if(req.user?.role != ROLE.superAdmin && (createUserDto.role == ROLE.superAdmin  || createUserDto.role ===  ROLE.admin || createUserDto.role === req.user?.role)) {
      throw new ForbiddenException()
    }

    const user = await this.userService.createUser({...createUserDto, password: createUserDto?.password || null})
    if(user.email && !createUserDto?.password) {
      this.eventEmitter.emit('user.invitationSent', {email: user.email})
    }else if(user.email && createUserDto?.password) {
      const clientDomain = this.configService.get('CLIENT_DOMAIN') ;
      this.mailService.sendUserInvitationWithPassword(user,
        createUserDto.role == ROLE.student ? `${clientDomain}/login` : `${clientDomain}/admin`, 
       createUserDto?.password

      )
    }
    return user;
  }

  @Get('by-user-id/:id')
  async Get(@Param('id') id: number) {
    return this.userService.findOne(id);
  }

  @Patch('by-user-id/:id')
  async updateUser(@Param('id') id: number, @Req() req, @Body() payload: UpdateUserDto) {
   
    return this.userService.updateUserByAdmin(req.user, id, payload);
  }

  @Post('resend-set-password-link/:email')
  async resendSetPasswordLink(@Param('email') email: string) {
    if(email) {
      this.eventEmitter.emit('user.invitationSent', {email})
    }
    return {
      success: true
    };
  }


  @Get('/students')
  async getStudents(@Query() paginationDto: PaginationDto, @Query() studentFilterDto: StudentFilterDto) {
    return this.userService.getUsers(paginationDto,{...studentFilterDto, role: ROLE.student } )
  }

  @Get('/admins')
  async getAdmins(@Query() paginationDto: PaginationDto, @Query() filterDto: AdminFilterDto) {
    return this.userService.getUsers(paginationDto, filterDto)
  }

  @Get('/instructors')
  async getInstructors(@Query() paginationDto: PaginationDto, @Query() filterDto: AdminFilterDto) {
    return this.userService.getInstructors(paginationDto, {...filterDto, role: ROLE.instructor})
  }

  @Get('/search/:searchTerm')
  async getUserProfile(@Param('searchTerm') searchTerm: string, @Query() paginationDto: PaginationDto) {
    return this.userService.searchUsersByNameOrEmailOrId(searchTerm, paginationDto)
  }

  @Get('/selected')
  async getSelectedUsers(@Query() selectedUsersQueryDto: SelectedUsersQueryDto) {
    return this.userService.getSelectedUsers(selectedUsersQueryDto.ids)
  }

  @Get(':userId/kyc-documents')
  getKycDocumentsOfAUser(@Param('userId') userId: number) {
    return this.userService.getKycDocumentsOfAUser(userId)
  }

  @Patch(':userId/password/') 
  changeUserPassword(@Param('userId') userId: number, @Body() payload: PasswordSetByAdminDto) {
     return this.userService.setPassword(userId, payload.password)
  }


  
}
