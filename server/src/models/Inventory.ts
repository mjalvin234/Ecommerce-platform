import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';

export type InventoryStatus = 'active' | 'inactive' | 'sold_out';

@Entity('inventory')
@Index('idx_inventory_part', ['partNumber'])
@Index('idx_inventory_seller', ['sellerId'])
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'seller_id', type: 'varchar' })
  sellerId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'seller_id' })
  seller: any;

  @Column({ name: 'part_number', type: 'varchar' })
  partNumber: string;

  @Column({ nullable: true, type: 'varchar' })
  brand: string;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ name: 'available_qty', type: 'integer' })
  availableQty: number;

  @Column({ nullable: true, type: 'varchar' })
  year: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ nullable: true, type: 'varchar' })
  eccn: string;

  @Column({ name: 'lead_time', nullable: true, type: 'varchar' })
  leadTime: string;

  @Column({
    type: 'simple-enum',
    enum: ['active', 'inactive', 'sold_out'],
    default: 'active',
  })
  status: InventoryStatus;

  @Column({ name: 'has_tiered_price', type: 'boolean', default: false })
  hasTieredPrice: boolean;

  @Column({ nullable: true, type: 'varchar' })
  location: string;

  @Column({ name: 'accept_negotiation', type: 'boolean', default: true })
  acceptNegotiation: boolean;

  @OneToMany('TieredPrice', 'inventory')
  tieredPrices: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
