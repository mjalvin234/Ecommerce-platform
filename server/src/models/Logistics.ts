import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';

export type LogisticsStatus = 'pending' | 'shipped' | 'in_transit' | 'delivering' | 'delivered' | 'returned' | 'exception';

@Entity('logistics')
@Index(['trackingNumber', 'carrier'])
export class Logistics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  orderId: string;

  @ManyToOne('Order')
  @JoinColumn({ name: 'orderId' })
  order: any;

  @Column({ type: 'varchar' })
  carrier: string;

  @Column({ type: 'varchar' })
  carrierCode: string;

  @Column({ type: 'varchar' })
  trackingNumber: string;

  @Column({
    type: 'varchar',
    enum: ['pending', 'shipped', 'in_transit', 'delivering', 'delivered', 'returned', 'exception'],
    default: 'pending'
  })
  status: LogisticsStatus;

  @Column({ type: 'json', nullable: true })
  traces: Array<{
    time: string;
    context: string;
    location?: string;
    ftime?: string;
  }>;

  @Column({ type: 'datetime', nullable: true })
  shippedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'datetime', nullable: true })
  lastSyncAt: Date;

  @Column({ type: 'datetime', nullable: true })
  estimatedDelivery: Date;

  @Column({ type: 'varchar', nullable: true })
  remark: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('export_tasks')
export class ExportTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  userId: string;

  @Column({ type: 'varchar' })
  type: 'orders' | 'inventory' | 'transactions';

  @Column({ type: 'json', nullable: true })
  filters: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  columns: string[];

  @Column({
    type: 'varchar',
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  })
  status: string;

  @Column({ type: 'integer', default: 0 })
  totalCount: number;

  @Column({ type: 'integer', default: 0 })
  processedCount: number;

  @Column({ type: 'varchar', nullable: true })
  fileUrl: string;

  @Column({ type: 'varchar', nullable: true })
  fileName: string;

  @Column({ type: 'varchar', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date;
}
