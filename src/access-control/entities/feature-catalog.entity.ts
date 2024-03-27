import { ROLE } from "src/users/enums/user.enums";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Feature } from "./feature.entity";

@Entity({name: 'featureCatalogs'})
export class FeatureCatalog {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => Feature, {eager: true})
    @JoinColumn({name: 'featureId'})
    feature: Feature

    @Column({type: "int"})
    featureId: number

    @Column({ type: 'enum', enum: ROLE })
    role: number;

}
