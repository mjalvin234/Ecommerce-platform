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

export type PackageStatus = 'draft' | 'active' | 'sold' | 'expired';

@Entity('inventory_packages')
export class InventoryPackage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'seller_id', type: 'varchar' })
  sellerId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'seller_id' })
  seller: any;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'total_items', type: 'integer', default: 0 })
  totalItems: number;

  @Column({ name: 'total_value', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalValue: number;

  @Column({ name: 'package_price', type: 'decimal', precision: 15, scale: 2 })
  packagePrice: number;

  @Column({ name: 'discount_rate', type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountRate: number;

  @Column({
    type: 'text',
    default: 'draft',
  })
  status: PackageStatus;

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'sold_to', type: 'varchar', nullable: true })
  soldTo: string | null;

  @ManyToOne('User')
  @JoinColumn({ name: 'sold_to' })
  soldToUser: any;

  @Column({ name: 'sold_at', type: 'datetime', nullable: true })
  soldAt: Date | null;

  @OneToMany('PackageItem', 'package')
  items: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
