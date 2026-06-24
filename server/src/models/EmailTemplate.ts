import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 邮件模版实体
 *
 * 用于存储各类通知邮件的模版
 */
@Entity('email_templates')
@Index('idx_email_templates_code', ['code'], { unique: true })
export class EmailTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  code: string;  // order_created, negotiation_received, ...

  @Column({ type: 'varchar' })
  name: string;  // 模版名称

  @Column({ type: 'varchar' })
  subject: string;  // 邮件标题

  @Column({ type: 'text' })
  body: string;  // 邮件正文（支持变量 {orderNumber} 等）

  @Column({
    name: 'admin_subject',
    type: 'varchar',
    nullable: true,
  })
  adminSubject: string;  // 发送给管理员的邮件标题

  @Column({
    name: 'admin_body',
    type: 'text',
    nullable: true,
  })
  adminBody: string;  // 发送给管理员的邮件正文

  @Column({
    type: 'simple-json',
    nullable: true,
  })
  variables: string[];  // 可用变量列表 ['orderNumber', 'partNumber', ...]

  @Column({
    name: 'is_default',
    type: 'boolean',
    default: true,
  })
  isDefault: boolean;  // 是否系统默认模版

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * 默认邮件模版
 */
export const DEFAULT_EMAIL_TEMPLATES: Partial<EmailTemplate>[] = [
  {
    code: 'order_created',
    name: '订单创建通知',
    subject: '订单创建成功 - {orderNumber}',
    body: '您好！\n\n您的订单 {orderNumber} 已创建成功。\n\n商品型号：{partNumber}\n数量：{quantity}\n金额：¥{amount}\n\n请尽快完成支付。',
    adminSubject: '[管理员] 新订单通知 - {orderNumber}',
    adminBody: '新订单已创建\n\n订单号：{orderNumber}\n商品：{partNumber}\n数量：{quantity}\n金额：¥{amount}\n买家：{buyerName}\n\n请及时处理。',
    variables: ['orderNumber', 'partNumber', 'quantity', 'amount', 'buyerName'],
    isDefault: true,
  },
  {
    code: 'order_paid',
    name: '订单支付通知',
    subject: '订单支付成功 - {orderNumber}',
    body: '您好！\n\n您的订单 {orderNumber} 已支付成功，金额 ¥{amount}。\n\n卖家将尽快安排发货。',
    adminSubject: '[管理员] 订单支付通知 - {orderNumber}',
    adminBody: '订单已支付\n\n订单号：{orderNumber}\n金额：¥{amount}\n买家：{buyerName}\n卖家：{sellerName}\n\n请卖家尽快安排发货。',
    variables: ['orderNumber', 'amount', 'buyerName', 'sellerName'],
    isDefault: true,
  },
  {
    code: 'order_shipped',
    name: '订单发货通知',
    subject: '订单已发货 - {orderNumber}',
    body: '您好！\n\n您的订单 {orderNumber} 已发货。\n\n物流公司：{carrier}\n运单号：{trackingNumber}\n\n请注意查收。',
    adminSubject: '[管理员] 订单发货通知 - {orderNumber}',
    adminBody: '订单已发货\n\n订单号：{orderNumber}\n物流：{carrier} - {trackingNumber}\n买家：{buyerName}\n卖家：{sellerName}',
    variables: ['orderNumber', 'carrier', 'trackingNumber', 'buyerName', 'sellerName'],
    isDefault: true,
  },
  {
    code: 'order_completed',
    name: '订单完成通知',
    subject: '订单已完成 - {orderNumber}',
    body: '您好！\n\n您的订单 {orderNumber} 已完成，感谢您的信任！\n\n欢迎再次光临。',
    adminSubject: '[管理员] 订单完成通知 - {orderNumber}',
    adminBody: '订单已完成\n\n订单号：{orderNumber}\n买家：{buyerName}\n卖家：{sellerName}',
    variables: ['orderNumber', 'buyerName', 'sellerName'],
    isDefault: true,
  },
  {
    code: 'order_cancelled',
    name: '订单取消通知',
    subject: '订单已取消 - {orderNumber}',
    body: '您好！\n\n您的订单 {orderNumber} 已取消。\n\n取消原因：{reason}',
    adminSubject: '[管理员] 订单取消通知 - {orderNumber}',
    adminBody: '订单已取消\n\n订单号：{orderNumber}\n原因：{reason}\n买家：{buyerName}\n卖家：{sellerName}',
    variables: ['orderNumber', 'reason', 'buyerName', 'sellerName'],
    isDefault: true,
  },
  {
    code: 'qa_passed',
    name: '质检通过通知',
    subject: '质检通过 - {orderNumber}',
    body: '您好！\n\n您的订单 {orderNumber}（{partNumber}）已通过质检，即将发货。',
    adminSubject: '[管理员] 质检通过通知 - {orderNumber}',
    adminBody: '质检通过\n\n订单号：{orderNumber}\n商品：{partNumber}\n数量：{quantity}',
    variables: ['orderNumber', 'partNumber', 'quantity'],
    isDefault: true,
  },
  {
    code: 'qa_failed',
    name: '质检失败通知',
    subject: '质检失败 - {orderNumber}',
    body: '您好！\n\n您的订单 {orderNumber}（{partNumber}）质检未通过。\n\n失败原因：{reason}\n\n我们将为您安排退款。',
    adminSubject: '[管理员] 质检失败通知 - {orderNumber}',
    adminBody: '质检失败\n\n订单号：{orderNumber}\n商品：{partNumber}\n原因：{reason}\n买家：{buyerName}\n卖家：{sellerName}',
    variables: ['orderNumber', 'partNumber', 'reason', 'buyerName', 'sellerName'],
    isDefault: true,
  },
  {
    code: 'negotiation_received',
    name: '议价申请通知',
    subject: '收到议价申请 - {partNumber}',
    body: '您好！\n\n您收到一条关于 {partNumber} 的议价申请。\n\n报价：¥{offerPrice}\n数量：{quantity} 件\n\n请及时处理。',
    adminSubject: '[管理员] 新议价申请 - {partNumber}',
    adminBody: '收到议价申请\n\n商品：{partNumber}\n报价：¥{offerPrice}\n数量：{quantity}\n买家：{buyerName}\n卖家：{sellerName}',
    variables: ['partNumber', 'offerPrice', 'quantity', 'buyerName', 'sellerName'],
    isDefault: true,
  },
  {
    code: 'negotiation_accepted',
    name: '议价接受通知',
    subject: '议价已接受 - {partNumber}',
    body: '您好！\n\n卖家已接受您关于 {partNumber} 的议价申请。\n\n订单号：{orderNumber}\n请尽快完成支付。',
    adminSubject: '[管理员] 议价已接受 - {partNumber}',
    adminBody: '议价已接受\n\n商品：{partNumber}\n订单号：{orderNumber}\n买家：{buyerName}\n卖家：{sellerName}',
    variables: ['partNumber', 'orderNumber', 'buyerName', 'sellerName'],
    isDefault: true,
  },
  {
    code: 'negotiation_rejected',
    name: '议价拒绝通知',
    subject: '议价已拒绝 - {partNumber}',
    body: '您好！\n\n卖家拒绝了您关于 {partNumber} 的议价申请。\n\n如有疑问请联系卖家。',
    adminSubject: '[管理员] 议价已拒绝 - {partNumber}',
    adminBody: '议价已拒绝\n\n商品：{partNumber}\n买家：{buyerName}\n卖家：{sellerName}',
    variables: ['partNumber', 'buyerName', 'sellerName'],
    isDefault: true,
  },
];
