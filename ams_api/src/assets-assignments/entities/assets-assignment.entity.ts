import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Asset } from '../../assets/entities/asset.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('asset_assignments')
export class AssetAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Asset, (asset) => asset.assignment_history, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @ManyToOne(() => User, (user) => user.asset_assignments)
  @JoinColumn({ name: 'user_id' })
  user: User;

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

  @Column({ type: 'varchar', nullable: true, unique: true })
  form_number: string;

  @Column({ type: 'varchar', nullable: true })
  admin_signature_name: string;

  @Column({ type: 'timestamp', nullable: true })
  admin_signed_at: Date;

  @Column({ type: 'varchar', nullable: true })
  user_signature_name: string;

  @Column({ type: 'timestamp', nullable: true })
  user_signed_at: Date;

  @Column({ type: 'varchar', nullable: true })
  received_from_name: string;

  @Column({ type: 'timestamp', nullable: true })
  received_at: Date;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  @CreateDateColumn()
  assigned_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  returned_at: Date;

  @Column({ type: 'text', nullable: true })
  condition_on_assign: string;
}
