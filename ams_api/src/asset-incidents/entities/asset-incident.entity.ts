import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToOne,
} from 'typeorm';
import { Asset } from '../../assets/entities/asset.entity';
import { User } from '../../users/entities/user.entity';
import { AssetRequest } from '../../assets-requests/entities/assets-request.entity';

@Entity('asset_incidents')
export class AssetIncident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reported_by_id' })
  reported_by: User;

  @Column({ type: 'enum', enum: ['BROKEN', 'MISSING'] })
  incident_type: string;

  @Column({ type: 'varchar', nullable: true })
  location: string;

  @Column('text')
  issue_description: string;

  @Column({ type: 'text', nullable: true })
  evidence_url: string;

  @Column({
    type: 'enum',
    enum: [
      'PENDING',
      'IN_REPAIR',
      'RESOLVED_FIXED',
      'RESOLVED_REPLACED',
      'REJECTED_LIABILITY',
      'CEO_REVIEW',
    ],
    default: 'PENDING',
  })
  status: string;

  @Column('numeric', { precision: 12, scale: 2, nullable: true })
  penalty_amount: number;

  @Column({ type: 'text', nullable: true })
  resolution_notes: string;

  @Column({ type: 'text', nullable: true })
  ceo_remarks: string;

  @OneToOne(() => AssetRequest, { nullable: true })
  @JoinColumn({ name: 'replacement_request_id' })
  replacement_request: AssetRequest;

  @Column({ type: 'timestamp', nullable: true })
  penalty_resolved_at: Date | null;

  @CreateDateColumn()
  reported_at: Date;
}
