import { AssignmentsService } from './../assignments/assignments.service';
import { Lesson } from 'src/courses/entities/course-lesson.entity';
import { UsersService } from 'src/users/users.service';
import { CourseCategoryService } from './../course-category/course-category.service';
import { CoursesQuery } from './dto/courses-query.dto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { Repository, DeepPartial, In, IsNull } from 'typeorm';
import { CourseSection } from './entities/course-section.entity';
import { LiveClass } from './entities/live-class.entity';
import { pruneCourse, pruneCourses } from 'src/common/utils/courseUtils';
import { CreateCourseDto } from './dto/create-course.dto';
import { User } from 'src/users/entities/user.entity';
import { CourseSectionDto } from './dto/create-section.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { WatchHistory } from './entities/watch-history.entity';
import { WatchHistoryDto } from './dto/add-watch-history.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { ROLE } from 'src/users/enums/user.enums';
import { EnrollmentsService } from 'src/enrollments/enrollments.service';
import { FilesService } from "src/files/files.service";

@Injectable()
export class CoursesService {
    constructor(
        @InjectRepository(Course) private coursesRepository: Repository<Course>,
        @InjectRepository(CourseSection) private sectionRepository: Repository<CourseSection>,
        @InjectRepository(LiveClass) private liveClassRepository: Repository<LiveClass>,
        @InjectRepository(Lesson) private lessonRepository: Repository<Lesson>,

        @InjectRepository(User) private userRepository: Repository<User>,

        @InjectRepository(WatchHistory) private watchHistoryRepository: Repository<WatchHistory>,

        private categoryService: CourseCategoryService,
        private usersService: UsersService,
        private assignmentsService: AssignmentsService,
        private enrollmentsService: EnrollmentsService,
        private publicService: FilesService
    ) { }

    getCourseNames({ status, contentType, isMainCourse }) {
        const query: any = {};
        if (status) {
            query.status = status;
        }
        if (contentType) {
            query.contentType = contentType;
        }
        if (isMainCourse === 'true') {
            query.parentCourseId = IsNull()

        }
        const queryBuilder = this.coursesRepository.createQueryBuilder('course')
            .where(query)
            .select(['course.title', 'course.id', 'course.batchTitle'])
            .orderBy('course.id', 'DESC');
        return queryBuilder.getMany();


    }

    async createCourse(createCourseDto: CreateCourseDto) {
                
        if (Number(createCourseDto.thumbnail)) {
            (createCourseDto as any).thumbnailId = createCourseDto.thumbnail;
            (createCourseDto as any).thumbnail = await this.publicService.getFileById(createCourseDto.thumbnail);
        }
        const newCourse = this.coursesRepository.create(createCourseDto as DeepPartial<Course>)
        if(!createCourseDto?.discountFlag) {
            createCourseDto.discountedPrice = createCourseDto.price
        }

        if(createCourseDto?.isFreeCourse) {
            createCourseDto.discountedPrice = 0
        }
        if (Number(createCourseDto.instructor)) {
            newCourse.instructorId = createCourseDto.instructor;
            newCourse.instructor = await this.usersService.getSelectedUsers([createCourseDto.instructor])?.[0];
        }
        if (createCourseDto.coInstructors?.length) {
            const coInstructors = await this.userRepository.find({
                where: {
                    id: In(createCourseDto.coInstructors)
                }
        })

            Object.assign(newCourse, { coInstructors })
        }


        

        return this.coursesRepository.save(newCourse)
    }

    async updateCourse(id: number, payload) {

        const course: any = await this.coursesRepository.findOne({
            where: {
                id: id
            },
            relations: {
                instructor: true,
                coInstructors: true,
                thumbnail: true
            } 
            
         });
        
        if (!course) {
            throw new NotFoundException('No course with this id');
        }
        if(payload?.discountFlag === false) {
            payload.discountedPrice = payload.price || course.price
        }

        if(course?.discountFlag === false && payload.price) {
            payload.discountedPrice = payload.price || course.price
        }

        if(payload?.isFreeCourse === true) {
            payload.discountedPrice = 0;
        }
        
        Object.assign(course, payload);
    
        if (Number(payload.thumbnail)) {
            course.thumbnailId = payload.thumbnail;
            course.thumbnail = await this.publicService.getFileById(payload.thumbnail);
        }
    
        if (Number(payload.instructor)) {
            course.instructorId = payload.instructor;
            course.instructor = await this.usersService.getSelectedUsers([payload.instructor])?.[0];
        }
    
        if (payload.coInstructors?.length) {

            const coInstructors = await this.usersService.getSelectedUsers(payload.coInstructors);
            course.coInstructors = coInstructors;
        } else if (payload.coInstructors && payload.coInstructors?.length === 0) {
            course.coInstructors = null;
        }
    
        // Save the course with relationships
        const updatedCourse = await this.coursesRepository.save(course);
    
        // Refresh the course to load updated relationships
        await this.coursesRepository.findOneBy({ id: updatedCourse.id  });
    
        return updatedCourse;
    }
    

    async deleteCourse(id: number) {

        return this.coursesRepository.delete(id)
    }

    async createSection(courseSectionDto: CourseSectionDto) {
        const sectionCount = await this.sectionRepository.countBy({
            courseId: courseSectionDto.courseId
        })
        return await this.sectionRepository.insert({
            order: sectionCount,
            ...courseSectionDto
        })
    }

    async updateSection(id, courseSectionDto: UpdateSectionDto) {
        return await this.sectionRepository.update(id, courseSectionDto)
    }

    async deleteSection(id) {
        await this.lessonRepository.delete({
            sectionId: id
        })
        return await this.sectionRepository.delete(id)
    }

    async createLesson(createLessonDto: CreateLessonDto) {
        const section = await this.sectionRepository.findOne({
            where: {
                id: createLessonDto.sectionId,
            },
            relations: {
                lessons: true
            },
        });

        if (!section) {
            throw new NotFoundException(`Section with ID ${createLessonDto.sectionId} not found.`);
        }


        const lessonCount = await this.lessonRepository.countBy({
            sectionId: section.id,
        });

        const lessonCountInCourse = await this.lessonRepository.countBy({
            courseId: section.courseId,
        });

        const totalDurationInSecond = await this.calculateTotalDuration(section.courseId)

        const newLesson = this.lessonRepository.create({
            order: lessonCount,
            ...createLessonDto,
            section: section,
        });

        await this.lessonRepository.save(newLesson);

        // Ensure section.lessons is an array
        section.lessons = Array.isArray(section.lessons) ? section.lessons : [];
        // Add the new lesson to the section's lessons
        section.lessons.push(newLesson);

        try {
            await this.sectionRepository.save(section);
        } catch (error) {
            console.error("Error saving section:", error);
            throw error;
        }

        // Update counts in the course
        await this.coursesRepository.update(createLessonDto.courseId, {
            totalLessons: lessonCountInCourse + 1,
            totalLessonsInMinute: (totalDurationInSecond + newLesson.durationInSecond) / 60,
        });

        return newLesson;
    }
    async  calculateTotalDuration(sectionCourseId: number): Promise<number> {
        const lessons = await this.lessonRepository.find({
          where: {
            courseId: sectionCourseId,
          },
        });
      
        // Extract the durationInSecond values from lessons and calculate the sum
        const totalDurationInSecond = lessons.reduce((sum, lesson) => sum + lesson.durationInSecond, 0);
      
        return totalDurationInSecond;
    }
      
    async updateLesson(id, payload) {
        return await this.lessonRepository.update(id, payload)
    }

    async deleteLesson(id) {
        try {

            const lesson = await this.lessonRepository.findOneBy({ id });
            if (!lesson) {
                throw new NotFoundException(`Lesson with ID ${id} not found.`);
            }

            const res = await this.lessonRepository.delete(id);
            const lessonCount = await this.lessonRepository.countBy({
                courseId: lesson.courseId,
            });

            const section = lesson.section;

            try {
                // Remove the lesson from the lessons array
                section.lessons = section.lessons.filter((l) => l.id !== id);

                // Save the updated section
                await this.sectionRepository.save(section);
            } catch (error) {

            }


        const totalDurationInSecond = await this.calculateTotalDuration(section.courseId)



            await this.coursesRepository.update(lesson.courseId, {
                totalLessons: lessonCount, // Subtract 1 since you're deleting a lesson
                totalLessonsInMinute: totalDurationInSecond / 60,
            });

            return res;
        } catch (error) {
            console.error('Error deleting lesson:', error.message);
            throw error;
        }
    }

    async publicFindOne(user, id: number) {
        const extraQuery: any = {
            id
        }
        if(!user) {
            extraQuery.status = 'active';
        }else if(user && user.role === ROLE.student) {
            const enrolled = await this.enrollmentsService.checkCourseEnrollment(user?.sub, id)
            if(!enrolled) {
                extraQuery.status = 'active';
            }
            
        }

        return this.findOne(id, extraQuery)
    }

    async findOne(id: number, extraQuery = {}) {

        const query:any = {
            id,
            ...extraQuery
        }
        
        const course = await this.coursesRepository.findOne({
            where: query,

            relations: {
                instructor: { photo: true, profile: true },
                coInstructors: true
            }
        })
        if(!course) {
            throw new BadRequestException("Course not found or you do not have access to the course")
        }
        if (course.coInstructors) {
            const instructorsProfiles = await this.usersService.getProfilesByIds(course.coInstructors?.map(ins => ins.id))
            course.coInstructors.forEach((instructor, i) => {
                const instructorProfile = instructorsProfiles?.find((_instructor) => _instructor.id == instructor.id)
                course.coInstructors[i] = { ...instructorProfile, fullName: instructor.fullName, id: instructor.id, photo: instructor.photo?.url } as any
            })
        }
        course.instructor = {
            fullName: course.instructor?.fullName,
            photo: course.instructor?.photo?.url || null,
            id: course.instructor?.id,
        } as any
        course.thumbnail = course.thumbnail?.url as any
        return course
    }

    async findCoursesOfAnInstructor(instructorId: number, { limit = 10, page = 1 }: PaginationDto) {

        const [courses, totalCount] = await this.coursesRepository.createQueryBuilder('course')
            .leftJoinAndSelect('course.instructor', 'user')
            .leftJoinAndSelect('course.category', 'category')
            .leftJoinAndSelect('course.thumbnail', 'publicFiles')
            .leftJoinAndSelect('user.photo', 'publicFile')
            .leftJoinAndSelect('user.profile', 'profile')
            .where(`course.status = :status`, { status: 'active' })
            .andWhere('instructorId= :instructorId', { instructorId })
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount()


        return {
            results: pruneCourses(courses),
            totalCount,
            limit,
            page
        }
    }

    async getCourseIdsOfAnInstructor(instructor) {
        return this.coursesRepository
            .createQueryBuilder('course')
            .select('course.id')
            .innerJoin('course.instructor', 'instructor')
            .select('course.id')
            .where('instructor.id = :instructorId', { instructorId: instructor.id })
            .getMany();
    }

    async getSectionsByCourseId(id: number) {
        const data = await this.sectionRepository.createQueryBuilder('section')
            .leftJoinAndSelect('section.lessons', 'lesson')
            .where('section.courseId = :id', { id })
            .orderBy('section.order', 'ASC')
            .addOrderBy('lesson.order', 'ASC')  
            .getMany();
    
        return data;
    }
    
    

    async getFeaturedCourse({ contentType }) {
        const query: Record<string, any> = {
            isFeaturedCourse: true,
            status: 'active'
        }
        if (contentType != 'all' && contentType) {
            query.contentType = contentType
        }
        const course = await this.coursesRepository.findOne({
            where: query,
            // select: ['id', 'title', 'thumbnail', "price"], // Include the columns you want to select
            relations: {
                category: true,
                instructor: { profile: true }
            } // Load the category and instructor relationships
        });

        if (course) {
            return pruneCourse(course);

        }else{
            return  {}
        }

        return course
    }

    async findAll(
        { page = 1, limit = 10 }: PaginationDto,
        { category = 'all', sort_by, price = 'all', level = 'all', rating = 'all', contentType = 'all', search }: CoursesQuery, status = 'active'
    ) {
        let categories = [];

        if (category !== 'all') {
            categories = await this.categoryService.getCategoriesAndSubCategoriesBySlug(category);
        }


        const query = await this.coursesRepository
            .createQueryBuilder('course')
            .leftJoinAndSelect('course.category', 'category')
            .leftJoinAndSelect('course.thumbnail', 'publicFile')
            .leftJoinAndSelect('course.instructor', 'user')
            .leftJoinAndSelect('user.profile', 'profile')
            .leftJoinAndSelect('user.photo', 'publicFiles')

            .where((qb) => {
                if (status !== 'all') {
                    qb.andWhere(`course.status = :status`, { status });
                }

                if (price !== 'all') {
                    qb.andWhere(`(course.discountedPrice ${price === 'free' ? '=' : '>'} 0)`);
                }
                if (search) {
                    qb.andWhere('(course.title LIKE :search)', { search: `%${search}%` });
                }
    

                if (contentType !== 'all') {
                    qb.andWhere(`course.contentType = :contentType`, { contentType });
                }
                if (level !== 'all') {
                    qb.andWhere(`course.level = :level`, { level });
                }
                if (rating !== 'all') {
                    qb.andWhere(`course.rating = :rating`, { rating });
                }
                if (category !== 'all') {
                    qb.andWhere(`course.category IN (:...categories)`, { categories: categories.map(d => d.id) });
                }
                if (sort_by === 'highest-rating') {
                    qb.addOrderBy(
                        'course.rating', 'DESC'
                    );
                } else if (sort_by === 'discounted') {
                    qb.addOrderBy('course.discounted', 'DESC');
                } else if (sort_by === 'lowest-price') {
                    qb.addOrderBy(
                        'course.price', 'ASC'
                    );
                } else if (sort_by === 'highest-price') {
                    qb.addOrderBy(
                        'course.price', 'DESC'
                    );
                } else if (sort_by === 'featured') {
                    qb.addOrderBy(
                        'course.isFeaturedCourse', 'DESC'
                    );
                } else {
                    qb.addOrderBy(
                        'course.createdAt', 'DESC'
                    );
                }
            })
        const [courses, totalCount] = await query
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return {
            results: pruneCourses(courses),
            page,
            limit,
            totalCount,

        };
    }

    async getCoursesByAdmin(
        { page = 1, limit = 10 }: PaginationDto,
        { category = 'all', sort_by, price = 'all', level = 'all', rating = 'all', contentType = 'all', search,  status }
    ) {
        let categories = [];

        if (category !== 'all') {
            categories = await this.categoryService.getCategoriesAndSubCategoriesBySlug(category);
        }


        const query = await this.coursesRepository
            .createQueryBuilder('course')
            .leftJoinAndSelect('course.category', 'category')
            .leftJoinAndSelect('course.thumbnail', 'publicFile')
            .leftJoinAndSelect('course.instructor', 'user')
            .leftJoinAndSelect('user.profile', 'profile')
            .leftJoinAndSelect('user.photo', 'publicFiles')

            // Add subquery to calculate pending assignment count and total submission count


            // .addSelect(subquery => {
            //     subquery
            //         .select('COUNT(*)', 'totalSubmissionCount')
            //         .from(AssignmentSubmission, 'assignmentSubmission')
            //         .where('assignmentSubmission.courseId = :courseId');

            //     return subquery.setParameter('courseId', 'course.id'); // Set parameter explicitly
            // }, 'totalSubmissionCount')
            
            .where((qb) => {
                if (status && status !== 'all') {
                    qb.andWhere(`course.status = :status`, { status });
                }
                if (search) {
                    if(search?.trim()?.toLowerCase() === 'main') {
                        qb.andWhere('(course.title LIKE :search OR course.batchTitle LIKE :search OR course.batchTitle = :emptyString)', { search: `%${search}%`, emptyString: '' });
                    }else {
                        qb.andWhere('(course.title LIKE :search OR course.batchTitle LIKE :search)', { search: `%${search}%` });
                    }
                   
                }
    
                if (price !== 'all') {
                    qb.andWhere(`(course.discountedPrice ${price === 'free' ? '=' : '>'} 0)`);
                }

                if (contentType !== 'all') {
                    qb.andWhere(`course.contentType = :contentType`, { contentType });
                }
                if (level !== 'all') {
                    qb.andWhere(`course.level = :level`, { level });
                }
                if (rating !== 'all') {
                    qb.andWhere(`course.rating = :rating`, { rating });
                }
                if (category !== 'all') {
                    qb.andWhere(`course.category IN (:...categories)`, { categories: categories.map(d => d.id) });
                }
                if (sort_by === 'highest-rating') {
                    qb.addOrderBy(
                        'course.rating', 'DESC'
                    );
                } else if (sort_by === 'discounted') {
                    qb.addOrderBy('course.discounted', 'DESC');
                } else if (sort_by === 'lowest-price') {
                    qb.addOrderBy(
                        'course.price', 'ASC'
                    );
                } else if (sort_by === 'highest-price') {
                    qb.addOrderBy(
                        'course.price', 'DESC'
                    );
                } else if (sort_by === 'featured') {
                    qb.addOrderBy(
                        'course.isFeaturedCourse', 'DESC'
                    );
                } 
                else {
                    qb.addOrderBy(
                        'course.createdAt', 'DESC'
                    );
                }
            })
            .setParameter('status', 'submitted')
            .addSelect('(SELECT COUNT(*) FROM assignment_submissions a WHERE a.courseId = course.id AND a.status = :status) AS pendingAssignmentCount')
            .addSelect('(SELECT COUNT(*) FROM assignments a WHERE a.courseId = course.id) AS totalAssignmentCount')
            .addSelect('(SELECT COUNT(*) FROM assignment_submissions a WHERE a.courseId = course.id) AS totalAssignmentSubmissionCount')

        const courses = await query
            .offset((page - 1) * limit)
            .limit(limit)
            .getRawMany();

            const totalCount = await this.coursesRepository
            .createQueryBuilder('course')
            .where((qb) => {
                // if (status !== 'all') {
                //     qb.andWhere(`course.status = :status`, { status });
                // }

                if (price !== 'all') {
                    qb.andWhere(`(course.discountedPrice ${price === 'free' ? '=' : '>'} 0)`);
                }

                if (contentType !== 'all') {
                    qb.andWhere(`course.contentType = :contentType`, { contentType });
                }
                if (level !== 'all') {
                    qb.andWhere(`course.level = :level`, { level });
                }
                if (rating !== 'all') {
                    qb.andWhere(`course.rating = :rating`, { rating });
                }
                if (category !== 'all') {
                    qb.andWhere(`course.category IN (:...categories)`, { categories: categories.map(d => d.id) });
                }
                if (sort_by === 'highest-rating') {
                    qb.addOrderBy(
                        'course.rating', 'DESC'
                    );
                } else if (sort_by === 'discounted') {
                    qb.addOrderBy('course.discounted', 'DESC');
                } else if (sort_by === 'lowest-price') {
                    qb.addOrderBy(
                        'course.price', 'ASC'
                    );
                } else if (sort_by === 'highest-price') {
                    qb.addOrderBy(
                        'course.price', 'DESC'
                    );
                } else if (sort_by === 'featured') {
                    qb.addOrderBy(
                        'course.isFeaturedCourse', 'DESC'
                    );
                } 
                else {
                    qb.addOrderBy(
                        'course.createdAt', 'DESC'
                    );
                }
            })
            .getCount();
        
        return {
            results: courses?.map(course => ({
                pendingAssignmentCount: Number(course?.pendingAssignmentCount),
                totalAssignmentCount: Number(course?.totalAssignmentCount),
                totalAssignmentSubmissionCount: Number(course?.totalAssignmentSubmissionCount),
                id: course?.course_id,
                title: course?.course_title,
                status: course?.course_status,
                batch: course?.course_batchTitle,
                categoryName: course?.category_name,
                instructorName: course?.user_fullName,
                totalLessons: course?.course_totalLessons,
                totalLessonsInMinute: course?.course_totalLessonsInMinute,
                isMainCourse: !course?.course_parentCourseId,
                enrollCount: course?.course_enrollCount,
                contentType: course?.course_contentType
                
            })),
            page,
            limit,
            totalCount

        };
    }

    async findLiveClassByCourseId(courseId: number) {
        // TODO: need to add check for course access
        return await this.liveClassRepository.findBy({ courseId })
    }

    async addWatchHistory(userId: number, watchHistoryDto: WatchHistoryDto) {
        const watchHistory = await this.watchHistoryRepository.findOneBy({
            userId,
            lessonId: watchHistoryDto.lessonId
        })

        const lesson = await this.lessonRepository.findOneBy({
            id: watchHistoryDto.lessonId
        })
        const completePercentage = Math.floor(
            (watchHistoryDto.watchTimeInSecond / lesson.durationInSecond) * 100
        );
        const course = await this.coursesRepository.findOneBy({ id: lesson.courseId })

        let isCompleted = false;
        if (course.enableDripContent && completePercentage >= course.dripPercentage) {
            isCompleted = true
        } else if (!course.enableDripContent) {
            isCompleted = true
        }

        if (!watchHistory) {
            return await this.watchHistoryRepository.insert({
                ...watchHistoryDto,
                courseId: lesson.courseId,
                sectionId: lesson.sectionId,
                isCompleted,
                userId
            })
        } else {
            return await this.watchHistoryRepository.update((await watchHistory).id, {
                ...watchHistoryDto,
                isCompleted,
                userId
            })
        }

    }

    getWatchHistoriesOfAUserOfACourse(userId: number, courseId: number) {
        return this.watchHistoryRepository.findBy({
            userId,
            courseId
        })
    }

    async getCourseProgressOfAUser(userId, courseId) {
        const lessonCount = await this.lessonRepository.countBy({
            courseId
        }) || 0;

        const completedLessonCount = await this.watchHistoryRepository.countBy({
            courseId,
            userId,
            isCompleted: true
        }) || 0;

        const assignmentCount = await this.assignmentsService.getAssignmentCount(courseId)

        const approvedAssignmentCount = await this.assignmentsService.getApprovedAssignmentSubmissionCount(userId, courseId);

        const totalLessonIncludingAssignment = lessonCount + assignmentCount;

        const totalCompleteCountIncludingAssignment = completedLessonCount + approvedAssignmentCount;

        let progress = 0;
        if (totalLessonIncludingAssignment && totalCompleteCountIncludingAssignment) {
            progress = (100 * totalCompleteCountIncludingAssignment) / totalLessonIncludingAssignment
        }

        if (progress < 0) {
            progress = 0;
        }

        if (progress > 100) {
            progress = 100;
        }
        const {minAssignmentCompletionRequiredForCertificate, allowCertificate, minLessonCompletionRequiredForCertificate} = await this.coursesRepository.findOne({
            where: {
                id: courseId
            },
            select: ["id", "allowCertificate", "minAssignmentCompletionRequiredForCertificate", "minLessonCompletionRequiredForCertificate"]
        })
        const isAvailableForCertificate = allowCertificate && (completedLessonCount >= minLessonCompletionRequiredForCertificate) && (approvedAssignmentCount >= minAssignmentCompletionRequiredForCertificate)
        return {
            progress,
            completedLessonCount,
            approvedAssignmentCount,
            isAvailableForCertificate: !!isAvailableForCertificate,
            allowCertificate,
            minLessonCompletionRequiredForCertificate,
            minAssignmentCompletionRequiredForCertificate

        };

    }

}
