import { Column, Entity,  PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'featureUserMap'})
export class FeatureUserMap {
    @PrimaryGeneratedColumn()
    id: number

    // @ManyToOne(() => Feature)
    // @JoinColumn({name: 'featureId'})
    // feature: Feature

    @Column({type: "varchar", length: 100})
    featureId: string

    @Column({ type: 'int' })
    userId: number;
}
