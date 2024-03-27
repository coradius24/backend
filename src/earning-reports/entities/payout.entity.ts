import { PayoutMethod } from './../enums/earning-report.enum';
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { PayoutStatus } from "../enums/earning-report.enum";

@Entity('payouts')
export class Payout {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => User, {
        onUpdate: 'CASCADE',
        
    })
    @JoinColumn({name:'userId'})
    user: User

    @Column({type: 'int'})
    userId: number

    @Column({type: 'int'})
    amount: number

    @Column({type: 'varchar', length: 20})
    accountNumber: string

    @Column({type: 'enum', enum: PayoutMethod})
    payoutMethod: string
    
    @Column({type: 'enum', enum: PayoutStatus, default: PayoutStatus.PENDING })
    status: string

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

    @Column({type: 'boolean', default: false})
    isReviewed:  boolean

    @ManyToOne(() => User, {
        onUpdate: 'CASCADE',
        
    })
    @JoinColumn({name:'reviewerId'})
    reviewer: User

    @Column({type: 'text', nullable: true})
    reviewerMessage: User

    @Column({type: 'int', nullable: true})
    reviewerId?:  number

    @Column({type: 'int', nullable: true})
    actionTaker: number



}
