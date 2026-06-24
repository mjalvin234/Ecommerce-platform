import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

export type OrderStatus =
  | 'awaiting_payment'
  | 'paid_awaiting_shipment'
  | 'qa_in_transit'
  | 'qa_received'
  | 'qa_passed'
  | 'qa_failed'
  | 'shipped_to_buyer'
  | 'completed'
  | 'cancelled';

export type OrderType = 'direct' | 'negotiated';

@Entity('orders')
@Index('idx_orders_buyer', ['buyerId'])
@Index('idx_orders_seller', ['sellerId'])
@Index('idx_orders_status', ['status'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_number', unique: true, type: 'varchar' })
  orderNumber: string;

  @Column({ name: 'buyer_id', type: 'varchar' })
  buyerId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'buyer_id' })
  buyer: any;

  @Column({ name: 'seller_id', type: 'varchar' })
  sellerId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'seller_id' })
  seller: any;

  @Column({ name: 'negotiation_id', nullable: true, type: 'varchar' })
  negotiationId: string;

  @ManyToOne('Negotiation')
  @JoinColumn({ name: 'negotiation_id' })
  negotiation: any;

  @Column({ name: 'part_number', type: 'varchar' })
  partNumber: string;

  @Column({ name: 'inventory_id', type: 'varchar' })
  inventoryId: string;

  @ManyToOne('Inventory')
  @JoinColumn({ name: 'inventory_id' })
  inventory: any;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2 })
  unitPrice: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2 })
  totalAmount: number;

  @Column({
    type: 'simple-enum',
    enum: [
      'awaiting_payment',
      'paid_awaiting_shipment',
      'qa_in_transit',
      'qa_received',
      'qa_passed',
      'qa_failed',
      'shipped_to_buyer',
      'completed',
      'cancelled',
    ],
    default: 'awaiting_payment',
  })
  status: OrderStatus;

  @Column({
    name: 'order_type',
    type: 'simple-enum',
    enum: ['direct', 'negotiated'],
  })
  orderType: OrderType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
