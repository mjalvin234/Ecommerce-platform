import { AppDataSource } from '../config/database.js';
import { PaymentConfig, DEFAULT_PAYMENT_CONFIGS } from '../models/PaymentConfig.js';
import { PaymentRecord, PaymentStatus, PaymentChannel } from '../models/PaymentRecord.js';

/**
 * 支付配置仓库
 */
export class PaymentConfigRepository {
  private repo = AppDataSource.getRepository(PaymentConfig);

  /**
   * 获取所有支付配置
   */
  async findAll(): Promise<PaymentConfig[]> {
    return this.repo.find({ order: { channel: 'ASC' } });
  }

  /**
   * 根据渠道获取配置
   */
  async findByChannel(channel: PaymentChannel): Promise<PaymentConfig | null> {
    return this.repo.findOne({ where: { channel } });
  }

  /**
   * 获取启用的支付配置
   */
  async findEnabled(): Promise<PaymentConfig[]> {
    return this.repo.find({ where: { enabled: true } });
  }

  /**
   * 更新支付配置
   */
  async update(channel: PaymentChannel, data: Partial<PaymentConfig>): Promise<PaymentConfig | null> {
    const config = await this.findByChannel(channel);
    if (!config) {
      // 如果不存在，创建新配置
      const newConfig = this.repo.create({
        channel,
        channelName: channel === 'alipay' ? '支付宝' : '微信支付',
        ...data,
      });
      return this.repo.save(newConfig);
    }
    Object.assign(config, data);
    return this.repo.save(config);
  }

  /**
   * 初始化默认配置
   */
  async initDefaultConfigs(): Promise<void> {
    for (const defaultConfig of DEFAULT_PAYMENT_CONFIGS) {
      const existing = await this.findByChannel(defaultConfig.channel as PaymentChannel);
      if (!existing) {
        const config = this.repo.create(defaultConfig);
        await this.repo.save(config);
      }
    }
  }

  /**
   * 检查配置是否完整
   * 沙箱模式下，只要有基本的appId就认为配置完成（用于测试）
   */
  isConfigComplete(config: PaymentConfig): boolean {
    if (config.channel === 'alipay') {
      // 沙箱模式下只需要appId
      if (config.sandboxMode) {
        return !!config.alipayAppId;
      }
      // 生产模式需要完整配置
      return !!(config.alipayAppId && config.alipayPrivateKey && config.alipayPublicKey);
    }
    if (config.channel === 'wechat') {
      // 沙箱模式下只需要appId和mchId
      if (config.sandboxMode) {
        return !!(config.wechatAppId && config.wechatMchId);
      }
      // 生产模式需要完整配置
      return !!(config.wechatAppId && config.wechatMchId && config.wechatApiKey);
    }
    return false;
  }
}

/**
 * 支付记录仓库
 */
export class PaymentRecordRepository {
  private repo = AppDataSource.getRepository(PaymentRecord);

  /**
   * 根据ID查找
   */
  async findById(id: string): Promise<PaymentRecord | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['order', 'user'],
    });
  }

  /**
   * 根据支付单号查找
   */
  async findByPaymentNo(paymentNo: string): Promise<PaymentRecord | null> {
    return this.repo.findOne({
      where: { paymentNo },
      relations: ['order', 'user'],
    });
  }

  /**
   * 根据订单ID查找
   */
  async findByOrderId(orderId: string): Promise<PaymentRecord | null> {
    return this.repo.findOne({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 根据第三方交易号查找
   */
  async findByTradeNo(tradeNo: string): Promise<PaymentRecord | null> {
    return this.repo.findOne({ where: { tradeNo } });
  }

  /**
   * 创建支付记录
   */
  async create(data: Partial<PaymentRecord>): Promise<PaymentRecord> {
    const record = this.repo.create(data);
    return this.repo.save(record);
  }

  /**
   * 更新支付状态
   */
  async updateStatus(
    paymentNo: string,
    status: PaymentStatus,
    data?: Partial<PaymentRecord>
  ): Promise<PaymentRecord | null> {
    const record = await this.findByPaymentNo(paymentNo);
    if (!record) return null;

    record.status = status;
    if (data) {
      Object.assign(record, data);
    }
    return this.repo.save(record);
  }

  /**
   * 查找过期未支付记录
   */
  async findExpiredPending(): Promise<PaymentRecord[]> {
    return this.repo
      .createQueryBuilder('record')
      .where('record.status = :status', { status: 'pending' })
      .andWhere('record.expiredAt < :now', { now: new Date() })
      .getMany();
  }

  /**
   * 获取用户支付记录列表
   */
  async findByUserId(userId: string, options?: { limit?: number; offset?: number }): Promise<[PaymentRecord[], number]> {
    const queryBuilder = this.repo
      .createQueryBuilder('record')
      .where('record.userId = :userId', { userId })
      .orderBy('record.createdAt', 'DESC');

    if (options?.limit) {
      queryBuilder.take(options.limit);
    }
    if (options?.offset) {
      queryBuilder.skip(options.offset);
    }

    return queryBuilder.getManyAndCount();
  }
}

export const paymentConfigRepository = new PaymentConfigRepository();
export const paymentRecordRepository = new PaymentRecordRepository();
