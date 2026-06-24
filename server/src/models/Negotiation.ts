import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export type NegotiationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

@Entity('negotiations')
export class Negotiation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ name: 'inventory_id', type: 'varchar' })
  inventoryId: string;

  @ManyToOne('Inventory')
  @JoinColumn({ name: 'inventory_id' })
  inventory: any;

  @Column({ name: 'seller_price', type: 'decimal', precision: 12, scale: 2 })
  sellerPrice: number;

  @Column({ name: 'offer_price', type: 'decimal', precision: 12, scale: 2 })
  offerPrice: number;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({
    type: 'simple-enum',
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending',
  })
  status: NegotiationStatus;

  @Column({ name: 'expires_at', nullable: true, type: 'datetime' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
