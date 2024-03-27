import { Course } from 'src/courses/entities/course.entity';
import { ReviewAttachmentType, ReviewStatus } from './../enums/review.enums';
import { User } from '../../users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne, OneToOne, CreateDateColumn } from 'typeorm';
import PublicFile from 'src/files/entities/publicFile.entity';

@Entity({name: 'reviews'})
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.id, {
    nullable: true,
    eager: true,
    onUpdate: 'CASCADE',
    
  })
  @JoinColumn({name:'userId'})
  user: User;
  
  @Column({ type: 'int', nullable: true })
  userId: number;

  @Column({ type: 'int', nullable: true })
  mainCourseId: number;

  @Column({ type: 'int', nullable: true })
  batchCourseId: number;

  @ManyToOne(() => Course, {eager: false, nullable: true,       
    onUpdate: 'CASCADE',
  })

  @JoinColumn({name: 'batchCourseId'})
  course: Course


  @Column({ type: 'int', default: 0 })
  rating: number;

  @Column({ type: 'longtext',  nullable: true, })
  comment: string;

  @Column({ type: 'varchar', length: 100, nullable: true, })
  reviewerName: string;

  @OneToOne(() => PublicFile, { nullable: true, eager: true})
  @JoinColumn()
  attachment: PublicFile;

  @OneToOne(() => PublicFile, { nullable: true, eager: true})
  @JoinColumn()
  videoThumbnail: PublicFile;

  @Column({type: 'enum', enum: ReviewAttachmentType, default: ReviewAttachmentType.IMAGE })
  attachmentType: string

  @OneToOne(() => PublicFile, { nullable: true, eager: true})
  @JoinColumn()
  reviewerPhoto: PublicFile;

  @Column({type: "enum", enum: ReviewStatus})
  status: string

  @Column({type: "boolean", default: false})
  isFeatured: boolean

  @CreateDateColumn()
  createdAt: Date
}
