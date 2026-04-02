import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Department } from '../../departments/entities/department.entity';

@Entity('assets_requests')
export class AssetRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'HOD_APPROVED', 'APPROVED', 'REJECTED', 'FULFILLED'],
    default: 'PENDING',
  })
  status: string;

  @Column({
    type: 'enum',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM',
  })
  urgency: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requested_by_id' })
  requested_by: User;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ type: 'jsonb' })
  items: any[];

  @Column({ type: 'jsonb' })
  financials: Record<string, any>;

  @Column({ type: 'jsonb' })
  logistics: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  ceo_remarks: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verified_by_finance_id' })
  verified_by_finance: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
