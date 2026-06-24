import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type CustomerTagType = 'vip' | 'old_customer' | 'preferred';

@Entity('customer_tags')
@Index('idx_customer_tags_seller', ['sellerId'])
@Index('idx_customer_tags_buyer', ['buyerId'])
@Index('idx_customer_tags_unique', ['sellerId', 'buyerId'], { unique: true })
export class CustomerTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'seller_id', type: 'varchar' })
  sellerId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'seller_id' })
  seller: any;

  @Column({ name: 'buyer_id', type: 'varchar' })
  buyerId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'buyer_id' })
  buyer: any;

  @Column({
    name: 'tag_type',
    type: 'text',
    default: 'old_customer',
  })
  tagType: CustomerTagType;

  @Column({ name: 'discount_rate', type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountRate: number | null;

  @Column({ name: 'total_orders', type: 'integer', default: 0 })
  totalOrders: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ name: 'tagged_at', type: 'datetime' })
  taggedAt: Date;

  @Column({ type: 'text', nullable: true })
  remark: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
