import PublicFile from "src/files/entities/publicFile.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'courseCertificates'})
export class CourseCertificate {
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: 'int'})
    userId: number

    @Column({type: 'varchar', length: 16})
    credentialId: string

    @Column({type: 'int'})
    courseId: number

    @JoinColumn({name:'fileId'})
    @OneToOne(
      () => PublicFile,
      {
        eager: true,
        nullable: true,
        onUpdate: 'CASCADE',
      }
    )
    file: PublicFile

    @Column()
    fileId: number

    @CreateDateColumn()
    createdAt: Date
}
