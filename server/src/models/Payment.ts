import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';

export type PaymentStatus = 'pending' | 'escrow_held' | 'released' | 'refunded';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'varchar' })
  orderId: string;

  @OneToOne('Order')
  @JoinColumn({ name: 'order_id' })
  order: any;

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

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({
    type: 'simple-enum',
    enum: ['pending', 'escrow_held', 'released', 'refunded'],
    default: 'pending',
  })
  status: PaymentStatus;

  @Column({ name: 'payment_method', nullable: true, type: 'varchar' })
  paymentMethod: string;

  @Column({ name: 'transaction_reference', nullable: true, type: 'varchar' })
  transactionReference: string;

  @Column({ name: 'escrow_account', nullable: true, type: 'varchar' })
  escrowAccount: string;

  @Column({ name: 'paid_at', nullable: true, type: 'datetime' })
  paidAt: Date;

  @Column({ name: 'released_at', nullable: true, type: 'datetime' })
  releasedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
