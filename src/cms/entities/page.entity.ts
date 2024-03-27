import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({name: 'pages'})
export class Page {
    @PrimaryColumn() 
    id: string

    @Column({ type: 'json', nullable: true })
    content: Record<string, any>

}
