import { User } from 'src/users/entities/user.entity';
import { EnrollmentsService } from 'src/enrollments/enrollments.service';
import { PreRegistration } from './entities/pre-registration.entity';
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePreRegistrationDto, transformPhone } from './dto/create-pre-registration.dto';
import { Between, Repository, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { AsyncParser } from '@json2csv/node';
import * as moment from 'moment';

@Injectable()
export class PreRegistrationService {
  constructor(
    @InjectRepository(PreRegistration) private preRegistrationRepository: Repository<PreRegistration>,
    @InjectRepository(User) private userRepository: Repository<User>,
     private enrollmentService: EnrollmentsService) {

  }
  async create(createPreRegistrationDto: CreatePreRegistrationDto, userId) {

    const eligibility = await this.checkEligibility(userId, createPreRegistrationDto)


    if(eligibility.alreadyRegistered) {
      throw new BadRequestException('You are already registered for free class')
    }
    if(eligibility.alreadyEnrolled) {
      throw new BadRequestException('You are already enrolled')
    }
    

    return this.preRegistrationRepository.insert({...createPreRegistrationDto, mobileNumber: transformPhone(createPreRegistrationDto.mobileNumber)})
  }

 
  async checkEligibility(userId, createPreRegistrationDto) {

    let email = createPreRegistrationDto.email;
    let mobileNumber = createPreRegistrationDto.mobileNumber;
    
    if(userId) {
      const user = await this.userRepository.findOne({
        where: {
          id: userId
        }
      })

      email = email;
      if(user.mobileNumber) {
        mobileNumber = user.mobileNumber
      }
    }

    const query: any[] = [   

    ]
    if(email) {
      query.push({email})
    }
    
    if(mobileNumber) {
      query.push({mobileNumber: transformPhone(mobileNumber)})
    }
    if(userId) {
      query.push({userId})
    }
    
    let alreadyRegistered = false;
    if(query.length) {
      const registered = await this.preRegistrationRepository.findOne({
        where: query,
        select: ['id'],
      })
        
      alreadyRegistered = !!registered
    }

    let alreadyEnrolled: any[] = []
    if(userId) {
      alreadyEnrolled = await this.enrollmentService.getEnrolledCoursesOfAUser(userId)
    }

    return  {
      eligible: !alreadyRegistered && !alreadyEnrolled?.length,
      alreadyRegistered: alreadyRegistered,
      alreadyEnrolled: !!alreadyEnrolled?.length
    }
  }

  markAsArchive({ids, isArchived}) {
    return this.preRegistrationRepository.update({
      id: In(ids)
    }, {
      isArchived
    })

  }

  archiveAll() {
    return this.preRegistrationRepository
      .createQueryBuilder()
      .update('preRegistrations')
      .set({ isArchived: true })
      .execute();

  }

  async findAll({isArchived, startDate: _startDate, endDate: _endDate}, {paginated, limit=10, page=1}) {
    const query:any = {
      isArchived: false
    };
    if(isArchived == 'true') {
      query.isArchived = true
    }
    if(_startDate && _endDate) {
      const startDate = moment(_startDate).startOf('day').toDate()
      const endDate =  moment(_endDate).endOf('day').toDate()
      query.createdAt = Between(startDate, endDate)
    }else if(_startDate) {
      const startDate = moment(_startDate).startOf('day').toDate()
      query.createdAt = MoreThanOrEqual(startDate)
    }else if(_endDate) {
      const endDate =  moment(_endDate).endOf('day').toDate()
      query.createdAt = LessThanOrEqual(endDate)

    }
    if(paginated){
      const [results, totalCount] = await this.preRegistrationRepository.findAndCount({
        where: query,
        select: ['id', 'fullName', 'email', 'mobileNumber', 'userId', 'comment', 'createdAt' ],
        take: limit,
        skip: (page-1)*limit
       }
      )
      return  {
        results,
        limit,
        page,
        totalCount

      }
    }
    return this.preRegistrationRepository.find({
      where: query,
      select: ['id', 'fullName', 'mobileNumber', 'userId', 'comment' ]
    })
  }

  async downloadCsv({isArchived, startDate, endDate}) {
    const data: any = await this.findAll({isArchived, startDate, endDate}, {paginated: false})
    const opts = {
      fields: [
       
        {
          label: 'Name',
          value: 'fullName'
        },
        {
          label: 'Mobile Number',
          value: 'mobileNumber'
        },
        // {
        //   label: 'Email',
        //   value: 'email'
        // },

      ]
    };
    const transformOpts = {};
    const asyncOpts = {};
    const parser = new AsyncParser(opts, asyncOpts, transformOpts);
    const csv = await parser.parse(data?.map(d=>({...d, mobileNumber: '+88'+d.mobileNumber}))).promise();
    return csv

  }

}
