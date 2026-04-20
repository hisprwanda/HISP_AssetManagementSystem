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

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reported_by_id' })
  reported_by: User;

  @Column({ type: 'enum', enum: ['BROKEN', 'MISSING'] })
  incident_type: string;

  @Column({ type: 'enum', enum: ['WORK', 'HOME', 'OTHER'], nullable: true })
  location: string;

  @Column('text')
  explanation: string;

  @Column({ type: 'text', nullable: true })
  evidence_url: string;

  @Column({
    type: 'enum',
    enum: ['INVESTIGATING', 'CEO_REVIEW', 'ACCEPTED', 'DENIED'],
    default: 'INVESTIGATING',
  })
  investigation_status: string;

  @Column('numeric', { precision: 12, scale: 2, nullable: true })
  penalty_amount: number;

  @Column({ type: 'text', nullable: true })
  investigation_remarks: string;

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
