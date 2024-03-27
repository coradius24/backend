import { ROLE } from "src/users/enums/user.enums";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Feature } from "./feature.entity";

@Entity({name: 'featureRoleMap'})
export class FeatureRoleMap {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => Feature)
    @JoinColumn({name: 'featureId'})
    feature: Feature

    @Column({type: "int"})
    featureId: number

    @Column({ type: 'int' })
    role: number;

}
