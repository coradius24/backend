import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { NotificationReceiver, NotificationType } from "../enums/notification.enums";

@Entity({name: 'notification'})
export class Notification {
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: 'varchar', length: 100})
    notificationType: string

    @Column({type: 'text',  nullable: true})
    linkOrId?: string


    @Column({type: 'varchar', length: 100})
    receiverType: string

    @Column({type: 'simple-array', nullable: true})
    receivers: number[]

    @Column({type: 'text'})
    message: string


    @Column({type: 'varchar', length: 66, nullable: true})
    body: string

    @Column({type: 'boolean', default: false})
    isScheduled: boolean

    @Column({type: 'datetime', nullable: true})
    deliveryTime: Date

    @CreateDateColumn()
    createdAt: Date

}
