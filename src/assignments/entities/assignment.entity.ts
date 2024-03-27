import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({
    name: 'assignments'
})
export class Assignment {
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: 'text'})
    name: string


    @Column({type: 'longtext'})
    description: string

    @Column({type: 'int'})
    courseId: number

    @CreateDateColumn()
    createdAt: Date
}

