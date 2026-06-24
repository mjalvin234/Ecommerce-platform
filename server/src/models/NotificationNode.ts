import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 通知节点类型
 */
export type NotificationCategory = 'order' | 'negotiation' | 'system';

/**
 * 通知节点配置实体
 *
 * 用于配置每个业务动作是否需要通知管理员和用户
 */
@Entity('notification_nodes')
@Index('idx_notification_nodes_code', ['code'], { unique: true })
@Index('idx_notification_nodes_category', ['category'])
export class NotificationNode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  code: string;  // order_created, order_paid, ...

  @Column({ type: 'varchar' })
  name: string;  // 订单创建、订单支付...

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    name: 'admin_message_enabled',
    type: 'boolean',
    default: false,
  })
  adminMessageEnabled: boolean;  // 站内消息通知管理员

  @Column({
    name: 'admin_email_enabled',
    type: 'boolean',
    default: false,
  })
  adminEmailEnabled: boolean;    // 邮件通知管理员

  @Column({
    name: 'user_notification_enabled',
    type: 'boolean',
    default: true,
  })
  userNotificationEnabled: boolean;  // 通知用户（买家/卖家）

  @Column({
    type: 'varchar',
    default: 'system',
  })
  category: NotificationCategory;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * 预置通知节点配置
 */
export const DEFAULT_NOTIFICATION_NODES: Partial<NotificationNode>[] = [
  // 订单相关
  { code: 'order_created', name: '订单创建', description: '买家下单时通知', category: 'order', adminMessageEnabled: true, adminEmailEnabled: true, userNotificationEnabled: true },
  { code: 'order_paid', name: '订单支付', description: '买家付款后通知', category: 'order', adminMessageEnabled: true, adminEmailEnabled: true, userNotificationEnabled: true },
  { code: 'order_shipped', name: '订单发货', description: '卖家发货后通知', category: 'order', adminMessageEnabled: true, adminEmailEnabled: true, userNotificationEnabled: true },
  { code: 'order_completed', name: '订单完成', description: '交易完成时通知', category: 'order', adminMessageEnabled: true, adminEmailEnabled: false, userNotificationEnabled: true },
  { code: 'order_cancelled', name: '订单取消', description: '订单取消时通知', category: 'order', adminMessageEnabled: true, adminEmailEnabled: true, userNotificationEnabled: true },
  { code: 'order_refunded', name: '订单退款', description: '订单退款时通知', category: 'order', adminMessageEnabled: true, adminEmailEnabled: true, userNotificationEnabled: true },
  { code: 'qa_passed', name: '质检通过', description: '质检通过时通知', category: 'order', adminMessageEnabled: false, adminEmailEnabled: false, userNotificationEnabled: true },
  { code: 'qa_failed', name: '质检失败', description: '质检失败时通知', category: 'order', adminMessageEnabled: true, adminEmailEnabled: true, userNotificationEnabled: true },
  // 议价相关
  { code: 'negotiation_received', name: '议价申请', description: '收到议价请求时通知', category: 'negotiation', adminMessageEnabled: true, adminEmailEnabled: true, userNotificationEnabled: true },
  { code: 'negotiation_accepted', name: '议价接受', description: '议价被接受时通知', category: 'negotiation', adminMessageEnabled: false, adminEmailEnabled: false, userNotificationEnabled: true },
  { code: 'negotiation_rejected', name: '议价拒绝', description: '议价被拒绝时通知', category: 'negotiation', adminMessageEnabled: false, adminEmailEnabled: false, userNotificationEnabled: true },
  // 系统相关
  { code: 'system_announcement', name: '系统公告', description: '发布系统公告时通知', category: 'system', adminMessageEnabled: false, adminEmailEnabled: false, userNotificationEnabled: true },
  { code: 'verification_result', name: '认证审核', description: '认证审核结果通知', category: 'system', adminMessageEnabled: true, adminEmailEnabled: true, userNotificationEnabled: true },
  { code: 'credit_change', name: '信用变更', description: '信用分变更时通知', category: 'system', adminMessageEnabled: false, adminEmailEnabled: false, userNotificationEnabled: true },
];
