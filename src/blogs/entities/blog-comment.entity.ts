import { BlogCommentStatus } from './../enums/blog.enum';
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity,  JoinColumn,  ManyToOne,  PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Blog } from './blog.entity';

@Entity({name: 'blogComments'})
export class BlogComment {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => User, {eager: true, nullable: true,       
        onUpdate: 'CASCADE',
        
    })
    @JoinColumn({name: 'userId'})
    user: User

    @Column({type: 'int'})
    userId: number

    @Column({type: 'longtext'}) 
    comment: string

    @ManyToOne(() => Blog,  {eager: false, nullable: true})
    @JoinColumn({name: 'blogId'})
    blog: Blog

    @Column({type: 'int'})
    blogId: number

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

    @Column({type: 'enum', enum: BlogCommentStatus, default: BlogCommentStatus.APPROVED })
    status: string

}
