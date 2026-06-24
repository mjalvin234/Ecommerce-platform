import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';

export type InvoiceType = 'normal' | 'special';
export type InvoiceStatus = 'pending' | 'processing' | 'issued' | 'rejected';

@Entity('invoices')
export class Invoice {
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

  @Column({
    type: 'varchar',
    enum: ['normal', 'special'],
    default: 'normal'
  })
  invoiceType: InvoiceType;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'varchar' })
  taxNumber: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({
    type: 'varchar',
    enum: ['pending', 'processing', 'issued', 'rejected'],
    default: 'pending'
  })
  status: InvoiceStatus;

  @Column({ type: 'varchar', nullable: true })
  rejectReason: string;

  @Column({ type: 'varchar', nullable: true })
  invoiceNo: string;

  @Column({ type: 'datetime', nullable: true })
  issuedAt: Date;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn()
  createdAt: Date;
}
