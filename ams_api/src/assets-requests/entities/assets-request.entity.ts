import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Entity('asset_requests')
export class AssetRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verified_by_finance_id' })
  verified_by_finance: User;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  budget_code: string;

  @Column({
    type: 'enum',
    enum: [
      'PENDING',
      'HOD_INITIATED',
      'FINANCE_VERIFIED',
      'CEO_APPROVED',
      'REJECTED',
    ],
    default: 'PENDING',
  })
  status: string;

  @Column('text', { nullable: true })
  ceo_remarks: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
