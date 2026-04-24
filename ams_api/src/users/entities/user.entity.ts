import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Department } from '../../departments/entities/department.entity';
import { AssetAssignment } from 'src/assets-assignments/entities/assets-assignment.entity';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  full_name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password_hash: string;

  @Column({ nullable: true })
  provisioning_password: string;

  @Column()
  role: string; // 'Staff', 'HOD', 'Admin and Finance Director', 'Finance Officer', 'Operations Officer', 'SYSTEM_ADMIN', 'Office of the CEO'

  @Column({ nullable: true })
  job_title: string;

  @Column({ nullable: true })
  phone_number: string;

  @ManyToOne(() => Department, (dept) => dept.users)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @OneToMany(() => AssetAssignment, (assignment) => assignment.user)
  asset_assignments: AssetAssignment[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.INACTIVE,
  })
  status: UserStatus;
}
