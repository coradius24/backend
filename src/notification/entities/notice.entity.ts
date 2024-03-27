import { NotificationReceiver } from 'src/notification/enums/notification.enums';
import { NoticeDepartment } from './notice-department.entity';
import PublicFile from "src/files/entities/publicFile.entity";
import { Column, CreateDateColumn, Entity, JoinColumn,  ManyToOne,  OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'notices'})
export class Notice {
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: 'enum', enum: NotificationReceiver, default: NotificationReceiver.ALL})
    receiverType: string

    @Column({type: 'simple-array', nullable: true})
    receivers: number[]

    @Column({type: 'text'})
    title: string

    @Column({type: 'text', nullable: true})
    body: string

    @OneToOne(() => PublicFile, { nullable: true, eager: true, 
        onUpdate: 'CASCADE',
        
    })
    @JoinColumn({name: 'thumbnailId'})
    thumbnail: PublicFile;


    @Column({type: 'int', nullable: true})
    thumbnailId: number;

    @ManyToOne(() => NoticeDepartment, { nullable: true, eager: true, 
        onUpdate: 'CASCADE',
        
    })
    @JoinColumn({name: 'departmentId'})
    department: NoticeDepartment;


    @Column({type: 'int', nullable: true})
    departmentId: number;

    @Column({type: 'int', nullable: true})
    createdBy: number;

    @Column({type: 'boolean', default: false})
    isScheduled: boolean

    @Column({type: 'datetime', nullable: true})
    deliveryTime: Date

    @CreateDateColumn()
    createdAt: Date

}
