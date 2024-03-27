import { KYC_DOCUMENT_TYPE } from './../enums/user.enums';
import PublicFile from 'src/files/entities/publicFile.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from 'typeorm';


@Entity({ name: 'KycDocuments' })
export class KycDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'boolean', default: false})
  isDocumentValid: boolean

  @Column({ type: 'int' })
  userId: number;

  @Column({type: 'enum', enum: KYC_DOCUMENT_TYPE, nullable: true}) 
  documentType: string
  
  @JoinColumn()
  @ManyToOne(
    () => PublicFile,
    {
      eager: true,
      nullable: true,
      onUpdate: 'CASCADE',
      
    }
  )
  frontPhoto: PublicFile

  @Column('int', { nullable: true })
  frontPhotoId: number


  @JoinColumn()
  @ManyToOne(
    () => PublicFile,
    {
      eager: true,
      nullable: true,
      onUpdate: 'CASCADE',
      
    }
  )
  backPhoto: PublicFile

  @Column('int', { nullable: true })
  backPhotoId: number


}
