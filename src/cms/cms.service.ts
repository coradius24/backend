import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { FeaturedInstructor } from './entities/featured-instructors.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from './entities/page.entity';
import { TeamMember } from './entities/team-member.entity';
import { query } from 'express';
import { FilesService } from 'src/files/files.service';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';


@Injectable()
export class CmsService {
  constructor(
    @InjectRepository(FeaturedInstructor) private featuredInstructorRepository: Repository<FeaturedInstructor>,
    @InjectRepository(Page) private pageRepository: Repository<Page>,
    @InjectRepository(TeamMember) private teamMemberRepository: Repository<TeamMember>,
    private fileService: FilesService
    
  ){}
  getFeaturedInstructors() {
     return this.featuredInstructorRepository.find({
      order: {
        serialNumber: 'ASC'
      },
      relations: {
        user: true
      }
     })
  }

  
  async createFeaturedInstructor({userId, serialNumber}) {
    const payload = { userId, serialNumber: serialNumber }
    if(!serialNumber) {
      payload.serialNumber  = await this.featuredInstructorRepository.count()
      payload.serialNumber++
    }

    return await this.featuredInstructorRepository.insert(payload)
  }

  async updateFeaturedInstructorsOrder(data) {
    await this.featuredInstructorRepository.createQueryBuilder().delete().from(FeaturedInstructor).execute()
    await this.featuredInstructorRepository.createQueryBuilder('featuredInstructor')
    .insert()
    .into(FeaturedInstructor)
    .values(data)
    .execute()

  }

  removeFeaturedInstructor(id: number) {
    return this.featuredInstructorRepository.delete(id)
  }

  async createTeamMember(payload: CreateTeamMemberDto, photo) {
    if((payload as any).isPublic === 'true') {
      payload.isPublic = true
    }else{
      payload.isPublic = false
    }
    const data =  this.teamMemberRepository.create(payload)
    data.serialNumber  = await this.featuredInstructorRepository.count()
    data.serialNumber++
    if (photo) {
      const photoFile = await this.fileService.uploadPublicFile(photo.buffer, photo.originalname);
      data.photo = photoFile
    }
    return await this.teamMemberRepository.save(data)
  }

  async getTeamMembers({page=1, limit=1000}, status) {
    const query: any = {}
     if(status === 'public' && status) {
      query.isPublic = true
    }
    const [results, totalCount] = await this.teamMemberRepository.findAndCount({
    where: query,
     order: {
       serialNumber: 'ASC'
     },
     take: limit,
     skip: (page - 1) * limit,
    })

    return {
      results, 
      totalCount,
      page, 
      limit
    }
  }

  async updateTeamMembersOrder(dataArray) {
    const updatePromises = dataArray?.map(data => {
      return this.teamMemberRepository.update(data.id, {
        serialNumber: data.serialNumber
      })
    })

    return await Promise.all(updatePromises)
  }

  async updateTeamMember(userId, payload: UpdateTeamMemberDto, photo) {
    const data = await this.teamMemberRepository.findOne({
      where: {
        id: userId
      }
    })
    if((payload as any).isPublic === 'true') {
      payload.isPublic = true
    }else if((payload as any).isPublic === 'false'){
      payload.isPublic = false
    }
    if (photo) {
      const photoFile = await this.fileService.uploadPublicFile(photo.buffer, photo.originalname);
      
      data.photo = photoFile
    }
    Object.assign(data, payload)
    return await this.teamMemberRepository.save(data)
  }

  removeTeamMember(id) {
    return this.teamMemberRepository.delete(id)
  }
  getPageData(id) {
    return this.pageRepository.findOneBy({id: id})
  }
  async upsertPageData({id, content}) {
    const page = await this.pageRepository.findOne({
      where: {
        id
      },
      select: ['id']
    })
    if(page) {
      page.content = content

      return this.pageRepository.save(page)
    }else {
      const mewPage = this.pageRepository.create({id, content})
      return this.pageRepository.save(mewPage)
    }
  }
}
