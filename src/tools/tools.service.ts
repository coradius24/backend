import { User } from './../users/entities/user.entity';
import { Payment } from 'src/payments/entities/payment.entity';
import { NotificationGateway } from './../notification/notification.gateway';
import { NotificationReceiver } from './../notification/enums/notification.enums';
import { Enrollment } from './../enrollments/entities/enrollment.entity';
import { GiveToolsAccessDto } from './dto/give-tools-access.dto';
import { ToolsAccess } from './entities/tools-accces.entity';
import { FilesService } from 'src/files/files.service';
import {  Any, In, Like, Repository } from 'typeorm';
import { BadRequestException, ForbiddenException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { Tools } from './entities/tool.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PaymentStatus } from 'src/payments/enums/payments.enum';
import * as bcrypt from 'bcrypt';
import { removeSpecialCharacters } from 'src/common/utils/utils';

@Injectable()
export class ToolsService {
  private readonly logger = new Logger(ToolsService.name);

    constructor(@InjectRepository(Tools) private toolsRepository : Repository<Tools>, private filesService: FilesService,
    @InjectRepository(ToolsAccess) private toolsAccessRepository : Repository<ToolsAccess>, 
    @InjectRepository(Enrollment) private enrollmentRepository : Repository<Enrollment>, 
    @InjectRepository(Payment) private paymentRepository : Repository<Payment>, 
    @InjectRepository(User) private userRepository : Repository<User>, 
    private notificationGateway: NotificationGateway,
    private eventEmitter: EventEmitter2
  ){

    }

  async create(createToolDto: CreateToolDto) {
    // const {payload } = createToolDto;
  
    // if (payload.thumbnailId) {
    //   try {
    //     // Fetch the thumbnail file entity
    //     const thumbnail = await this.filesService.getFileById(+thumbnailId);
  
    //     // Assign the thumbnail entity to the payload
    //     (payload as any).thumbnail = thumbnail;
    //   } catch (error) {
    //     // Handle errors if necessary
    //   }
    // }
  
    const newTool = await this.toolsRepository.insert(createToolDto);
    return newTool;
  }
  
  async giveToolAccess(payload: GiveToolsAccessDto, givenAccessBy: number ) {
    const tool = await this.findOne(payload.toolId)
    // const newToolAccess = this.toolsAccessRepository.create({
    //   ...payload,
    //   user: {id: payload?.userId},
    //   isSystemGiven: !givenAccessBy,
    //   givenByUser: givenAccessBy
    // })
    const alreadyHaveAccess = await this.toolsAccessRepository.findOneBy({
      userId: payload.userId,
      toolId: payload.toolId,
    })
    
    if(alreadyHaveAccess) {
      throw new BadRequestException('Already have access')
    }
      const user = await this.userRepository.findOneBy({id: payload.userId})
      if(!user) {
        throw new BadRequestException(`user not exist, userId : ${payload.userId}`)

      }
      // const newlySavedAccess = await this.toolsAccessRepository.save(newToolAccess)
     const newlySavedAccess= await this.toolsAccessRepository.insert({
        toolId: payload.toolId,
        user: user,
        createdAt: new Date(),
        isSystemGiven: !givenAccessBy,
        givenByUser: givenAccessBy,
      });
  
    
    this.eventEmitter.emit('tools.accessGiven', {
      userId: payload.userId,
      title: tool.name
    })
    return newlySavedAccess
    
    
  }

  async getAllToolAccess({limit=10, page=1}, {search, toolId}) {
      const skip = (page-1) * limit;
      
      const query: any = {

      }

      if(toolId) {
        query.toolId = toolId
      }

      if (search) { 
        query.user = {};
        if(Number(search) && !search?.startsWith('0')) {
          query.user.id = search
        }else {
          query.user = [
            { fullName: Like(`%${search}%`) },
            { email: Like(`%${search}%`) },
            { mobileNumber: Like(`%${search}%`) },
          ];
        }
        
      }

      const [results, totalCount] = await this.toolsAccessRepository.findAndCount({
        where: query,
        skip,
        take: limit,
        order: {
          id: 'DESC'
        }
      })

      return {
        results, 
        totalCount,
        limit,
        page
      }
  }

  async giveCourseAssociateTools(courseId: number, userId: number, givenByUserId?) {
    const tools = await this.findAll(courseId)
    const user = await this.userRepository.findOneBy({id: userId})
      if(!user) {
        throw new BadRequestException(`user not exist, userId : ${userId}`)

      }
    tools.forEach(async(tool) => {
      const alreadyHaveAccess = await this.toolsAccessRepository.findBy({
        userId: userId,
        toolId: tool.id,
      })
      
      const payload: any = {user: user, toolId: tool.id, isSystemGiven: true}
      if(givenByUserId) {
        payload.isSystemGiven = false
        payload.givenByUser = givenByUserId
      }

      if(!alreadyHaveAccess?.length) {
         await this.toolsAccessRepository.insert(payload)
        this.eventEmitter.emit('tools.accessGiven', {
          userId,
          title: tool.name
        })
        
      }
      return {
        success: true
      }
    })

  }

  async giveCourseAssociateToolsInBulk(courseId, toolId, givenByUserId) {
    const paidHistories = await this.paymentRepository.find({
      where: {
        courseId: courseId,
        paymentStage: PaymentStatus.COMPLETED,
        isFullPaid: true
      }
      
    })

    const bulkPromises = paidHistories?.map(paid => {
      return this.giveToolAccess({userId: paid.userId || paid?.user?.id, toolId}, givenByUserId)
    })

    return await Promise.allSettled(bulkPromises)
  }

  async findAllToolsByFilter({limit=10, page=1}) {
    const skip = (page-1)*limit;
    // if(courseId) {
    //   return this.toolsRepository.findBy({courseId})

    // }
    const query :any= {}
    const [results, totalCount] = await  this.toolsRepository.findAndCount({
       where: query,
       skip,
       take: limit,    
       order: {
        id: 'DESC'
       }
    })

    return {
      results, 
      totalCount,
      page, 
      limit
    }
  }
  async findAll(courseId?:number) {
    if(courseId) {
      const tools = await this.toolsRepository.find()
      const filteredTools= tools?.filter(tool => tool.courseId?.find((_courseId) => _courseId == courseId))
      return filteredTools

    }
    return await this.toolsRepository.find()
  }

  async getToolsOfAUser(id: number, includeFreeTools?: boolean, includeLocked?: boolean) {
    
    const accessList =  await this.toolsAccessRepository.findBy({
      userId: id
    })

    const toolsIdOfAccessGiven = accessList.map(d=> d.toolId)
    const enrolledCoursesOfAUser = await this.enrollmentRepository.findBy({
      userId: id
    })

    const enrolledCourseId = enrolledCoursesOfAUser.map(d=>d.courseId)
    const accessableTools =  await this.toolsRepository.find({
      where: [{
        id: In(toolsIdOfAccessGiven)
      }, includeFreeTools ? {isFree: true} : {}]
    })

   


    if(includeLocked) {
      const _availableTools =  await this.toolsRepository.find({
        // where: [{
        //   courseId: In(enrolledCourseId)
        // }]
      })
      
      const availableTools = []

      enrolledCourseId?.forEach((courseId) => {
        const availableToolsForTheCourse = _availableTools?.filter(tool => tool.courseId?.find((_courseId) => _courseId == courseId))

        availableToolsForTheCourse?.forEach(tool => {
          if(!availableTools?.includes(_tool => _tool.id == tool.id)) {
            availableTools.push(tool)
          }
        })
      })
      const accessableToolsMap = {

      }
      const allTools = []

      accessableTools.forEach(tool => {
        accessableToolsMap[tool.id] = tool;
        allTools.push({...tool, accessRestricted: false})
      })
      availableTools.forEach((tool) => {
        if(!accessableToolsMap[tool.id]) {
          allTools.push({id: tool.id, name: tool.name, type: tool.type,  thumbnail: tool.thumbnail, accessRestricted: true})
        }
        
      })

      return allTools
    }
    return accessableTools;
  }

  async getToolsOfAUserByCourseId(userId: number, courseId, includeFreeTools?: boolean, includeLocked?: boolean, ) {
    
    const accessList =  await this.toolsAccessRepository.findBy({
      userId,
    })

    const toolsIdOfAccessGiven = accessList.map(d=> d.toolId)

    
    const _accessableTools =  await this.toolsRepository.find({
      where: [{
        id: In(toolsIdOfAccessGiven),
        // courseId
      }, includeFreeTools ? {isFree: true} : {}]
    })
    const accessableTools = _accessableTools?.filter(tool=>tool.courseId?.find((_courseId) => _courseId == courseId))


  

    if(includeLocked) {
      // todo: need to implement where query
      const _availableTools =  await this.toolsRepository.find({
        // where: [{
        //   courseId: Any(Numb(courseId))
        // }]
      })
      const availableTools = _availableTools?.filter(tool => tool.courseId?.find((_courseId) => _courseId == courseId))

      const accessableToolsMap = {

      }
      const allTools = []

      accessableTools.forEach(tool => {
        accessableToolsMap[tool.id] = tool;
        allTools.push({...tool, accessRestricted: false})
      })
      availableTools.forEach((tool) => {
        if(!accessableToolsMap[tool.id]) {
          allTools.push({id: tool.id, name: tool.name, thumbnail: tool.thumbnail, accessRestricted: true})
        }
        
      })

      return allTools
    }

    return accessableTools;
  }

  findOne(id: number) {
    return  this.toolsRepository.findOneBy({id})
  }

  async update(id: number, updateToolDto: UpdateToolDto) {
     const { thumbnailId, ...payload } = updateToolDto;
  
    if (thumbnailId) {
      try {
        const thumbnail = await this.filesService.getFileById(+thumbnailId);
        (payload as any).thumbnail = thumbnail;
      } catch (error) {
        
      }
    }
  
    const tool = await this.toolsRepository.findOneBy({id});
    Object.assign(tool, payload)
    return await this.toolsRepository.save(tool);
  }

  async remove(id: number) {
    return await this.toolsRepository.delete({
      id
    });
  }

  async removeAccess(toolId, userId) {
    return await this.toolsAccessRepository.delete({
      toolId,
      userId  
    });
  }

  @OnEvent('tools.accessGiven')
  async handleCourseAccessGiven(payload: any) {
    return this.notificationGateway.sendInstantNotification({
      receiverType: NotificationReceiver.INDIVIDUAL_USERS,
      receivers: [payload.userId],
      message: `অভিনন্দন, আপনাকে পেইড টুলস "${payload?.title}" এ এক্সেস প্রদান করা হয়েছে `
    })
  }

  async loginToUply(userId) {
    const tools = await this.getToolsOfAUser(userId, true)
    const uplyAccess = tools.find(tool => tool?.link?.includes('uply'))
    if(uplyAccess) {
      const user = await this.userRepository.findOneBy({id: userId})
      try {
        await this.uplySignup(user)
      } catch (error) {
        this.logger.error("Uply access error", error)
      }
      return {
        email: user.email,
        userId: user.id
      }
    }
    return new ForbiddenException('No acccess uply ')
  }

  async loginToGetYourTools(userId) {
    const tools = await this.getToolsOfAUser(userId, true)
    const theToolAccess = tools.find(tool => tool?.link?.includes('getyourtools'))
    if(theToolAccess) {
      const user = await this.userRepository.findOneBy({id: userId})
      try {
        await this.getYourToolsSignup(user)
      } catch (error) {
        this.logger.error("getyourtools.app access error", error)
      }
      return {
        email: user.email,
        userId: user.id,
        hashCode: this.hashCode(user.email)
      }
    }
    return new ForbiddenException('No acccess getyourtools.app ')
  }

  async uplySignup(user) {
    const email = user.email
    const firstName = user.fullName
    // const phoneNumber = user.mobileNumber
    const profileImage = user.photo?.url

    const saltOrRounds = 10;
    const passwordHash = await bcrypt.hash(email, saltOrRounds);
    const body: any = {
      email,
      password: passwordHash,
      first_name: removeSpecialCharacters(firstName) ,
      last_name: ' ',
      // profile_image: profileImage
    }

    if (profileImage) {
      body.profile_image = profileImage
    }




    const res = await fetch(`https://uply.pro/api-for-upspot-academy.php`, {
      headers: {
        accept: "application/json, text/plain, */*",
        "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: new URLSearchParams(body),
      method: "post",
    })
    return res.json()

    // const res: any = await this.httpService.axiosRef.post(`https://upspot.org/${supportBoard}/include/ajax.php`, formData, {
    //   headers: {"Content-Type": "application/x-www-form-urlencoded"}
    // })

    // console.log("res", res)
    // return res?.data

  }
  hashCode(str) {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        const chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return 'uV'+hash+'@';
  }

  async getYourToolsSignup(user) {
    const email = user.email
    const firstName = user.fullName
    // const phoneNumber = user.mobileNumber
    const profileImage = user.photo?.url

    const saltOrRounds = 10;
    const doubleHash = this.hashCode(email)
    const passwordHash = await bcrypt.hash(doubleHash, saltOrRounds);
    const body: any = {
      email,
      password: passwordHash,
      name: removeSpecialCharacters(firstName) ,
      auth_type: 'Email',
      email_verified_at	: new Date(),
      plan_activation_date: new Date(),
      plan_validity: new Date().setFullYear(new Date().getFullYear() + 10),
      plan_id: 3,
      term: 31,
      plan_details : {
        id: 3,
        is_private: 0,
        plan_id: null,
        name: "Platinum",
        description: "Access Exclusive AI Content Creation Tools and Features with our Platinum Plan.",
        price: 99,
        validity: 31,
        template_counts: 33,
        templates:  {"blog_outline":1,"blog_headline":1,"blog_description":1,"blog_story_ideas":1,"article_content":1,"paragraph":1,"summarization":1,"product_name":1,"product_description":1,"startup_name":1,"service_review":1,"youtube_video_titles":1,"youtube_video_tags":1,"youtube_video_outline":1,"youtube_video_intro":1,"youtube_video_ideas":1,"youtube_short_script":1,"write_for_me":1,"website_meta_description":1,"website_meta_keywords":1,"website_meta_title":1,"event_promotion_email":1,"twitter_writer":1,"presentation_content":1,"ask_question":1,"landing_page":1,"google_ads":1,"aida":1,"product_review":1,"welcome_email":1,"youtube_video_description":1,"custom_prompt":1,"generate_by_website_url":1},
        max_words: 10500,
        max_images: 1100,
        additional_tools: 1,
        ai_speech_to_text: 1,
        ai_text_to_speech: 1,
        ai_code: 1,
        recommended: 0,
        support: 1,
        status: 1,
        created_at: "2024-01-05T17:23:22.000000Z",
        updated_at: "2024-01-05T17:23:22.000000Z"
      }
      // profile_image: profileImage
    }

    if (profileImage) {
      body.profile_image = profileImage
    }


    const res = await fetch(`https://getyourtools.app/api-for-upspot-academy.php`, {
      headers: {
        accept: "application/json, text/plain, */*",
        "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: new URLSearchParams(body),
      method: "post",
    })
    return res.json()
  }
}
