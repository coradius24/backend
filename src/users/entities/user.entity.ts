import PublicFile from 'src/files/entities/publicFile.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { PASSWORD_VERSION, ROLE, USER_STATUS } from '../enums/user.enums';
import { Profile } from './profile.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true, 
  })
  fullName: string;


  @Column({
    type: 'varchar',
    length: 50,
    nullable: true, // Make email nullable
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true, // Make password nullable
  })
  password: string;

  @Column({
    type: 'enum',
    enum: PASSWORD_VERSION,
    default: PASSWORD_VERSION.sha256,
  })
  passwordVersion: PASSWORD_VERSION;

  @Column({ type: 'datetime', nullable: true })
  lastPasswordChanged: Date;

  @Column({
    type: 'int',
    default: 0,
  })
  role: number;

  
  @Column({
    type: 'enum',
    enum: USER_STATUS,
    default: USER_STATUS.notVerified,
    nullable: true, // Make status nullable
  })
  status: USER_STATUS;

  @Column({
    type: 'text',
    nullable: true, // Make mobileNumber nullable
  })
  mobileNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => Profile, (profile) => profile.userId, {
    onUpdate: 'CASCADE',
    
  })
  @JoinColumn({ name: 'profileId' })
  profile: Profile;

  @Column({
    type: 'int',
    nullable: true,
  })
  profileId: number;

  @JoinColumn()
  @OneToOne(
    () => PublicFile,
    {
      eager: true,
      nullable: true,
      onUpdate: 'CASCADE',
      
    }
  )
  photo: PublicFile

  @Column('int', { nullable: true })
  photoId: number

  @Column('json', { nullable: true })
  federated: { facebook: string; google: string; };

  @Column({type: 'boolean', default: false})
  isKycVerified: boolean
}
