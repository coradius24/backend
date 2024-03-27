import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDefined, IsEnum } from 'class-validator';
import { ReviewAttachmentType, ReviewStatus } from './../enums/review.enums';

export class CreateReviewDto {
    @ApiPropertyOptional({ default: null })
    userId?: number | null;

    @IsDefined()
    @ApiProperty({ default: null })
    courseId: number;

    @ApiProperty({ default: 5 })
    rating?: number;


    @ApiProperty()
    @IsDefined()
    comment: string;

    @ApiPropertyOptional({ default: null })
    reviewerName?: string;

    @ApiPropertyOptional({
        type: 'string',
        format: 'binary', description: 'Attachment File', required: false
    })
    attachment?: any;

    @ApiPropertyOptional({
        type: 'string',
        format: 'binary', description: 'Attachment File', required: false
    })
    videoThumbnail?: any;

    

    @ApiPropertyOptional({
        default: ReviewAttachmentType.IMAGE
    })
    attachmentType?: string;

    @ApiPropertyOptional({
        type: 'string',
        format: 'binary', description: 'Reviewer Photo File', required: false
    })
    reviewerPhoto?: any;

    @ApiPropertyOptional({})
    isFeatured?: boolean;


    @ApiPropertyOptional({ default: ReviewStatus.PENDING })
    @IsEnum(ReviewStatus)
    status?: string;

}

