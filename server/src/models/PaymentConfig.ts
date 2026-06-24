import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 支付渠道类型
 */
export type PaymentChannel = 'alipay' | 'wechat';

/**
 * 支付配置状态
 */
export type PaymentConfigStatus = 'active' | 'inactive';

/**
 * 支付配置实体
 * 存储支付宝/微信支付商户配置
 */
@Entity('payment_configs')
export class PaymentConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    unique: true,
  })
  channel: PaymentChannel;

  @Column({
    name: 'channel_name',
    type: 'varchar',
  })
  channelName: string; // 支付宝 / 微信支付

  // ===== 支付宝配置 =====
  @Column({
    name: 'alipay_app_id',
    nullable: true,
    type: 'varchar',
  })
  alipayAppId: string;

  @Column({
    name: 'alipay_private_key',
    nullable: true,
    type: 'text',
  })
  alipayPrivateKey: string; // 加密存储

  @Column({
    name: 'alipay_public_key',
    nullable: true,
    type: 'text',
  })
  alipayPublicKey: string; // 支付宝公钥

  @Column({
    name: 'alipay_notify_url',
    nullable: true,
    type: 'varchar',
  })
  alipayNotifyUrl: string;

  @Column({
    name: 'alipay_return_url',
    nullable: true,
    type: 'varchar',
  })
  alipayReturnUrl: string;

  // ===== 微信支付配置 =====
  @Column({
    name: 'wechat_app_id',
    nullable: true,
    type: 'varchar',
  })
  wechatAppId: string;

  @Column({
    name: 'wechat_mch_id',
    nullable: true,
    type: 'varchar',
  })
  wechatMchId: string; // 商户号

  @Column({
    name: 'wechat_api_key',
    nullable: true,
    type: 'varchar',
  })
  wechatApiKey: string; // 加密存储

  @Column({
    name: 'wechat_api_v3_key',
    nullable: true,
    type: 'varchar',
  })
  wechatApiV3Key: string;

  @Column({
    name: 'wechat_serial_no',
    nullable: true,
    type: 'varchar',
  })
  wechatSerialNo: string; // 证书序列号

  @Column({
    name: 'wechat_private_key',
    nullable: true,
    type: 'text',
  })
  wechatPrivateKey: string; // 加密存储

  @Column({
    name: 'wechat_notify_url',
    nullable: true,
    type: 'varchar',
  })
  wechatNotifyUrl: string;

  // ===== 通用配置 =====
  @Column({
    type: 'boolean',
    default: true,
  })
  enabled: boolean;

  @Column({
    name: 'sandbox_mode',
    type: 'boolean',
    default: true, // 默认沙箱模式
  })
  sandboxMode: boolean; // 沙箱/生产模式

  @Column({
    type: 'text',
    nullable: true,
  })
  remark: string; // 备注

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * 支付配置默认值
 * 默认启用沙箱模式用于测试
 */
export const DEFAULT_PAYMENT_CONFIGS: Partial<PaymentConfig>[] = [
  {
    channel: 'alipay',
    channelName: '支付宝',
    enabled: true, // 默认启用，方便测试
    sandboxMode: true,
    alipayAppId: 'sandbox_app_id', // 沙箱测试ID
    alipayNotifyUrl: '/api/payments/alipay/notify',
    alipayReturnUrl: '/payment/result',
  },
  {
    channel: 'wechat',
    channelName: '微信支付',
    enabled: true, // 默认启用，方便测试
    sandboxMode: true,
    wechatAppId: 'sandbox_app_id', // 沙箱测试ID
    wechatMchId: 'sandbox_mch_id', // 沙箱商户号
    wechatNotifyUrl: '/api/payments/wechat/notify',
  },
];
