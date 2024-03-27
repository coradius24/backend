import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
 
@Entity({name: 'public_files'})
class PublicFile {
  @PrimaryGeneratedColumn()
  public id: number;
 
  @Column()
  public url: string;
 
  @Column()
  public key: string;
}
 
export default PublicFile;
