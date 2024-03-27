import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'features'})
export class Feature {
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: 'varchar', length: 50, nullable: true})
    name?: string

    @Column({type: "text", nullable: true})
    frontendUrl?: string

    @Column({type: "text", nullable: true})
    frontendSectionGroup?: string

    @Column({type: "text", nullable: true})
    endpoint?: string

    @Column({type: "text", nullable: true})
    HTTPMethod?: string

    @Column({ type: 'int', nullable: true })
    parent?: number;

}
