import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Asset } from '../../assets/entities/asset.entity';
import { RequestableItem } from '../../requestable-items/entities/requestable-item.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;
  @Column('decimal', { precision: 5, scale: 2 })
  depreciation_rate: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  disposal_rate: number;

  @OneToMany(() => Asset, (asset) => asset.category)
  assets: Asset[];

  @OneToMany(() => RequestableItem, (item) => item.category)
  requestable_items: RequestableItem[];
}
