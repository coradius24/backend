import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'subscribedTopics'})
export class SubscribedTopic {
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: 'int', nullable: true}) 
    tokenId: number

    @Column({type: 'int'}) 
    userId: number
    
    @Column({type: 'varchar', length: 250})
    topic: string
}