import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Asset } from '../../assets/entities/asset.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('asset_assignments')
export class AssetAssignment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Asset, (asset) => asset.assignment_history, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'asset_id' })
    asset: Asset;

    @ManyToOne(() => User, (user) => user.asset_assignments)
    @JoinColumn({ name: 'user_id' })
    user: User;


    @CreateDateColumn()
    assigned_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    returned_at: Date;

    @Column({ type: 'text', nullable: true })
    condition_on_assign: string;
}