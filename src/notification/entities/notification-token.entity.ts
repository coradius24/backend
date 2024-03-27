import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'notificationTokens'})
export class NotificationToken{
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: 'int'})
    userId: number

    @Column({type: 'text'})
    token: string

    @Column({type: 'varchar', nullable: true})
    device: string

    @Column({
        default: 'active',
    })
    status: string;
    
}