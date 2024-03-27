import { EnrollmentsService } from 'src/enrollments/enrollments.service';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Support } from './entities/support.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SupportsService {
  private logger = new Logger(SupportsService.name)
  constructor(
    @InjectRepository(Support) private supportRepository : Repository<Support>,
    @InjectRepository(User) private userRepository : Repository<User>,
    private enrollmentsService: EnrollmentsService
  ) {}

  async getSupportBoard(userId) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId
      },
    })

    const supportBoard = await this.supportRepository.findOne({
      where: {
        email: user.email
      },
      order: {
        createdAt: 'DESC'
      }
    })

    if(!supportBoard) {
      const eligibleBoard = await this.enrollmentsService.getSupportBoardOfUser(userId)
      const {supportBoard, batchTitle} = (eligibleBoard as any) || {};

      if(!supportBoard) {
        return new NotFoundException('No support board found for you')
      }

      await this.chatSignup({
          user, 
          batchTitle, 
          supportBoard
      })
      if(supportBoard) {
        await this.supportRepository.insert({
          email: user.email,
          userId,
          supportBoard
        })
        return eligibleBoard
      }
    }
    return supportBoard
  }

  async chatSignup({
    user,
    batchTitle,
    supportBoard
  }) {

    const email = user.email
    const firstName = user.fullName
    const phoneNumber = user.mobileNumber
    const profileImage = user.photo?.url

    const saltOrRounds = 10;
    const passwordHash = await bcrypt.hash(email, saltOrRounds);
    const body: any = {
      email,
      password: passwordHash,
      first_name: firstName,
      last_name: ' ',
      batch: batchTitle,
      phone_number: phoneNumber,
      // profile_image: profileImage
    }

    if (profileImage) {
      body.profile_image = profileImage
    }




    
    try {
      const res = await fetch(`https://upspot.org/${supportBoard}/api_for_upspot_academy.php`, {
      headers: {
        accept: "application/json, text/plain, */*",
        "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: new URLSearchParams(body),
      method: "post",
     })
      return res.json()

    } catch (error) {
      this.logger.error(`Chat Signup failed , userEmail: ${email} , supportBoard: ${supportBoard}`)
    }


  }
}
