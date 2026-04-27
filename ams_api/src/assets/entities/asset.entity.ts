import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from 'src/categories/entities/category.entity';
import { Department } from 'src/departments/entities/department.entity';
import { User } from 'src/users/entities/user.entity';
import { AssetAssignment } from 'src/assets-assignments/entities/assets-assignment.entity';

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, nullable: false })
  tag_id: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  serial_number: string | null;

  @Column({ type: 'varchar' })
  name: string;

  @Column('text', { nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: [
      'IN_STOCK',
      'ASSIGNED',
      'BROKEN',
      'MISSING',
      'DISPOSED',
      'RETURN_PENDING',
    ],
    default: 'IN_STOCK',
  })
  status: string;

  @Column({ type: 'date', nullable: true })
  purchase_date: Date;

  @Column('numeric', { precision: 12, scale: 2, nullable: true })
  purchase_cost: number;

  @Column({ type: 'varchar', nullable: true })
  location: string | null;

  @Column({ type: 'date', nullable: true })
  warranty_expiry: Date;
  @Column('numeric', { precision: 12, scale: 2, nullable: true })
  disposal_value: number;

  @Column({ type: 'date', nullable: true })
  disposal_date: Date;

  @Column({ type: 'text', nullable: true })
  disposal_reason: string;

  @Column('numeric', { precision: 12, scale: 2, default: 0 })
  current_value: number;

  @Column('numeric', { precision: 12, scale: 2, default: 0 })
  accumulated_depreciation: number;

  @Column({ type: 'varchar', nullable: true })
  category_id: string | null;

  @ManyToOne(() => Category, (category) => category.assets, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @Column({ type: 'varchar', nullable: true })
  department_id: string | null;

  @ManyToOne(() => Department, (department) => department.assets, {
    nullable: true,
  })
  @JoinColumn({ name: 'department_id' })
  department: Department | null;

  @Column({ type: 'varchar', nullable: true })
  assigned_to_user_id: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_to_user_id' })
  assigned_to?: User | null;

  @Column({ type: 'boolean', default: false })
  is_shared: boolean;

  @OneToMany(() => AssetAssignment, (assignment) => assignment.asset)
  assignment_history: AssetAssignment[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
