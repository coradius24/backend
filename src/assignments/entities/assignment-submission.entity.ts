import { AssignmentSubmissionStatus } from './../enums/assignment.enum';
import { User } from 'src/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import PublicFile from 'src/files/entities/publicFile.entity';

@Entity({
    name: 'assignment_submissions'
})
export class AssignmentSubmission {
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: 'int'})
    assignmentId: number

    @ManyToOne(() => User, {
        onUpdate: 'CASCADE',
        
    })
    @JoinColumn({name: 'userId'})
    user: User

    @Column({type: 'int'})
    userId: number

    @Column({type: 'int'})
    courseId: number

    @ManyToMany(() => PublicFile, { eager: false, nullable: true })
    @JoinTable()
    attachments: PublicFile[];
  
    @Column({type: 'enum', enum: AssignmentSubmissionStatus})
    status: string

    @Column({type: 'longtext', nullable: true})
    remarks: string

    @Column({type: 'longtext', nullable: true})
    submissionNote: string

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}

