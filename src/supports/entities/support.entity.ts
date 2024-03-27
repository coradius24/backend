import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'supports'})
export class Support {
    @PrimaryGeneratedColumn({type: 'int'})
    id: number

    @Column({type: 'int'})
    userId: number

    @Column({type: 'varchar', length: 250})
    email: string

    @Column({type: 'varchar', length: 50})
    supportBoard: string

    @CreateDateColumn()
    createdAt: Date
}
