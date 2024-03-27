import { Column, Entity,  PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'noticeDepartments'})
export class NoticeDepartment {
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: 'varchar', length: 50})
    name: string
}
