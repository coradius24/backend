import PublicFile from "src/files/entities/publicFile.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity({
    name: 'galleryImages'
})
export class GalleryImage {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: 'varchar',
        length: 150,
        nullable: true
    })
    caption: string

  
    @Column({
        type: 'int'
    })
    albumId: number

    @JoinColumn({
        name: 'photoId' 
    })
    @OneToOne(()=> PublicFile , {eager: true, nullable: true})
    photo: PublicFile

    @Column({
        type: 'int',
        nullable: true
    })
    photoId: number

    @CreateDateColumn()
    createdAt: Date

}

