import PublicFile from "src/files/entities/publicFile.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity({
    name : 'albums'
})
export class Album {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: 'varchar', 
        length: 150
    })
    name: string

    @Column({
        type: 'varchar', 
        length: 500
    })
    shortDescription: string


    @Column({
        type: 'varchar', 
        length: 150
    })
    slug: string

    @JoinColumn({
        name: 'thumbnailId' 
    })
    @OneToOne(()=> PublicFile , {eager: true, nullable: true})
    thumbnail: PublicFile

    @Column({
        type: 'int',
        nullable: true
    })
    thumbnailId: number


    @CreateDateColumn()
    createdAt: Date


}
