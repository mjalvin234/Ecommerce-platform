import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('tiered_prices')
@Index('idx_tiered_prices_inventory', ['inventoryId'])
export class TieredPrice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inventory_id', type: 'varchar' })
  inventoryId: string;

  @ManyToOne('Inventory')
  @JoinColumn({ name: 'inventory_id' })
  inventory: any;

  @Column({ name: 'min_quantity', type: 'integer' })
  minQuantity: number;

  @Column({ name: 'max_quantity', type: 'integer', nullable: true })
  maxQuantity: number | null;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2 })
  unitPrice: number;

  @Column({ name: 'discount_rate', type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountRate: number | null;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
