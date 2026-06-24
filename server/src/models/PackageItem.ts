import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('package_items')
export class PackageItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'package_id', type: 'varchar' })
  packageId: string;

  @ManyToOne('InventoryPackage', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'package_id' })
  package: any;

  @Column({ name: 'inventory_id', type: 'varchar' })
  inventoryId: string;

  @ManyToOne('Inventory')
  @JoinColumn({ name: 'inventory_id' })
  inventory: any;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  subtotal: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
