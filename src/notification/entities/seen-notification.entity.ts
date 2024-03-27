import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({name: 'seenNotifications'})
export class SeenNotification {
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: 'int'})
    userId: number

    @Column({type: 'int'})
    count: number

    @UpdateDateColumn()
    updatedAt: Date

}
