import { User } from "src/users/entities/user.entity";
import { Column, JoinColumn, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'featuredInstructors'})
export class FeaturedInstructor {
    @PrimaryGeneratedColumn() 
    id: number

    @OneToOne(() => User)
    @JoinColumn({name: 'userId'})
    user: User

    @Column({type:'int'})
    userId: number

    @Column({type:'int'})
    serialNumber: number
}
