import { Course } from "src/courses/entities/course.entity";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne,  PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { PaymentMethod, PaymentStatus } from "../enums/payments.enum";

@Entity({name: 'payments'})
export class Payment {
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: 'int'})
    mainPrice: number

    @Column({type: 'int'})
    amount: number

    @Column({type: 'varchar', length: 100, nullable: true})
    couponApplied: string

    @Column({type: 'int'})
    discountAmount: number

    @Column({type: 'int'})
    due: number

    @Column({type: 'boolean', default: false})
    isFullPaid: boolean

    @Column({type: 'enum', enum: PaymentMethod})
    paymentMethod: string

    @Column({nullable: true})
    bankName: string


    @ManyToOne(() => Course)
    @JoinColumn({name: 'courseId'}) 
    course: Course

    @Column({type: 'int', nullable: false})
    courseId: number

    @ManyToOne(() => User, {
        onUpdate: 'CASCADE',
        
    })
    @JoinColumn({
        name: 'userId',
    }) 
    user: User

    @Column({type: 'int'})
    userId: number

    @Column({type: 'enum', enum: PaymentStatus, default: PaymentStatus.INITIALIZED})
    paymentStage: string

    @Column({type: 'varchar', length: 100, nullable: true})
    transactionId?: string

    @Column({type: 'int', nullable: true})
    manuallyInsertedBy?: number

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

}
