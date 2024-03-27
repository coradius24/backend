import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity({ name: 'profiles' })
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'longtext', nullable: true })
  skills: string;



  @Column({ type: 'longtext', nullable: true })
  biography: string;

  @Column('json', { nullable: true })
  socialLinks: { facebook: string; twitter: string; linkedin: string };
  
  @Column({ type: 'longtext', nullable: true })
  title: string;

  @Column({ type: 'datetime', nullable: true })
  dateOfBirth: Date;

  // @OneToOne(() => User, (user) => user.profile)
  // @JoinColumn({ name: 'userId' })
  // user: User;

  @Column({ type: 'int' })
  userId: number;
}
