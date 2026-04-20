import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: false })
  is_read: boolean;

  @Column({
    type: 'enum',
    enum: ['CEO_APPROVED', 'CEO_REJECTED', 'INFO', 'ALERT', 'INCIDENT'],
    default: 'INFO',
  })
  type: string;

  @Column({ nullable: true })
  request_id: string;

  @Column({ nullable: true })
  request_title: string;

  @CreateDateColumn()
  created_at: Date;
}
