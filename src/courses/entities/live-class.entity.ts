import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { Course } from './course.entity';

@Entity({name:"live_classes"})
export class LiveClass {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Course, {
    nullable: true,
    eager: false
  })
  @JoinColumn({
    name: 'courseId'
  })
  course: Course

  @Column({ type: 'int', nullable: true })
  courseId: number | null;

  @Column({ type: 'datetime', nullable: true })
  dateTime: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true, collation: 'utf8mb3_general_ci' })
  zoomMeetingId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, collation: 'utf8mb3_general_ci' })
  zoomMeetingPassword: string | null;

  @Column({ type: 'longtext', collation: 'utf8mb3_general_ci', nullable: true })
  noteToStudents: string | null;

  @Column({ type: 'text', collation: 'utf8mb3_general_ci', nullable: false })
  zoomMeetingLink: string;

  @Column({type: 'boolean', default: false, nullable: true})
  isOnGoing: boolean

  // this column is for track scheduled notification if it need to delete
  @Column({type: 'int', nullable: true})
  notificationId : number
}
