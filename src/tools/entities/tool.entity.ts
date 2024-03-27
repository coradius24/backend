import PublicFile from "src/files/entities/publicFile.entity";
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Tools {
    @PrimaryGeneratedColumn({ type: 'int' })
    id: number;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 20 }) // Adjust length as needed
    type: string;

    @Column({ type: 'varchar', length: 20 }) // Adjust length as needed
    ownershipType: string;

    @Column({ type: 'text', nullable: true })
    link: string;

    @Column({ type: 'simple-array', nullable: true })
    courseId: number[];

    @Column({ type: 'boolean', default: false })
    isFree: boolean;

    @OneToOne(
        () => PublicFile,
        {
            eager: true,
            nullable: true,
            
        }
    )
    @JoinColumn({name: 'thumbnailId'})
    thumbnail: PublicFile;

    @Column({type: 'int', nullable: true}) 
    thumbnailId: number

}
