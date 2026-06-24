import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';

/**
 * 库存预警类型
 */
export type AlertType = 'low_stock' | 'price_change' | 'status_change' | 'expiring';

/**
 * 库存预警实体
 */
@Entity('inventory_alerts')
@Index(['userId', 'isRead'])
@Index(['inventoryId'])
export class InventoryAlert {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  userId!: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'userId' })
  user?: any;

  @Column({ type: 'varchar' })
  inventoryId!: string;

  @ManyToOne('Inventory')
  @JoinColumn({ name: 'inventoryId' })
  inventory?: any;

  @Column({
    type: 'varchar',
    enum: ['low_stock', 'price_change', 'status_change', 'expiring']
  })
  alertType!: AlertType;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown>; // 额外的元数据

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
