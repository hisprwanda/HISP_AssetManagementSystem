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

export interface PurchaseOrderData {
  vendor_details?: string;
  order_date?: string;
  po_number?: string;
  payment_terms?: string;
  special_instructions?: string;
  period_of_performance?: string;
  shipping_cost?: number;
  other_cost?: number;
  grand_total?: number;
  hisp_sign_name?: string;
  hisp_sign_date?: string;
  vendor_sign_name?: string;
  vendor_sign_date?: string;
  authorized_by?: string;
  bill_to?: string;
  ship_to?: string;
  scanned_po_url?: string;
  is_digitally_signed?: boolean;
  [key: string]: unknown;
}

@Entity('assets_requests')
export class AssetRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  batch_number: string;

  @Column({
    type: 'enum',
    enum: [
      'PENDING',
      'PENDING_FORMALIZATION',
      'HOD_APPROVED',
      'APPROVED',
      'CEO_REVIEW',
      'CEO_APPROVED',
      'ORDERED',
      'REJECTED',
      'FULFILLED',
    ],
    default: 'PENDING',
  })
  status: string;

  @Column({
    type: 'enum',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM',
  })
  urgency: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
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

  @Column({ type: 'jsonb', nullable: true })
  purchase_order: PurchaseOrderData;

  @Column({ type: 'boolean', default: false })
  is_shared: boolean;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'verified_by_finance_id' })
  verified_by_finance: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
