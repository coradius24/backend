import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({
    name: 'preRegistrations'
})
export class PreRegistration {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'int', nullable: true })
    userId: number;

    @Column({ type: 'longtext', nullable: true, })
    comment: string;

    @Column({ type: 'varchar', length: 100, nullable: true, })
    fullName: string;

    @Column({ type: 'varchar', length: 50, nullable: true, })
    email: string;

    @Column({ type: 'varchar', length: 18, nullable: true, })
    mobileNumber: string;

    @Column({ type: 'boolean', default: false })
    isArchived: boolean;

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

}
