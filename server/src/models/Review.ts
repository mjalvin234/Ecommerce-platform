import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('reviews')
@Index(['sellerId', 'createdAt'])
@Index(['inventoryId', 'createdAt'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  orderId: string;

  @ManyToOne('Order')
  @JoinColumn({ name: 'orderId' })
  order: any;

  @Column({ type: 'varchar' })
  buyerId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'buyerId' })
  buyer: any;

  @Column({ type: 'varchar' })
  sellerId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'sellerId' })
  seller: any;

  @Column({ type: 'varchar' })
  inventoryId: string;

  @ManyToOne('Inventory')
  @JoinColumn({ name: 'inventoryId' })
  inventory: any;

  @Column({ type: 'integer' })
  rating: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  sellerReply: string;

  @Column({ type: 'datetime', nullable: true })
  repliedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
