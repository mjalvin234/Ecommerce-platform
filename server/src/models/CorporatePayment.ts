import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export type CorporatePaymentStatus = 'pending' | 'confirmed' | 'rejected';

@Entity('corporate_payments')
export class CorporatePayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'varchar' })
  orderId: string;

  @ManyToOne('Order')
  @JoinColumn({ name: 'order_id' })
  order: any;

  @Column({ name: 'user_id', type: 'varchar' })
  userId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'user_id' })
  user: any;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ name: 'bank_name', type: 'varchar' })
  bankName: string;

  @Column({ name: 'bank_account', type: 'varchar' })
  bankAccount: string;

  @Column({ name: 'proof_url', type: 'varchar' })
  proofUrl: string;

  @Column({
    type: 'simple-enum',
    enum: ['pending', 'confirmed', 'rejected'],
    default: 'pending',
  })
  status: CorporatePaymentStatus;

  @Column({ name: 'confirmed_by', nullable: true, type: 'varchar' })
  confirmedBy: string;

  @Column({ name: 'confirmed_at', nullable: true, type: 'datetime' })
  confirmedAt: Date;

  @Column({ name: 'reject_reason', nullable: true, type: 'varchar' })
  rejectReason: string;

  @Column({ name: 'invoice_id', nullable: true, type: 'varchar' })
  invoiceId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
