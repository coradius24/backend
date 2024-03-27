import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn   } from "typeorm";

@Entity()
export class ToolsAccess{
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: 'int'})
    toolId: number
    
    @ManyToOne(() => User, {eager: true})
    @JoinColumn({name: 'userId'})
    user: User

    @Column({type: 'int'})
    userId: number

    @CreateDateColumn()
    createdAt: Date 

    @Column({type: 'boolean', default: true})
    isSystemGiven: boolean

    @Column({type: 'int', nullable: true})
    givenByUser: number

}