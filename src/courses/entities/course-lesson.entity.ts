import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { CourseSection } from './course-section.entity';

@Entity({name: 'lessons'})
export class Lesson {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string;

  @Column({ type: 'int', nullable: true })
  courseId: number;


  @ManyToOne(() => CourseSection) 
  @JoinColumn({ name: 'sectionId' }) 
  section: CourseSection;

  @Column({ type: 'int', nullable: true })
  sectionId: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  videoType: string;

  @Column({ type: 'int', nullable: true })
  cloudVideoId: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  videoUrl: string;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date; 
  
  @Column({ type: 'varchar', length: 255, nullable: true })
  lessonType: string;

  @Column({ type: 'longtext', nullable: true })
  attachment: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  attachmentType: string;

  @Column({ type: 'longtext', nullable: true})
  summary: string;

  @Column({ type: 'boolean', default: false })
  isFree: boolean;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'bigint', default: 0 })
  durationInSecond: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  rewardCoupon: string;
  
}
