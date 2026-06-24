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
 * 消息类型枚举
 */
export type MessageType =
  // 订单相关
  | 'order_created'
  | 'order_paid'
  | 'order_shipped'
  | 'order_completed'
  | 'order_cancelled'
  | 'order_refunded'
  | 'qa_passed'
  | 'qa_failed'
  // 议价相关
  | 'negotiation_received'
  | 'negotiation_accepted'
  | 'negotiation_rejected'
  // 系统相关
  | 'system_announcement'
  | 'verification_result'
  | 'credit_change';

/**
 * 消息分类
 */
export type MessageCategory = 'order' | 'negotiation' | 'system';

/**
 * 消息实体
 */
@Entity('messages')
@Index('idx_messages_user', ['userId'])
@Index('idx_messages_user_read', ['userId', 'read'])
@Index('idx_messages_user_type', ['userId', 'type'])
@Index('idx_messages_created', ['createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'varchar' })
  userId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'user_id' })
  user: any;

  @Column({
    name: 'message_type',
    type: 'varchar',
  })
  type: MessageType;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    name: 'related_data',
    type: 'simple-json',
    nullable: true,
  })
  relatedData?: {
    orderId?: string;
    orderNumber?: string;
    negotiationId?: string;
    partNumber?: string;
    trackingNumber?: string;
    carrier?: string;
    [key: string]: any;
  };

  @Column({
    type: 'boolean',
    default: false,
  })
  read: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

/**
 * 根据消息类型获取分类
 */
export function getMessageCategory(type: MessageType): MessageCategory {
  if (type.startsWith('order_')) return 'order';
  if (type.startsWith('negotiation_')) return 'negotiation';
  return 'system';
}

/**
 * 消息类型显示配置
 */
export const MESSAGE_TYPE_CONFIG: Record<MessageType, { category: MessageCategory; icon: string; color: string }> = {
  // 订单消息
  order_created: { category: 'order', icon: 'Package', color: 'blue' },
  order_paid: { category: 'order', icon: 'CreditCard', color: 'green' },
  order_shipped: { category: 'order', icon: 'Truck', color: 'orange' },
  order_completed: { category: 'order', icon: 'CheckCircle', color: 'green' },
  order_cancelled: { category: 'order', icon: 'XCircle', color: 'red' },
  order_refunded: { category: 'order', icon: 'RefreshCw', color: 'purple' },
  qa_passed: { category: 'order', icon: 'ShieldCheck', color: 'green' },
  qa_failed: { category: 'order', icon: 'AlertTriangle', color: 'red' },
  // 议价消息
  negotiation_received: { category: 'negotiation', icon: 'ArrowRightLeft', color: 'orange' },
  negotiation_accepted: { category: 'negotiation', icon: 'Check', color: 'green' },
  negotiation_rejected: { category: 'negotiation', icon: 'X', color: 'red' },
  // 系统消息
  system_announcement: { category: 'system', icon: 'Bell', color: 'gray' },
  verification_result: { category: 'system', icon: 'ShieldCheck', color: 'blue' },
  credit_change: { category: 'system', icon: 'Star', color: 'yellow' },
};
