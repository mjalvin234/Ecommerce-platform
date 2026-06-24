import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

export type ShipmentStage = 'to_warehouse' | 'to_buyer';
export type ShipmentStatus = 'pending' | 'in_transit' | 'delivered' | 'failed';

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'varchar' })
  orderId: string;

  @OneToOne('Order')
  @JoinColumn({ name: 'order_id' })
  order: any;

  @Column({
    type: 'simple-enum',
    enum: ['to_warehouse', 'to_buyer'],
  })
  stage: ShipmentStage;

  @Column({ nullable: true, type: 'varchar' })
  carrier: string;

  @Column({ name: 'tracking_number', nullable: true, type: 'varchar' })
  trackingNumber: string;

  @Column({
    type: 'simple-enum',
    enum: ['pending', 'in_transit', 'delivered', 'failed'],
    default: 'pending',
  })
  status: ShipmentStatus;

  @Column({ name: 'shipped_at', nullable: true, type: 'datetime' })
  shippedAt: Date;

  @Column({ name: 'delivered_at', nullable: true, type: 'datetime' })
  deliveredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
