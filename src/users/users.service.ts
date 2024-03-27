import { transformPhone } from 'src/pre-registration/dto/create-pre-registration.dto';
import { NotificationReceiver, NotificationType } from 'src/notification/enums/notification.enums';
import { ROLE } from 'src/users/enums/user.enums';
import { KycDocument } from './entities/kyc-document.entity';
import { Profile } from 'src/users/entities/profile.entity';
import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, Like, Not } from 'typeorm';
import { User } from './entities/user.entity';
import { SignUpDto } from 'src/auth/dto/signup.dto';
import * as crypto from 'crypto'; // Import the crypto library
import * as bcrypt from 'bcrypt';
import { PASSWORD_VERSION, USER_STATUS } from './enums/user.enums';
import { FilesService } from 'src/files/files.service';
import { Course } from 'src/courses/entities/course.entity';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(KycDocument)
    private kycDocumentRepository: Repository<KycDocument>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    private readonly filesService: FilesService,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,

    private eventEmitter: EventEmitter2,
    private notificationGateway: NotificationGateway,
    private mailService: MailService,

  ) { }



  async getUsers({ limit = 10, page = 1 }, { search, status, isKycVerified, role }) {

    const skip = (page - 1) * limit;
    let query: any = {}
    if (role !== undefined) {
      query.role = role;
    } else {
      // all admin levels expect instructors
      query.role = Not(In([ROLE.student, ROLE.instructor]))
    }
    if (status) {
      query.status = status;
    }

    if (isKycVerified) {
      query.isKycVerified = isKycVerified;
    }
    if (search) {
      if (Number(search) && !search?.startsWith('0')) {
        query.id = search;
      } else {
        query = [
          { ...query, fullName: Like(`%${search}%`) },
          { ...query, email: Like(`%${search}%`) },
          { ...query, mobileNumber: Like(`%${search}%`) },
        ]
      }


    }


    const [results, totalCount] = await this.usersRepository.findAndCount({
      where: query,
      skip,
      take: limit,
      select: ['email', 'id', 'fullName', 'mobileNumber', 'status', 'isKycVerified', 'role', 'photo', 'createdAt'],
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

  async getInstructors(paginationQuery, filterQuery) {
    try {
      const { results, totalCount } = await this.getUsers(paginationQuery, filterQuery);
      // Extract instructor IDs
      const instructorIds = results
        .filter(user => user.role === ROLE.instructor)
        .map(instructor => instructor.id);

      // Fetch counts for each instructor
      const instructorCounts = await Promise.all(
        instructorIds.map(async instructorId => {
          const [courses, courseCount] = await this.getCourseIdsOfAnInstructor(instructorId);
          // Check if courses array is not empty before using it in the IN clause
          const courseIdArray = courses.map(course => course.id);

          if (courseIdArray.length === 0) {
            // Handle the case when there are no courses for the instructor
            return {
              userId: instructorId,
              courseCount: courseCount || 0,
              studentCount: 0,
              reviews: 0,
            };
          }

          const studentCount = await this.enrollmentRepository.count({
            where: {
              courseId: In(courseIdArray)
            }
          });

          const reviews = await this.getReviewsCountForCourses(courses);

          return {
            userId: instructorId,
            courseCount: courseCount || 0,
            studentCount: studentCount || 0,
            reviews,
          };
        })
      );



      // Merge counts back into the results
      const resultsWithCounts = results.map(user => {
        const instructorCount = instructorCounts.find(count => count.userId === user.id);
        return {
          ...user,
          ...(instructorCount || {}),
        };
      });


      return {
        results: resultsWithCounts,
        totalCount,
        page: paginationQuery.page,
        limit: paginationQuery.limit,
      };
    } catch (error) {
      throw error; // Rethrow the error to propagate it up the call stack
    }
  }

  async findOne(id: number): Promise<User | undefined> {
    return this.usersRepository.findOne({
      where: { id },
      relations: {
        profile: true,
      },
    });

  }

  async findInstructorById(id: number) {
    const user = await this.findOne(id)
    if (user?.role != 1) {
      throw new NotFoundException('No instructor found with this id')
    }

    const [courses, courseCount] = await this.getCourseIdsOfAnInstructor(user.id, 'active')
    let studentCount = 0;
    if (courses?.length) {
      studentCount = await this.enrollmentRepository.count({
        where: {
          courseId: In(courses.map(d => d.id))
        }
      })
    }


    let reviews: any = 0;
    if (courses?.length) {
      reviews = await this.getReviewsCountForCourses(courses)
    }



    Object.assign(user, { courseCount: courseCount || 0, studentCount: studentCount || 0, reviews })
    return user
  }

  async getCourseIdsOfAnInstructor(instructorId, status?): Promise<any> {
    try {
      if(status) {
        const [courses, courseCount] = await this.courseRepository
        .createQueryBuilder('course')
        .innerJoinAndSelect('course.instructor', 'user')
        .where(`course.status = :status`, { status: 'active' })
        .andWhere('instructorId = :instructorId', { instructorId })
        .select("course.id")
        .getManyAndCount();
        if (courses.length === 0) {
          return [[], 0]; // Return an empty array and 0 count if no courses found
        }
  
        return [courses, (courseCount || 0)];
      }
      
      const [courses, courseCount] = await this.courseRepository
        .createQueryBuilder('course')
        .innerJoinAndSelect('course.instructor', 'user')
        // .where(`course.status = :status`, { status: 'active' })
        .andWhere('instructorId = :instructorId', { instructorId })
        .select("course.id")
        .getManyAndCount();
        if (courses.length === 0) {
          return [[], 0]; // Return an empty array and 0 count if no courses found
        }
  
        return [courses, (courseCount || 0)];


      
    } catch (error) {
      return [[], 0];

    }

  }


  async findAllInstructors() {
    const instructors = await this.usersRepository.find({
      where: {
        role: 1,
      },
      select: ['id', 'fullName', 'profile'],
      relations: {
        profile: true
      }
    })
    return instructors
  }

  async getReviewsCountForCourses(courses) {
    const courseIds = courses.map(course => course.id);

    const reviewsCount = await this.courseRepository
      .createQueryBuilder('course')
      .select('course.id', 'courseId')
      .addSelect('SUM(course.rattedBy)', 'reviewsCount')
      .where('course.id IN (:...courseIds)', { courseIds })
      .groupBy('course.id')
      .getRawMany();

    return reviewsCount?.reduce((acc, crr) => acc + crr.reviewsCount, 0) || 0;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    if (!email) {
      return undefined
    }
    return this.usersRepository.findOne({
      where: { email: email },
      relations: {
        profile: true,
      },
    });
  }

  async updateUserProfile(id: number, payload: any): Promise<User> {
    const { profile, ...userData } = payload;
    const user = await this.usersRepository.findOne({
      where: { id: id }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const previousPhotoId = user.photo?.id;



    // Check if a profile is provided
    if (profile) {
      const profileFromDB = await this.profileRepository.findOne({
        where: { userId: id },
      });



      if (profileFromDB) {

        // Update the existing profile
        Object.assign(profileFromDB, profile);

        await this.profileRepository.save(profileFromDB);
      } else {
        // Create a new profile
        const newProfile: any = this.profileRepository.create({
          ...profile,
          userId: id,
        });
        await this.profileRepository.save(newProfile);
        // Set the profileId in the user entity
        user.profileId = newProfile.id;
      }

    }



    // Set the user data
    Object.assign(user, userData);

    // Update the user
    await this.usersRepository.save(user);
    if (previousPhotoId && userData?.photo) {

      await this.filesService.deletePublicFile(previousPhotoId);
    }

    return { ...user, ...userData }
  }

  async addProfilePhoto(userId: number, imageBuffer: Buffer, filename: string) {
    const photo = await this.filesService.uploadPublicFile(imageBuffer, filename);
    await this.updateUserProfile(userId, {
      photo: photo
    })
    return photo;
  }

  async updateUser(id: number, payload: Partial<User>) {
    if (payload.mobileNumber) {
      payload.mobileNumber = transformPhone(payload.mobileNumber)
    }
    if(payload.email) {
      const duplicateEmail = await this.findByEmail(payload.email)
     
      if(duplicateEmail) {
        return new BadRequestException("Duplicate Email")
      }
      
      this.eventEmitter.emit('user.emailChanged', {
        userId: id, 
        email: payload.email
      })
      
    }
    const updateResult = await this.usersRepository.update(id, payload);
    if (updateResult.affected === 0) {
      // Handle the case where the user with the given ID is not found.
      return undefined;
    }
    return true
  }

  async updateUserByAdmin(requestingUser, id: number, payload) {
    const user = await this.findOne(id)

    if (requestingUser?.role != ROLE.superAdmin && (payload.role == ROLE.superAdmin || payload.role === ROLE.admin || payload.role === requestingUser.role || user?.role === ROLE.superAdmin || user?.role === ROLE.admin || user?.role === requestingUser.role)) {
      throw new ForbiddenException('You do not have access to do this action!')
    }

    if (payload.status === USER_STATUS.disabled) {
      this.eventEmitter.emit('user.disabled', {
        userId: user.id,
        email: user?.email
      })
    }

    return this.updateUser(id, payload)
  }
  async createUser(payload: SignUpDto & {
    status?: number,
    password?: string,
    federated?: {
      facebook?: string,
      google?: string,
      picture?: string
    },
    photo?: any,
    photoId?: number,
    role?: number,

  }) {
    const { fullName, email, mobileNumber, password, status, federated, photo, photoId, role } = payload;
    const saltOrRounds = 10;
    let passwordHash = ''
    if (password) {
      passwordHash = await bcrypt.hash(password, saltOrRounds);
    }
    const userExists = await this.findByEmail(email);
    if (userExists) {
      throw new BadRequestException('Duplicate Email', {
        cause: new Error(),
        description: 'User already exits with this email',
      });
    }
    const userData = {
      fullName,
      email,
      mobileNumber: transformPhone(mobileNumber),
      status,
      federated,
      photo,
      photoId,
      role
    }
    const insertResult = await this.usersRepository.insert({
      ...userData,
      password: passwordHash,
    });
    const userId = insertResult.identifiers[0].id;
    return {
      ...userData,
      id: userId
    }
  }

  async setPassword(userId: number, newPassword: string) {
    const user: Partial<User> = await this.findOne(userId)

    if (user?.status === USER_STATUS.disabled) {
      return new ForbiddenException('আপনার অ্যাকাউন্ট ডিজেবল করা হয়েছে, সহায়তার জন্য সাপোর্টে যোগাযোগ করুন!', 'accountDisabled')
    }

    const saltOrRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltOrRounds);
    user.passwordVersion = PASSWORD_VERSION.sha256
    user.password = newPasswordHash;
    if (user.status === USER_STATUS.notVerified) {
      user.status = USER_STATUS.verified;
    }
    await this.usersRepository.save(user);

    return { success: true }
  }

  async changePassword(email: string, currentPassword, newPassword: string) {
    const user: Partial<User> = await this.matchUserPassword(email, currentPassword)

    const saltOrRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltOrRounds);
    user.passwordVersion = PASSWORD_VERSION.sha256
    user.password = newPasswordHash;
    await this.usersRepository.save(user);

    return { success: true }
  }

  async getSelectedUsers(ids) {

    // Convert single ID to an array
    const idArray = typeof ids === 'number' ? [ids] : ids;

    const users = await this.usersRepository.find({
      where: {
        id: In(idArray),
      },
      select: ['email', 'id', 'fullName', 'photo'],
    });

    return users;
  }


  async searchUsersByNameOrEmailOrId(searchTerm: string, { limit = 20, page = 1 }) {
    const isId = Number(searchTerm);

    if (isId && !searchTerm?.startsWith('0')) {
      const [results, totalCount] = await this.usersRepository
        .createQueryBuilder('user')
        .where('user.id = :searchTerm', { searchTerm })
        .select(['user.id', 'user.fullName', 'user.email', 'user.photo'])
        .leftJoinAndSelect('user.photo', 'publicFiles')
        .limit(20)
        .getManyAndCount();

      return {
        results,
        totalCount,
        page,
        limit,
      };
    }

    const [results, totalCount] = await this.usersRepository.createQueryBuilder('user')
      .select(['user.id', 'user.fullName', 'user.email', 'user.photo'])
      .leftJoinAndSelect('user.photo', 'publicFile')
      .where('(LOWER(user.fullName) LIKE :searchTerm OR LOWER(user.email) LIKE :searchTerm OR LOWER(user.mobileNumber) LIKE :searchTerm)', {
        searchTerm: `%${searchTerm.toLowerCase()}%`,
      })
    
      .limit(20)
      .getManyAndCount();

    // .getManyAndCount();

    return {
      results,
      totalCount,
      page,
      limit,
    };
  }



  async matchUserPassword(email: string, pass: string, isAdministrativeRole?: boolean) {
    const user = await this.findByEmail(email);
    if (isAdministrativeRole && user.role === ROLE.student) {
      throw new ForbiddenException('You do not have access in this portal')
    }
    let isPasswordMatched = false;
    if (!user) {
      throw new NotFoundException('Wrong credentials!');
    }

    if (user.passwordVersion === PASSWORD_VERSION.sha1) {
      isPasswordMatched = this.compareSha1Hash(pass, user.password);
    } else {
      isPasswordMatched = await bcrypt.compare(pass, user.password);
    }
    if (!isPasswordMatched) {
      throw new NotFoundException('Wrong credentials!');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, lastPasswordChanged, passwordVersion, ...nonsensitiveData } = user
    return nonsensitiveData;
  }

  // Function to compare a plain text password with a SHA-1 hash
  private compareSha1Hash(plainPassword: string, sha1Hash: string): boolean {
    const hashedPassword = this.sha1Hash(plainPassword);
    return hashedPassword === sha1Hash;
  }

  // Function to create a SHA-1 hash from a plain text password
  private sha1Hash(plainPassword: string): string {
    const sha1 = crypto.createHash('sha1');
    sha1.update(plainPassword);
    return sha1.digest('hex');
  }

  async getProfilesByIds(ids) {
    return await this.profileRepository.find({
      where: {
        id: In(ids)
      },
      select: ['id']
    })
  }

  async uploadKycDocument(userId, documentPayload, { frontPhoto, backPhoto }) {

    const payload: any = {
      userId,
      documentType: documentPayload.documentType,
      isDocumentValid: documentPayload.meta == 'b326b5062b2f0e69046810717534cb09'
    }
    const userData = await this.usersRepository.findOneBy({ id: userId })
    if (!userData.isKycVerified && payload.isDocumentValid) {
      await this.usersRepository.update(userId, { isKycVerified: true })
    }

    if (frontPhoto) {
      const frontPhotoFile = await this.filesService.uploadPublicFile(frontPhoto.buffer, frontPhoto.originalname);
      payload.frontPhoto = frontPhotoFile
    }

    if (backPhoto) {
      const backPhotoFile = await this.filesService.uploadPublicFile(backPhoto.buffer, backPhoto.originalname);
      payload.backPhoto = backPhotoFile
    }

    try {
      await this.kycDocumentRepository.insert(payload)
      return {
        ok: true
      }
    } catch (error) {
      return {
        ok: false,
        message: error?.message || "Someting went wrong, please try again!"
      }
    }
  }

  async getKycDocumentsOfAUser(userId) {
    return this.kycDocumentRepository.findOne({
      where: {
        userId
      },
      order: { id: 'DESC' }
    })
  }

  @OnEvent('user.disabled')
  async handleUserDisabled(payload: {
    userId: number,
    email: string
  }) {
    await this.notificationGateway.sendInstantNotification({
      receiverType: NotificationReceiver.INDIVIDUAL_USERS,
      notificationType: NotificationType.SYSTEM_GENERATED,
      receivers: [payload.userId],
      linkOrId: `#accountDisabled`,
      message: `আপনার অ্যাকাউন্ট ডিজেবল করা হয়েছে!`
    })

    await this.mailService.sendAccountSuspensionMail({ email: payload.email })

  }
}
