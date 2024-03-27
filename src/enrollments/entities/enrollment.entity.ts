import { Course } from "src/courses/entities/course.entity";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'enrollments'})
export class Enrollment {
    @PrimaryGeneratedColumn()
    id: number

    // @Column({type: 'int'})
    @ManyToOne(() => User, { 
        onUpdate: 'CASCADE',
        
    })
    @JoinColumn({name: 'userId'})
    user: User
    @Column({type: 'int', nullable: true})
    userId: number

    @ManyToOne(() => Course, {
        // cascade: true,
        
        onUpdate: 'CASCADE',
    })
    @JoinColumn({name: 'courseId'})
    course: Course

    @Column({type: 'int', nullable: true})
    courseId: number

    @Column({type: 'boolean', default: true})
    bySystem: boolean

    @Column({type: 'int', nullable: true})
    providerId: number

    @CreateDateColumn()
    createdAt: Date
}
