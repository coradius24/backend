import { ContentType, CourseLevel, CourseSupportDepartment } from './../enums/course.enums';
import { DeepPartial } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


  

class CreateCourseDto {
  @ApiProperty()
  title?: string;

  @ApiPropertyOptional()
  shortDescription?: string;

//   @ApiPropertyOptional()
//   description?: string;

  @ApiPropertyOptional({ type: [String] })
  outcomes?: string[];

  @ApiPropertyOptional({ type: [String] })
  requirements?: string[];

  @ApiPropertyOptional({default: {"This is a question 1": "this is a question ans1", "This is a question 2": "this is a question ans2"}})
  faqs?: Record<string, string>;

  @ApiPropertyOptional()
  categoryId?: number;

  @ApiPropertyOptional()
  discountFlag?: boolean;

  @ApiPropertyOptional()
  price?: number;

  @ApiPropertyOptional()
  discountedPrice?: number;

  @ApiPropertyOptional()
  discounted?: number;

  @ApiPropertyOptional()
  rating?: number;

  @ApiPropertyOptional()
  liveClassSchedule?: string;

  @ApiPropertyOptional()
  totalLessons?: number;

  @ApiPropertyOptional()
  totalLessonsInMinute?: number;

  @ApiPropertyOptional()
  enrollCount?: number;

  @ApiPropertyOptional()
  rattedBy?: number;

  @ApiPropertyOptional({ enum: CourseLevel, default: CourseLevel.BEGINNER })
  level: DeepPartial<CourseLevel>;

  @ApiPropertyOptional()
  instructor?: number;

  @ApiPropertyOptional({ type: [Number] })
  coInstructors?: number[];

  @ApiPropertyOptional()
  thumbnail?: number;

  @ApiPropertyOptional()
  videoUrl?: string;

  @ApiPropertyOptional({ type: Date })
  createdAt?: Date;

  @ApiPropertyOptional({ type: Date })
  updatedAt?: Date;

  @ApiPropertyOptional()
  isTopCourse?: boolean;

  @ApiPropertyOptional()
  isPopularCourse?: boolean;

  @ApiPropertyOptional()
  isFeaturedCourse?: boolean;

  @ApiPropertyOptional({ enum: ['PRIVATE', 'PUBLIC'], default: 'PRIVATE' })
  status?: string;

  @ApiPropertyOptional()
  courseOverviewProvider?: string;

  @ApiPropertyOptional({ type: [String] })
  metaKeywords?: string[];

  @ApiPropertyOptional({ type: [String] })
  whatsIn?: string[];

  @ApiPropertyOptional()
  metaDescription?: string;

  @ApiPropertyOptional()
  isFreeCourse?: boolean;

  @ApiPropertyOptional()
  enableDripContent?: boolean;

  @ApiPropertyOptional()
  dripPercentage?: number;

  @ApiPropertyOptional()
  createdBy?: number;

  @ApiPropertyOptional({ enum: ContentType, default: ContentType.LIVE })
  contentType?: string;

  @ApiPropertyOptional({ type: Date })
  enrollmentDeadline?: Date;

  @ApiPropertyOptional()
  parentCourseId?: number;

  @ApiPropertyOptional()
  batchTitle?: string;

  // @ApiPropertyOptional()
  // scheduleText?: string;

  @ApiPropertyOptional()
  allowPartialPaymentEnrollment?: boolean;

  @ApiPropertyOptional()
  minimumPartialPayment?: number;

  @ApiPropertyOptional()
  allowWallet?: boolean;

  @ApiPropertyOptional()
  allowSmartLinkGeneration?: boolean;

  @ApiPropertyOptional()
  allowEarningReport?: boolean;

  @ApiPropertyOptional({ default: true })
  allowCertificate?: boolean

  @ApiPropertyOptional({ default: 0 })
  minLessonCompletionRequiredForCertificate: number;

  @ApiPropertyOptional({ default: 0 })
  minAssignmentCompletionRequiredForCertificate: number;

  @ApiPropertyOptional()
  enableSupport?: boolean;

  @ApiPropertyOptional({enum: CourseSupportDepartment})
  supportDepartment?: string;

  constructor(partial: Partial<CreateCourseDto>) {
    Object.assign(this, partial);
  }
}

export { CreateCourseDto };
