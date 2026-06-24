import { AppDataSource } from '../config/database.js';
import { CustomerTag, CustomerTagType } from '../models/CustomerTag.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { NotFoundError, ValidationError } from '../middlewares/error.middleware.js';
import { MoreThanOrEqual } from 'typeorm';

export class CustomerTagService {
  private tagRepo = AppDataSource.getRepository(CustomerTag);
  private userRepo = AppDataSource.getRepository(User);
  private orderRepo = AppDataSource.getRepository(Order);

  /**
   * 标记客户
   */
  async tagCustomer(
    sellerId: string,
    buyerId: string,
    tagType: CustomerTagType,
    discountRate?: number,
    remark?: string
  ): Promise<CustomerTag> {
    // 检查买家是否存在
    const buyer = await this.userRepo.findOne({ where: { id: buyerId } });
    if (!buyer) {
      throw new NotFoundError('买家不存在');
    }

    // 检查是否已标记
    const existing = await this.tagRepo.findOne({
      where: { sellerId, buyerId },
    });

    if (existing) {
      // 更新标记
      existing.tagType = tagType;
      if (discountRate !== undefined) {
        existing.discountRate = discountRate;
      }
      if (remark !== undefined) {
        existing.remark = remark;
      }
      existing.taggedAt = new Date();
      return this.tagRepo.save(existing);
    }

    // 创建新标记
    const tag = this.tagRepo.create({
      sellerId,
      buyerId,
      tagType,
      discountRate: discountRate ?? undefined,
      remark: remark ?? undefined,
      taggedAt: new Date(),
    });

    return this.tagRepo.save(tag);
  }

  /**
   * 取消标记
   */
  async untagCustomer(sellerId: string, buyerId: string): Promise<void> {
    await this.tagRepo.delete({ sellerId, buyerId });
  }

  /**
   * 获取客户标签
   */
  async getCustomerTag(sellerId: string, buyerId: string): Promise<CustomerTag | null> {
    return this.tagRepo.findOne({
      where: { sellerId, buyerId },
      relations: ['buyer'],
    });
  }

  /**
   * 获取我的标记客户列表（卖家视角）
   */
  async getMyTaggedCustomers(
    sellerId: string,
    options: {
      tagType?: CustomerTagType;
      page?: number;
      pageSize?: number;
    }
  ) {
    const { tagType, page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;

    const queryBuilder = this.tagRepo
      .createQueryBuilder('tag')
      .leftJoinAndSelect('tag.buyer', 'buyer')
      .where('tag.sellerId = :sellerId', { sellerId })
      .orderBy('tag.taggedAt', 'DESC');

    if (tagType) {
      queryBuilder.andWhere('tag.tagType = :tagType', { tagType });
    }

    queryBuilder.skip(offset).take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 买家查看自己在某卖家的标签
   */
  async getMyTagFromSeller(buyerId: string, sellerId: string): Promise<CustomerTag | null> {
    return this.tagRepo.findOne({
      where: { sellerId, buyerId },
      relations: ['seller'],
    });
  }

  /**
   * 更新折扣率
   */
  async updateDiscountRate(
    sellerId: string,
    buyerId: string,
    discountRate: number
  ): Promise<void> {
    const tag = await this.tagRepo.findOne({ where: { sellerId, buyerId } });
    if (!tag) {
      throw new NotFoundError('客户标记不存在');
    }

    tag.discountRate = discountRate;
    await this.tagRepo.save(tag);
  }

  /**
   * 检查并自动标记（订单完成后调用）
   */
  async checkAndAutoTag(sellerId: string, buyerId: string): Promise<void> {
    // 检查是否已标记
    const existing = await this.tagRepo.findOne({ where: { sellerId, buyerId } });
    if (existing) {
      // 更新统计
      await this.updateCustomerStats(sellerId, buyerId);
      return;
    }

    // 统计历史交易
    const orders = await this.orderRepo.find({
      where: { sellerId, buyerId, status: 'completed' },
    });

    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

    // 自动标记条件：订单 >= 3 或累计金额 >= 10000
    if (totalOrders >= 3 || totalAmount >= 10000) {
      await this.tagRepo.save(
        this.tagRepo.create({
          sellerId,
          buyerId,
          tagType: 'old_customer',
          totalOrders,
          totalAmount,
          taggedAt: new Date(),
        })
      );
    }
  }

  /**
   * 更新客户统计
   */
  async updateCustomerStats(sellerId: string, buyerId: string): Promise<void> {
    const orders = await this.orderRepo.find({
      where: { sellerId, buyerId, status: 'completed' },
    });

    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

    await this.tagRepo.update({ sellerId, buyerId }, { totalOrders, totalAmount });
  }

  /**
   * 应用老客户折扣
   */
  async applyCustomerDiscount(
    sellerId: string,
    buyerId: string,
    originalPrice: number
  ): Promise<{
    hasDiscount: boolean;
    discountRate: number | null;
    finalPrice: number;
  }> {
    const tag = await this.tagRepo.findOne({ where: { sellerId, buyerId } });

    if (!tag || !tag.discountRate) {
      return {
        hasDiscount: false,
        discountRate: null,
        finalPrice: originalPrice,
      };
    }

    const finalPrice = originalPrice * (tag.discountRate / 100);

    return {
      hasDiscount: true,
      discountRate: tag.discountRate,
      finalPrice: Math.round(finalPrice * 100) / 100,
    };
  }

  /**
   * 获取买家的所有老客户标签
   */
  async getBuyerTags(
    buyerId: string,
    options?: { page?: number; pageSize?: number }
  ) {
    const { page = 1, pageSize = 20 } = options || {};
    const offset = (page - 1) * pageSize;

    const queryBuilder = this.tagRepo
      .createQueryBuilder('tag')
      .leftJoinAndSelect('tag.seller', 'seller')
      .where('tag.buyerId = :buyerId', { buyerId })
      .orderBy('tag.taggedAt', 'DESC');

    queryBuilder.skip(offset).take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}

export const customerTagService = new CustomerTagService();
