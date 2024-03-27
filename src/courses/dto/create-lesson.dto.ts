import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AttachmentType, LessonType, VideoType } from '../enums/course.enums';

class CreateLessonDto {

  @ApiProperty()
  title?: string;

  @ApiProperty()
  courseId?: number;

  @ApiProperty()
  sectionId?: number;

  @ApiPropertyOptional({ default: VideoType.VIMEO})
  videoType?: any;

  @ApiPropertyOptional()
  cloudVideoId?: number;

  @ApiPropertyOptional()
  videoUrl?: string;

  @ApiPropertyOptional({enum: LessonType, default: LessonType.VIDEO})
  @IsEnum(LessonType)
  lessonType?: LessonType;

  @ApiPropertyOptional()
  attachment?: string;

  @ApiPropertyOptional({default: AttachmentType.URL})
  attachmentType?: string;

  @ApiPropertyOptional()
  summary?: string;

  @ApiPropertyOptional({default: false})
  isFree?: boolean;

  @ApiPropertyOptional()
  order?: number;

  @ApiPropertyOptional()
  durationInSecond?: number;

  @ApiPropertyOptional()
  rewardCoupon?: string;

  constructor(partial: Partial<CreateLessonDto>) {
    Object.assign(this, partial);
  }
}

export { CreateLessonDto };
