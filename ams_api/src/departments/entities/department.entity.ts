import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Asset } from '../../assets/entities/asset.entity';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  type: string; // 'Directorate' or 'Country Portfolio'

  @Column({ default: 'Active' })
  status: string; // 'Active' or 'Inactive'

  @OneToMany(() => User, (user) => user.department)
  users: User[];

  @OneToMany(() => Asset, (asset) => asset.department)
  assets: Asset[];
}
