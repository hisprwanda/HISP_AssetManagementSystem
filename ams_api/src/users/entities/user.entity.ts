import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Department } from '../../departments/entities/department.entity';
import { AssetAssignment } from 'src/assets-assignments/entities/assets-assignment.entity';

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

  @Column()
  role: string; // 'Staff', 'HOD', 'Admin and Finance Director', 'Finance Officer', 'Operations Officer', 'SYSTEM_ADMIN', 'Office of the CEO'

  @ManyToOne(() => Department, (dept) => dept.users)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @OneToMany(() => AssetAssignment, (assignment) => assignment.user)
  asset_assignments: AssetAssignment[];
}
