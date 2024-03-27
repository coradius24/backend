// Course Entity
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
  JoinTable,
} from 'typeorm';
import PublicFile from 'src/files/entities/publicFile.entity';
import { User } from 'src/users/entities/user.entity';
import { CourseLevel, CourseStatus, ContentType, CourseSupportDepartment } from '../enums/course.enums';
import { CourseCategory } from 'src/course-category/entities/course-category.entity';



@Entity({ name: 'courses' })
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, default: '' })
  title: string;

  @Column({ type: 'longtext', nullable: true })
  shortDescription: string;

  @Column({ type: 'longtext', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  outcomes: string[];

  @Column({ type: 'json', nullable: true })
  requirements: string[];

  @Column({ type: 'json', nullable: true })
  faqs: Record<string, string>;

  @ManyToOne(() => CourseCategory, { eager: true, nullable: true }) // Many courses belong to one category
  @JoinColumn({ name: 'categoryId' }) // Use categoryId as the foreign key
  category: CourseCategory;

  @Column({ type: 'int', nullable: true })
  categoryId: number;

  @Column({ type: 'boolean', nullable: true })
  discountFlag: boolean;

  @Column({ type: 'int', nullable: true, default: 0 })
  price: number;

  @Column({ type: 'int', default: 0 })
  discountedPrice: number;

  @Column({ type: 'int', default: 0 })
  discounted: number;

  @Column({ type: 'double', nullable: true, default: 0 })
  rating: number;

  @Column({ type: 'varchar', length: 300, nullable: true })
  liveClassSchedule: string;

  @Column({ type: 'int', nullable: true, default: 0 })
  totalLessons: number;

  @Column({ type: 'bigint', nullable: true, default: 0 })
  totalLessonsInMinute: number;


  @Column({ type: 'int', nullable: true, default: 0 })
  enrollCount: number;

  @Column({ type: 'double', nullable: true, default: 0 })
  rattedBy: number;

  @Column({
    type: 'enum',
    enum: CourseLevel,
    default: CourseLevel.BEGINNER,
  })
  level: CourseLevel;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinTable({ name: 'instructorId' })
  instructor: User;

  @Column({
    type: 'int',
    nullable: true
  })
  instructorId: number;

  @ManyToMany(() => User, { eager: false, nullable: true })
  @JoinTable()
  coInstructors: User[];

  @OneToOne(() => PublicFile, {
    nullable: true, eager: true,
    cascade: true,

    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: 'thumbnailId' })
  thumbnail: PublicFile;

  @Column({
    type: 'int',
    nullable: true
  })
  thumbnailId: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  videoUrl: string;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updatedAt: Date;

  @Column({ type: 'boolean', nullable: true })
  isTopCourse: boolean;

  @Column({ type: 'boolean', nullable: true })
  isPopularCourse: boolean;

  @Column({ type: 'boolean', nullable: true })
  isFeaturedCourse: boolean;

  @Column({
    type: 'enum',
    enum: CourseStatus,
    default: CourseStatus.PRIVATE,
  })
  status: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  courseOverviewProvider: string;

  @Column({ type: 'simple-array', nullable: true })
  metaKeywords: string[];

  @Column({ type: 'simple-array', nullable: true })
  whatsIn: string[];

  @Column({ type: 'longtext', nullable: true })
  metaDescription: string;

  @Column({ type: 'boolean', nullable: true })
  isFreeCourse: boolean;

  @Column({ type: 'boolean', nullable: true })
  enableDripContent: boolean;

  @Column({ type: 'int', nullable: true })
  dripPercentage: number

  @Column({ type: 'int', nullable: true })
  createdBy: number;

  @Column({ type: 'enum', enum: ContentType, default: ContentType.LIVE })
  contentType: string;

  @Column({ type: 'datetime', nullable: true })
  enrollmentDeadline: Date | null;

  @Column({ type: 'int', nullable: true })
  parentCourseId: number;

  @Column({ type: 'varchar', length: 50, default: '', nullable: true, })
  batchTitle: string;

  // @Column({ type: 'varchar', length: 100, default: '', nullable: true, })
  // scheduleText: string;

  @Column({ type: 'bool', nullable: true, })
  allowPartialPaymentEnrollment: boolean

  @Column({ type: 'int', nullable: true, default: null })
  minimumPartialPayment: number

  @Column({ type: 'bool', nullable: true, })
  allowWallet: boolean

  @Column({ type: 'bool', nullable: true })
  allowSmartLinkGeneration: boolean

  @Column({ type: 'bool', nullable: true, })
  allowEarningReport: boolean

  @Column({ type: 'bool', nullable: true, default: true })
  allowCertificate: boolean

  @Column({ type: 'int', nullable: true, default: 0 })
  minLessonCompletionRequiredForCertificate: number;

  @Column({ type: 'int', nullable: true, default: 0 })
  minAssignmentCompletionRequiredForCertificate: number;
  

  @Column({ type: 'bool', nullable: true, default: false })
  enableSupport: boolean

  @Column({ type: 'enum', enum: CourseSupportDepartment, nullable: true, })
  supportDepartment: string
}
