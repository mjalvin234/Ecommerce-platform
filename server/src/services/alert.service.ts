import { AppDataSource } from '../config/database.js';
import { InventoryAlert, AlertType } from '../models/InventoryAlert.js';
import { Inventory } from '../models/Inventory.js';
import { User } from '../models/User.js';
import { In, LessThan, MoreThanOrEqual } from 'typeorm';

export class AlertService {
  private alertRepo = AppDataSource.getRepository(InventoryAlert);
  private inventoryRepo = AppDataSource.getRepository(Inventory);
  private userRepo = AppDataSource.getRepository(User);

  /**
   * 创建预警
   */
  async createAlert(data: {
    userId: string;
    inventoryId: string;
    alertType: AlertType;
    title: string;
    message?: string;
    metadata?: Record<string, unknown>;
  }) {
    const alert = this.alertRepo.create(data);
    return this.alertRepo.save(alert);
  }

  /**
   * 获取用户预警列表
   */
  async getUserAlerts(userId: string, options: {
    alertType?: AlertType;
    isRead?: boolean;
    page?: number;
    pageSize?: number;
  } = {}) {
    const { alertType, isRead, page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;

    const queryBuilder = this.alertRepo
      .createQueryBuilder('alert')
      .leftJoinAndSelect('alert.inventory', 'inventory')
      .where('alert.userId = :userId', { userId })
      .orderBy('alert.createdAt', 'DESC');

    if (alertType) {
      queryBuilder.andWhere('alert.alertType = :alertType', { alertType });
    }

    if (isRead !== undefined) {
      queryBuilder.andWhere('alert.isRead = :isRead', { isRead });
    }

    queryBuilder.skip(offset).take(pageSize);

    const [alerts, total] = await queryBuilder.getManyAndCount();

    return {
      items: alerts.map(a => ({
        id: a.id,
        alertType: a.alertType,
        title: a.title,
        message: a.message,
        inventory: a.inventory ? {
          id: a.inventory.id,
          partNumber: a.inventory.partNumber,
        } : null,
        isRead: a.isRead,
        createdAt: a.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 标记预警已读
   */
  async markAsRead(userId: string, alertId: string) {
    const alert = await this.alertRepo.findOne({
      where: { id: alertId, userId },
    });

    if (!alert) {
      return false;
    }

    alert.isRead = true;
    await this.alertRepo.save(alert);
    return true;
  }

  /**
   * 标记所有预警已读
   */
  async markAllAsRead(userId: string) {
    await this.alertRepo.update(
      { userId, isRead: false },
      { isRead: true }
    );
    return true;
  }

  /**
   * 获取未读预警数量
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.alertRepo.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * 检查库存预警 - 低库存
   */
  async checkLowStockAlerts() {
    // 获取所有库存量低于阈值的商品
    const lowStockItems = await this.inventoryRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.seller', 'seller')
      .where('inv.status = :status', { status: 'active' })
      .andWhere('inv.quantity <= inv.minOrderQty') // 库存小于最小起订量视为低库存
      .getMany();

    const alerts: InventoryAlert[] = [];

    for (const item of lowStockItems) {
      // 检查是否已存在未读的低库存预警
      const existingAlert = await this.alertRepo.findOne({
        where: {
          userId: item.sellerId,
          inventoryId: item.id,
          alertType: 'low_stock',
          isRead: false,
        },
      });

      if (!existingAlert && item.seller) {
        const alert = this.alertRepo.create({
          userId: item.sellerId,
          inventoryId: item.id,
          alertType: 'low_stock',
          title: '库存不足预警',
          message: `型号 ${item.partNumber} 库存不足，当前库存: ${item.quantity}`,
          metadata: { currentQuantity: item.quantity },
        });
        alerts.push(await this.alertRepo.save(alert));
      }
    }

    return alerts;
  }

  /**
   * 创建价格变动预警（关注此商品的用户）
   */
  async createPriceChangeAlert(
    inventoryId: string,
    oldPrice: number,
    newPrice: number
  ) {
    const inventory = await this.inventoryRepo.findOne({
      where: { id: inventoryId },
    });

    if (!inventory) return [];

    // 找到收藏此商品的所有用户
    const favorites = await AppDataSource.getRepository('Favorite')
      .createQueryBuilder('fav')
      .where('fav.inventoryId = :inventoryId', { inventoryId })
      .getMany();

    const alerts: InventoryAlert[] = [];
    const priceChange = newPrice > oldPrice ? '上涨' : '下降';
    const changePercent = Math.abs((newPrice - oldPrice) / oldPrice * 100).toFixed(1);

    for (const fav of favorites) {
      const alert = this.alertRepo.create({
        userId: fav.userId,
        inventoryId,
        alertType: 'price_change',
        title: '收藏商品价格变动',
        message: `型号 ${inventory.partNumber} 价格${priceChange} ${changePercent}%，新价格: ¥${newPrice}`,
        metadata: { oldPrice, newPrice, changePercent },
      });
      alerts.push(await this.alertRepo.save(alert));
    }

    return alerts;
  }

  /**
   * 清理已读超过30天的预警
   */
  async cleanupOldAlerts() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.alertRepo.delete({
      isRead: true,
      createdAt: LessThan(thirtyDaysAgo),
    });

    return result.affected || 0;
  }
}

export const alertService = new AlertService();
