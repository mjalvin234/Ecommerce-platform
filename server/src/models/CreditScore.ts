import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';

/**
 * 信用评分变动类型
 */
export type CreditChangeType =
  | 'order_completed'      // 订单完成 +分
  | 'order_cancelled'      // 订单取消 -分
  | 'payment_on_time'      // 按时付款 +分
  | 'payment_delayed'      // 延迟付款 -分
  | 'quality_good'         // 质量好评 +分
  | 'quality_bad'          // 质量差评 -分
  | 'dispute_lost'         // 纠纷败诉 -分
  | 'admin_adjustment'     // 管理员调整
  | 'certification_verified'; // 企业认证通过 +分

/**
 * 信用评分变动记录
 */
@Entity('credit_score_logs')
@Index(['userId'])
@Index(['createdAt'])
export class CreditScoreLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  userId!: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'userId' })
  user?: any;

  @Column({
    type: 'varchar',
    enum: [
      'order_completed',
      'order_cancelled',
      'payment_on_time',
      'payment_delayed',
      'quality_good',
      'quality_bad',
      'dispute_lost',
      'admin_adjustment',
      'certification_verified'
    ]
  })
  changeType!: CreditChangeType;

  @Column({ type: 'integer' })
  changeAmount!: number; // 变动分数，正数加分，负数减分

  @Column({ type: 'integer' })
  scoreBefore!: number; // 变动前分数

  @Column({ type: 'integer' })
  scoreAfter!: number; // 变动后分数

  @Column({ type: 'varchar', nullable: true })
  relatedId?: string; // 关联的订单ID、认证ID等

  @Column({ type: 'text', nullable: true })
  remark?: string; // 备注

  @CreateDateColumn()
  createdAt!: Date;
}
