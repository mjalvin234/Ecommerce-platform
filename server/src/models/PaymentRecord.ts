import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

/**
 * 支付渠道
 */
export type PaymentChannel = 'alipay' | 'wechat';

/**
 * 支付状态
 */
export type PaymentStatus =
  | 'pending'      // 待支付
  | 'paying'       // 支付中
  | 'success'      // 支付成功
  | 'failed'       // 支付失败
  | 'closed'       // 已关闭
  | 'refunding'    // 退款中
  | 'refunded';    // 已退款

/**
 * 支付记录实体
 */
@Entity('payment_records')
@Index('idx_payment_records_order', ['orderId'])
@Index('idx_payment_records_user', ['userId'])
@Index('idx_payment_records_status', ['status'])
@Index('idx_payment_records_created', ['createdAt'])
export class PaymentRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'payment_no', unique: true, type: 'varchar' })
  paymentNo: string; // 平台支付单号 PAY-xxxxxx

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

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number; // 支付金额

  @Column({ type: 'varchar' })
  channel: PaymentChannel; // 支付渠道

  @Column({
    type: 'simple-enum',
    enum: ['pending', 'paying', 'success', 'failed', 'closed', 'refunding', 'refunded'],
    default: 'pending',
  })
  status: PaymentStatus;

  // ===== 第三方支付信息 =====
  @Column({
    name: 'trade_no',
    nullable: true,
    type: 'varchar',
  })
  tradeNo: string; // 第三方交易号

  @Column({
    name: 'prepay_id',
    nullable: true,
    type: 'varchar',
  })
  prepayId: string; // 预支付ID（微信）

  @Column({
    name: 'qr_code',
    nullable: true,
    type: 'varchar',
  })
  qrCode: string; // 支付二维码链接

  @Column({
    name: 'pay_url',
    nullable: true,
    type: 'varchar',
  })
  payUrl: string; // 支付跳转链接

  // ===== 时间信息 =====
  @Column({
    name: 'expired_at',
    type: 'datetime',
  })
  expiredAt: Date; // 过期时间

  @Column({
    name: 'paid_at',
    nullable: true,
    type: 'datetime',
  })
  paidAt: Date; // 支付时间

  @Column({
    name: 'closed_at',
    nullable: true,
    type: 'datetime',
  })
  closedAt: Date; // 关闭时间

  // ===== 回调信息 =====
  @Column({
    name: 'notify_data',
    nullable: true,
    type: 'simple-json',
  })
  notifyData: any; // 回调原始数据

  @Column({
    name: 'notify_time',
    nullable: true,
    type: 'datetime',
  })
  notifyTime: Date; // 回调时间

  // ===== 退款信息 =====
  @Column({
    name: 'refund_amount',
    nullable: true,
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  refundAmount: number;

  @Column({
    name: 'refund_no',
    nullable: true,
    type: 'varchar',
  })
  refundNo: string; // 退款单号

  @Column({
    name: 'refund_reason',
    nullable: true,
    type: 'varchar',
  })
  refundReason: string;

  @Column({
    name: 'refunded_at',
    nullable: true,
    type: 'datetime',
  })
  refundedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

/**
 * 生成支付单号
 */
export function generatePaymentNo(): string {
  const timestamp = Date.now().toString().slice(-10);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PAY-${timestamp}${random}`;
}
