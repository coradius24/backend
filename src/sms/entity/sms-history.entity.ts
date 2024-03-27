import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { SmsReceiver } from "../enums/sms.enums";

@Entity({name: 'smsHistories'})
export class SmsHistory{
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: 'text'})
    text: string

    @Column({type: 'enum', enum: SmsReceiver, default: SmsReceiver.INDIVIDUAL_USERS})
    reviverGroup: string

    @Column({type: 'simple-array', nullable: true})
    receivers: number[]

    @Column({type: 'boolean', default: false})
    isScheduled: boolean

    @Column({type: 'datetime', nullable: true})
    deliveryTime: Date

    @CreateDateColumn()
    createdAt: Date


}