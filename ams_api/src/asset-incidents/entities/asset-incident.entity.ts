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

  @Column('text')
  explanation: string;

  @Column({ nullable: true })
  evidence_url: string;

  @Column({
    type: 'enum',
    enum: ['INVESTIGATING', 'ACCEPTED', 'DENIED'],
    default: 'INVESTIGATING',
  })
  investigation_status: string;

  @Column('numeric', { precision: 12, scale: 2, nullable: true })
  penalty_amount: number;

  @OneToOne(() => AssetRequest, { nullable: true })
  @JoinColumn({ name: 'replacement_request_id' })
  replacement_request: AssetRequest;

  @CreateDateColumn()
  reported_at: Date;
}
