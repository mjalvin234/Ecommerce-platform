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

export type SettlementStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type SettleMethod = 'wechat' | 'alipay' | 'bank';

@Entity('seller_settlements')
@Index('idx_settlements_seller', ['sellerId'])
@Index('idx_settlements_order', ['orderId'])
@Index('idx_settlements_status', ['status'])
export class SellerSettlement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'settlement_no', unique: true, type: 'varchar' })
  settlementNo: string; // 结算单号 SET-xxxxxx

  @Column({ name: 'order_id', type: 'varchar' })
  orderId: string;

  @ManyToOne('Order')
  @JoinColumn({ name: 'order_id' })
  order: any;

  @Column({ name: 'seller_id', type: 'varchar' })
  sellerId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'seller_id' })
  seller: any;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number; // 结算金额

  @Column({ name: 'platform_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  platformFee: number; // 平台手续费

  @Column({ name: 'order_amount', type: 'decimal', precision: 15, scale: 2 })
  orderAmount: number; // 原始订单金额

  @Column({
    type: 'simple-enum',
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  })
  status: SettlementStatus;

  // 收款方式
  @Column({
    name: 'settle_method',
    type: 'simple-enum',
    enum: ['wechat', 'alipay', 'bank'],
  })
  settleMethod: SettleMethod;

  // 微信付款信息
  @Column({ name: 'wechat_openid', nullable: true, type: 'varchar' })
  wechatOpenid: string;

  @Column({ name: 'wechat_transaction_id', nullable: true, type: 'varchar' })
  wechatTransactionId: string;

  // 支付宝付款信息
  @Column({ name: 'alipay_account', nullable: true, type: 'varchar' })
  alipayAccount: string;

  @Column({ name: 'alipay_order_id', nullable: true, type: 'varchar' })
  alipayOrderId: string;

  // 银行转账信息
  @Column({ name: 'bank_name', nullable: true, type: 'varchar' })
  bankName: string;

  @Column({ name: 'bank_account', nullable: true, type: 'varchar' })
  bankAccount: string;

  @Column({ name: 'bank_transaction_id', nullable: true, type: 'varchar' })
  bankTransactionId: string;

  // 失败信息
  @Column({ name: 'fail_reason', nullable: true, type: 'text' })
  failReason: string;

  @Column({ name: 'retry_count', default: 0, type: 'integer' })
  retryCount: number; // 重试次数

  // 时间
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'processed_at', nullable: true, type: 'datetime' })
  processedAt: Date;

  @Column({ name: 'completed_at', nullable: true, type: 'datetime' })
  completedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
