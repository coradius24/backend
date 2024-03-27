import { Column, Entity,  PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'blogCategories'})
export class BlogCategory {
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: 'varchar', length: 100})
    name: string

    @Column({type: 'varchar', length: 16})
    colorCode: string
    
}
