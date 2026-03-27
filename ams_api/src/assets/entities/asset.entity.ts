import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Category } from 'src/categories/entities/category.entity';
import { Department } from 'src/departments/entities/department.entity';
import { User } from 'src/users/entities/user.entity';
import { AssetAssignment } from 'src/assets-assignments/entities/assets-assignment.entity';

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  tag_id: string;

  @Column({ unique: true })
  serial_number: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['IN_STOCK', 'ASSIGNED', 'UNDER_REPAIR', 'MISSING', 'DISPOSED'],
    default: 'IN_STOCK',
  })
  status: string;

  @Column({ type: 'date', nullable: true })
  purchase_date: Date;

  @Column('numeric', { precision: 12, scale: 2, nullable: true })
  purchase_cost: number;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'date', nullable: true })
  warranty_expiry: Date;
  @Column('numeric', { precision: 12, scale: 2, nullable: true })
  disposal_value: number;

  @Column({ type: 'date', nullable: true })
  disposal_date: Date;

  @Column({ type: 'text', nullable: true })
  disposal_reason: string;

  @ManyToOne(() => Category, (category) => category.assets)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => Department, (department) => department.assets)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to_user_id' })
  assigned_to?: User | null;

  @OneToMany(() => AssetAssignment, (assignment) => assignment.asset)
  assignment_history: AssetAssignment[];
}
