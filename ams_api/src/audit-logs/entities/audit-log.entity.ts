import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;
  @Column()
  action: string;

  @Column()
  table_name: string;

  @Column({ type: 'uuid' })
  record_id: string;
  @CreateDateColumn({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'jsonb', nullable: true })
  old_values: any;

  @Column({ type: 'jsonb', nullable: true })
  new_values: any;
}
