import PublicFile from "src/files/entities/publicFile.entity";
import { Column, Entity, PrimaryGeneratedColumn, JoinColumn, OneToOne } from "typeorm";

@Entity({name: 'teamMembers'})
export class TeamMember {
    @PrimaryGeneratedColumn() 
    id: number

    @Column() 
    fullName: string

    @Column({nullable: true, default: ""}) 
    name: string

    @Column('json', { nullable: true })
    socialLinks: { facebook: string; twitter: string; linkedin: string };
    
    @Column({ type: 'text', nullable: true })
    title: string;

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

    @Column({type: 'boolean', default: true}) 
    isPublic: boolean

    @Column({type: 'int', nullable: false})
    serialNumber: number
}
