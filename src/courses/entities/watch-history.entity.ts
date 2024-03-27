import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({name: 'watch_histories'})
export class WatchHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  userId: number;
  
  @Column({ type: 'int', nullable: false })
  courseId: number;

  @Column({ type: 'int' })
  sectionId: number;

  @Column({ type: 'int' })
  lessonId: number;

  @Column({ type: 'boolean' })
  isCompleted: boolean;

  @Column({ type: 'int' })
  watchTimeInSecond: number;

  // @Column({ type: 'int', default: 0 })
  // completePercentage: number;

  @CreateDateColumn()
  createdAt: Date


  @UpdateDateColumn()
  updatedAt: Date; 

}
