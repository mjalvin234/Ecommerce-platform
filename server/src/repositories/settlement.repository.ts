import { AppDataSource } from '../config/database.js';
import { SellerSettlement, SettlementStatus, SettleMethod } from '../models/SellerSettlement.js';

/**
 * 结算仓库
 */
export class SettlementRepository {
  private repo = AppDataSource.getRepository(SellerSettlement);

  /**
   * 根据ID查找
   */
  async findById(id: string): Promise<SellerSettlement | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['order', 'seller'],
    });
  }

  /**
   * 根据结算单号查找
   */
  async findBySettlementNo(settlementNo: string): Promise<SellerSettlement | null> {
    return this.repo.findOne({
      where: { settlementNo },
      relations: ['order', 'seller'],
    });
  }

  /**
   * 根据订单ID查找
   */
  async findByOrderId(orderId: string): Promise<SellerSettlement | null> {
    return this.repo.findOne({
      where: { orderId },
    });
  }

  /**
   * 根据卖家ID查找结算记录
   */
  async findBySellerId(
    sellerId: string,
    options?: { limit?: number; offset?: number; status?: SettlementStatus }
  ): Promise<[SellerSettlement[], number]> {
    const queryBuilder = this.repo
      .createQueryBuilder('settlement')
      .where('settlement.sellerId = :sellerId', { sellerId })
      .orderBy('settlement.createdAt', 'DESC');

    if (options?.status) {
      queryBuilder.andWhere('settlement.status = :status', { status: options.status });
    }

    if (options?.limit) {
      queryBuilder.take(options.limit);
    }
    if (options?.offset) {
      queryBuilder.skip(options.offset);
    }

    return queryBuilder.getManyAndCount();
  }

  /**
   * 查询待处理结算
   */
  async findPending(options?: { limit?: number; offset?: number }): Promise<[SellerSettlement[], number]> {
    const queryBuilder = this.repo
      .createQueryBuilder('settlement')
      .leftJoinAndSelect('settlement.seller', 'seller')
      .leftJoinAndSelect('settlement.order', 'order')
      .where('settlement.status IN (:...statuses)', { statuses: ['pending', 'processing', 'failed'] })
      .orderBy('settlement.createdAt', 'ASC');

    if (options?.limit) {
      queryBuilder.take(options.limit);
    }
    if (options?.offset) {
      queryBuilder.skip(options.offset);
    }

    return queryBuilder.getManyAndCount();
  }

  /**
   * 创建结算记录
   */
  async create(data: Partial<SellerSettlement>): Promise<SellerSettlement> {
    const record = this.repo.create(data);
    return this.repo.save(record);
  }

  /**
   * 更新结算状态
   */
  async updateStatus(
    id: string,
    status: SettlementStatus,
    data?: Partial<SellerSettlement>
  ): Promise<SellerSettlement | null> {
    const record = await this.findById(id);
    if (!record) return null;

    record.status = status;
    if (data) {
      Object.assign(record, data);
    }
    return this.repo.save(record);
  }

  /**
   * 获取卖家结算统计
   */
  async getSellerStats(sellerId: string): Promise<{
    totalAmount: number;
    pendingCount: number;
    completedCount: number;
    failedCount: number;
  }> {
    const result = await this.repo
      .createQueryBuilder('settlement')
      .select('SUM(settlement.amount)', 'totalAmount')
      .addSelect('SUM(CASE WHEN settlement.status = :pending THEN 1 ELSE 0 END)', 'pendingCount')
      .addSelect('SUM(CASE WHEN settlement.status = :completed THEN 1 ELSE 0 END)', 'completedCount')
      .addSelect('SUM(CASE WHEN settlement.status = :failed THEN 1 ELSE 0 END)', 'failedCount')
      .where('settlement.sellerId = :sellerId', { sellerId })
      .setParameters({
        pending: 'pending',
        completed: 'completed',
        failed: 'failed',
      })
      .getRawOne();

    return {
      totalAmount: parseFloat(result?.totalAmount || '0'),
      pendingCount: parseInt(result?.pendingCount || '0', 10),
      completedCount: parseInt(result?.completedCount || '0', 10),
      failedCount: parseInt(result?.failedCount || '0', 10),
    };
  }

  /**
   * 获取管理员结算统计（全局）
   */
  async getAdminStats(): Promise<{
    todayAmount: number;
    monthAmount: number;
    pendingCount: number;
    processingCount: number;
    completedCount: number;
    failedCount: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const result = await this.repo
      .createQueryBuilder('settlement')
      .select('SUM(CASE WHEN settlement.createdAt >= :today THEN settlement.amount ELSE 0 END)', 'todayAmount')
      .addSelect('SUM(CASE WHEN settlement.createdAt >= :monthStart THEN settlement.amount ELSE 0 END)', 'monthAmount')
      .addSelect('SUM(CASE WHEN settlement.status = :pending THEN 1 ELSE 0 END)', 'pendingCount')
      .addSelect('SUM(CASE WHEN settlement.status = :processing THEN 1 ELSE 0 END)', 'processingCount')
      .addSelect('SUM(CASE WHEN settlement.status = :completed THEN 1 ELSE 0 END)', 'completedCount')
      .addSelect('SUM(CASE WHEN settlement.status = :failed THEN 1 ELSE 0 END)', 'failedCount')
      .setParameters({
        today,
        monthStart,
        pending: 'pending',
        processing: 'processing',
        completed: 'completed',
        failed: 'failed',
      })
      .getRawOne();

    return {
      todayAmount: parseFloat(result?.todayAmount || '0'),
      monthAmount: parseFloat(result?.monthAmount || '0'),
      pendingCount: parseInt(result?.pendingCount || '0', 10),
      processingCount: parseInt(result?.processingCount || '0', 10),
      completedCount: parseInt(result?.completedCount || '0', 10),
      failedCount: parseInt(result?.failedCount || '0', 10),
    };
  }

  /**
   * 查询需要重试的失败结算
   */
  async findRetryable(): Promise<SellerSettlement[]> {
    return this.repo
      .createQueryBuilder('settlement')
      .where('settlement.status = :status', { status: 'failed' })
      .andWhere('settlement.retryCount < :maxRetry', { maxRetry: 3 })
      .orderBy('settlement.createdAt', 'ASC')
      .getMany();
  }
}

export const settlementRepository = new SettlementRepository();
