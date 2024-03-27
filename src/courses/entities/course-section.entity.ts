import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn } from 'typeorm';
import { Lesson } from './course-lesson.entity';

@Entity({name: 'sections'})
export class CourseSection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true, collation: 'utf8mb3_unicode_ci' })
  title: string;

  @Column({ type: 'int', nullable: true })
  courseId: number;

  @Column({ type: 'int', default: 0 })
  order: number;

  @OneToMany(() => Lesson, (lesson) => lesson.section, {
    cascade: true,
    
    onUpdate: 'CASCADE'
  })
  lessons: Lesson[];


}
