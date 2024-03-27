import { Course } from 'src/courses/entities/course.entity';
import { Injectable, BadRequestException, Logger, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { Enrollment } from './entities/enrollment.entity';
import { pruneCourse } from 'src/common/utils/courseUtils';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getDateBefore, generateDateList } from 'src/common/utils/utils';
import * as moment from 'moment-timezone';

@Injectable()
export class EnrollmentsService {
  constructor(@InjectRepository(Enrollment) private enrollmentRepository: Repository<Enrollment>,
    private eventEmitter: EventEmitter2,
    @InjectRepository(Course) private courseRepository: Repository<Course>,

  ) { }
  private readonly logger = new Logger(EnrollmentsService.name);

  async create(createEnrollmentDto: CreateEnrollmentDto, providerId?: number) {
    const alreadyEnrolled = await this.enrollmentRepository.findOneBy({
      userId: createEnrollmentDto.userId,
      courseId: createEnrollmentDto.courseId,
    })
    if (alreadyEnrolled) {
      throw new BadRequestException('Already Enrolled')
    }
    const newEnrollment = this.enrollmentRepository.create({
      ...createEnrollmentDto,
      providerId,
      bySystem: !providerId
    })

    this.eventEmitter.emit('course.accessGiven', {
      userId: createEnrollmentDto.userId, courseId: createEnrollmentDto.courseId
    })
    return await this.enrollmentRepository.save(newEnrollment)
  }

  async getEnrolledCoursesOfAUser(userId: number) {
    const enrollments = await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .select([
        'enrollment.id',
        'enrollment.createdAt',
        'course.id',
        'course.title',
        'course.batchTitle',
        'course.enableDripContent',
        'course.contentType',
        'course.thumbnail',
        'course.category',
        'course.liveClassSchedule'
         // Access the category title
      ])
      .innerJoin('enrollment.course', 'course')
      .leftJoinAndSelect('course.category', 'courseCategory') // Join and select the category
      .leftJoinAndSelect('course.thumbnail', 'publicFile')
      .leftJoinAndSelect('course.instructor', 'user')
      .leftJoinAndSelect('user.photo', 'publicFiles')
      .where('enrollment.userId = :userId', { userId })
      .getMany();


    return enrollments.map((enrollment) => ({ ...enrollment, course: pruneCourse(enrollment?.course) }))

  }

  async checkCourseEnrollment(userId: number, courseId) {
    const enrollment = await this.enrollmentRepository.findOneBy({
      userId, courseId
    })
    return enrollment
  }

  getEnrollmentCountOfACourse(courseId) {
    return this.enrollmentRepository.countBy({ courseId })
  }

  async getSupportBoardOfUser(userId) {
    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        userId,
        course: {
          enableSupport: true
        }

      },
      order: {
        id: 'DESC'
      },
      relations: {
        user: false,
        course: true
      },
      select: ['course']
    })


    const supportBoard = enrollment?.course?.supportDepartment;

    if(!supportBoard) {
      return new BadRequestException('No support board found!')
    }

    return {supportBoard, batchTitle: enrollment.course?.batchTitle }
  }
  async findAllEnrollments({ limit = 10, page = 1 }, { search, courseId }) {
    const skip = (page - 1) * limit;
    const query: any = {}
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

    if (courseId) {
      query.courseId = courseId;
    }

    const [results, totalCount] = await this.enrollmentRepository.findAndCount({
      where: query,
      skip,
      take: limit,
      order: {
        id: 'DESC'
      },
      relations: {
        user: true,
        course: true
      }
    })

    return {
      results: results?.map(data => ({
        ...data, course: { title: data?.course?.title, id: data?.course?.id, batchTitle: data?.course?.batchTitle }, user: {
          fullName: data?.user?.fullName,
          id: data?.user?.id,
          email: data?.user?.email
        }
      })),
      totalCount,
      limit,
      page
    }
  }


  async remove(id: number) {
    const res = await this.enrollmentRepository.delete(id)
    return res
  }

  async bulkRemoveByUserAndCourse(courseId, userIds: number[]) {
    return  await this.enrollmentRepository.
    createQueryBuilder()
    .delete()
    .where('userId IN (:...userIds) AND courseId = :courseId', {
      userIds,
      courseId,
    })
    .execute();
  }

  // async bulkRemove(ids: number[]) {
  //   return  await this.enrollmentRepository.
  //   createQueryBuilder()
  //   .delete()
  //   .where('id IN (:...ids)', {
  //     ids
  //   })
  //   .execute();
  // }
  
  async getDailyEnrollmentSpikes(_startDate = getDateBefore(15), _endDate: Date = new Date()) {
    try {

      const startDate = moment(_startDate).tz('Asia/Dhaka').startOf('day').toDate()
      const endDate =  moment(_endDate).tz('Asia/Dhaka').endOf('day').toDate()
      const enrollmentData = await this.enrollmentRepository
        .createQueryBuilder('enrollment')
        .select('DATE_FORMAT(CONVERT_TZ(enrollment.createdAt, \'+00:00\', \'+06:00\'), \'%Y-%m-%d\') as enrollmentDate')
        .addSelect('COUNT(enrollment.id) as enrollmentCount')
        .where('enrollment.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
        .groupBy('enrollmentDate')
        .orderBy('enrollmentDate', 'ASC')
        .getRawMany();

      // Generate a list of dates between startDate and endDate
      const dateList = generateDateList(startDate, endDate);
      // Convert enrollmentData to a map for efficient lookups
      const enrollmentDataMap = enrollmentData.reduce((map, entry) => {
        map[entry.enrollmentDate] = entry;
        return map;
      }, {});

      // Fill in missing dates with 0 enrollment count
      const result = dateList.map((date) => ({
        enrollmentDate: date,
        enrollmentCount: Number(enrollmentDataMap[date]?.enrollmentCount) || 0,
      }));

      return result;

    } catch (error) {
      throw new Error(`Error fetching daily enrollment spikes: ${error.message}`);
    }
  }

  


}
