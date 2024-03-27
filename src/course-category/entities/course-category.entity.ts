// CourseCategory Entity
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import PublicFile from 'src/files/entities/publicFile.entity';
import { Course } from 'src/courses/entities/course.entity';

@Entity({ name: 'course_categories' })
export class CourseCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  colorCode: string;

  @OneToMany(() => Course, (course) => course.category, {
    cascade: true,
    
    onUpdate: 'CASCADE'

  })
  courses: Course[];

  @Column({ type: 'int', nullable: true })
  parent: number;

  @Column({ type: 'varchar', length: 55, nullable: true })
  icon: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  slug: string;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updatedAt: Date;

  @OneToOne(() => PublicFile, { nullable: true, eager: true, 
    cascade: true,
    
    onUpdate: 'CASCADE' })
  @JoinColumn()
  thumbnail: PublicFile;
}
