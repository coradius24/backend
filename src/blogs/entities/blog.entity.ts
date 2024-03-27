import { BlogCategory } from './blog-category.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from 'src/users/entities/user.entity';
import PublicFile from 'src/files/entities/publicFile.entity';

@Entity({name: 'blogs'})
export class Blog {
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: 'text'})
    title: string

    @Column({type: 'text'})
    slug: string

    @Column({type: 'longtext'})
    body: string

    @ManyToOne(() => BlogCategory,  {eager: true})
    @JoinColumn({name: 'categoryId'})
    category: BlogCategory

    @Column({type: 'int'})
    categoryId: number


    @ManyToOne(() => User ,{
        eager: true,         
        // cascade: true,
        onUpdate: 'CASCADE',
        
    })
    @JoinColumn({name: 'authorId'})
    author: User

    @Column({type: 'int', })
    authorId: number

    @ManyToOne(() => PublicFile, {eager: true, nullable: true})
    @JoinColumn({name: 'thumbnailId'})
    thumbnail: PublicFile

    @Column({type: 'int', nullable: true})
    thumbnailId: number

    @Column({type: 'varchar', default: 'active'})
    status: string

    @CreateDateColumn()
    createdAt: Date

    @Column({type: 'text', nullable: true})
    metaDescription: string

    @Column({type: 'text', nullable: true})
    metaKeywords: string

    @UpdateDateColumn()
    updatedAt: Date
}
