import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Asset } from '../../assets/entities/asset.entity';
import { User } from '../../users/entities/user.entity';

@Entity('assets_assignments')
export class AssetAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Asset, (asset) => asset.assignment_history)
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @ManyToOne(() => User, (user) => user.asset_assignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  assigned_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  returned_at: Date | null;

  @Column({ type: 'text', nullable: true })
  condition_on_assign: string | null;

  @Column({ type: 'text', nullable: true })
  condition_on_return: string | null;

  @Column({ type: 'varchar', nullable: true })
  form_number: string | null;

  @Column({
    type: 'enum',
    enum: [
      'DRAFT',
      'PENDING_USER_SIGNATURE',
      'PENDING_ADMIN_REVIEW',
      'APPROVED',
      'REJECTED',
    ],
    default: 'DRAFT',
  })
  form_status: string;

  @Column({ type: 'varchar', nullable: true })
  received_from_name: string | null;

  @Column({ type: 'timestamp', nullable: true })
  received_at: Date | null;

  @Column({ type: 'varchar', nullable: true })
  user_signature_name: string | null;

  @Column({ type: 'timestamp', nullable: true })
  user_signed_at: Date | null;

  @Column({ type: 'varchar', nullable: true })
  admin_signature_name: string | null;

  @Column({ type: 'timestamp', nullable: true })
  admin_signed_at: Date | null;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string | null;

  @Column({ type: 'varchar', nullable: true })
  scanned_form_url: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
