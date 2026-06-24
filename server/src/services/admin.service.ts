import { AppDataSource } from '../config/database.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { Inventory } from '../models/Inventory.js';
import { Negotiation } from '../models/Negotiation.js';
import { Certification } from '../models/Certification.js';
import { Between, LessThan, MoreThanOrEqual } from 'typeorm';

export class AdminService {
  private userRepo = AppDataSource.getRepository(User);
  private orderRepo = AppDataSource.getRepository(Order);
  private inventoryRepo = AppDataSource.getRepository(Inventory);
  private negotiationRepo = AppDataSource.getRepository(Negotiation);
  private certRepo = AppDataSource.getRepository(Certification);

  /**
   * 获取用户列表
   */
  async getUsers(options: {
    role?: 'buyer' | 'seller' | 'admin';
    verificationStatus?: 'pending' | 'verified' | 'rejected';
    page?: number;
    pageSize?: number;
  }) {
    const { role, verificationStatus, page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;

    const queryBuilder = this.userRepo
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC');

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }
    if (verificationStatus) {
      queryBuilder.andWhere('user.verificationStatus = :verificationStatus', { verificationStatus });
    }

    queryBuilder.skip(offset).take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items: items.map(u => ({
        id: u.id,
        email: u.email,
        companyName: u.companyName,
        role: u.role,
        verificationStatus: u.verificationStatus,
        creditScore: u.creditScore,
        anonymousHash: u.anonymousHash,
        createdAt: u.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取用户详情
   */
  async getUserDetail(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) return null;

    // 手动查询统计数据
    const buyerOrders = await this.orderRepo.count({ where: { buyerId: userId } });
    const sellerOrders = await this.orderRepo.count({ where: { sellerId: userId } });
    const inventories = await this.inventoryRepo.count({ where: { sellerId: userId } });

    return {
      id: user.id,
      email: user.email,
      companyName: user.companyName,
      role: user.role,
      verificationStatus: user.verificationStatus,
      creditScore: user.creditScore,
      anonymousHash: user.anonymousHash,
      createdAt: user.createdAt,
      stats: {
        buyerOrders,
        sellerOrders,
        inventories,
      },
    };
  }

  /**
   * 更新用户状态
   */
  async updateUserStatus(userId: string, data: {
    verificationStatus?: 'pending' | 'verified' | 'rejected';
    creditScore?: number;
  }) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return null;

    if (data.verificationStatus) {
      user.verificationStatus = data.verificationStatus;
    }
    if (data.creditScore !== undefined) {
      user.creditScore = data.creditScore;
    }

    await this.userRepo.save(user);
    return user;
  }

  /**
   * 获取数据统计
   */
  async getStatistics() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // 用户统计
    const totalUsers = await this.userRepo.count();
    const buyerCount = await this.userRepo.count({ where: { role: 'buyer' } });
    const sellerCount = await this.userRepo.count({ where: { role: 'seller' } });
    const pendingVerification = await this.certRepo.count({ where: { status: 'pending' } });

    // 今日新增用户
    const newUsersToday = await this.userRepo.count({
      where: { createdAt: MoreThanOrEqual(today) },
    });

    // 订单统计
    const totalOrders = await this.orderRepo.count();
    const pendingPaymentOrders = await this.orderRepo.count({ where: { status: 'awaiting_payment' } });
    const pendingShipmentOrders = await this.orderRepo.count({ where: { status: 'paid_awaiting_shipment' } });
    const completedOrders = await this.orderRepo.count({ where: { status: 'completed' } });

    // 今日订单
    const ordersToday = await this.orderRepo.count({
      where: { createdAt: MoreThanOrEqual(today) },
    });

    // 库存统计
    const totalInventory = await this.inventoryRepo.count();
    const activeInventory = await this.inventoryRepo.count({ where: { status: 'active' } });

    // 交易金额统计
    const completedOrdersData = await this.orderRepo.find({
      where: { status: 'completed' },
      select: ['totalAmount'],
    });
    const totalTransactionAmount = completedOrdersData.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    // 今日交易额
    const todayOrders = await this.orderRepo.find({
      where: {
        status: 'completed',
        createdAt: MoreThanOrEqual(today),
      },
      select: ['totalAmount'],
    });
    const todayTransactionAmount = todayOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    // 本月交易额
    const monthOrders = await this.orderRepo.find({
      where: {
        status: 'completed',
        createdAt: MoreThanOrEqual(thisMonth),
      },
      select: ['totalAmount'],
    });
    const monthTransactionAmount = monthOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    // 议价统计
    const totalNegotiations = await this.negotiationRepo.count();
    const pendingNegotiations = await this.negotiationRepo.count({ where: { status: 'pending' } });

    return {
      users: {
        total: totalUsers,
        buyers: buyerCount,
        sellers: sellerCount,
        newToday: newUsersToday,
        pendingVerification,
      },
      orders: {
        total: totalOrders,
        newToday: ordersToday,
        pendingPayment: pendingPaymentOrders,
        pendingShipment: pendingShipmentOrders,
        completed: completedOrders,
      },
      transactions: {
        totalAmount: totalTransactionAmount,
        todayAmount: todayTransactionAmount,
        monthAmount: monthTransactionAmount,
      },
      inventory: {
        total: totalInventory,
        active: activeInventory,
      },
      negotiations: {
        total: totalNegotiations,
        pending: pendingNegotiations,
      },
    };
  }

  /**
   * 获取订单趋势数据
   * @param days 天数（7, 30, 90）
   */
  async getOrderTrend(days: number = 7) {
    const result = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await this.orderRepo.count({
        where: {
          createdAt: Between(date, nextDate),
        },
      });

      result.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }

    return result;
  }

  /**
   * 获取热门型号排行
   */
  async getTopModels(limit: number = 10) {
    const result = await this.inventoryRepo
      .createQueryBuilder('inv')
      .select('inv.partNumber', 'partNumber')
      .addSelect('COUNT(*)', 'count')
      .groupBy('inv.partNumber')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map(r => ({
      partNumber: r.partNumber,
      count: Number(r.count),
    }));
  }

  /**
   * 获取所有订单（管理员用）
   */
  async getAllOrders(options: {
    status?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { status, page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;

    const queryBuilder = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.inventory', 'inventory')
      .leftJoinAndSelect('order.buyer', 'buyer')
      .leftJoinAndSelect('order.seller', 'seller')
      .orderBy('order.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    queryBuilder.skip(offset).take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items: items.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        partNumber: o.inventory?.partNumber,
        quantity: o.quantity,
        totalAmount: o.totalAmount,
        status: o.status,
        orderType: o.orderType,
        buyer: o.buyer ? {
          id: o.buyer.id,
          companyName: o.buyer.companyName,
        } : null,
        seller: o.seller ? {
          id: o.seller.id,
          companyName: o.seller.companyName,
        } : null,
        createdAt: o.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 删除用户
   */
  async deleteUser(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return null;

    // 检查是否有关联数据
    const buyerOrders = await this.orderRepo.count({ where: { buyerId: userId } });
    const sellerOrders = await this.orderRepo.count({ where: { sellerId: userId } });
    const inventories = await this.inventoryRepo.count({ where: { sellerId: userId } });

    if (buyerOrders > 0 || sellerOrders > 0 || inventories > 0) {
      // 软删除：标记为已禁用
      user.verificationStatus = 'rejected';
      user.anonymousHash = `DELETED-${user.anonymousHash}`;
      await this.userRepo.save(user);
      return { softDelete: true };
    }

    // 硬删除
    await this.userRepo.remove(user);
    return { softDelete: false };
  }

  /**
   * 获取认证审核统计
   */
  async getCertificationStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const pending = await this.certRepo.count({ where: { status: 'pending' } });
    const approvedToday = await this.certRepo.count({
      where: {
        status: 'approved',
        updatedAt: MoreThanOrEqual(today),
      },
    });
    const rejectedToday = await this.certRepo.count({
      where: {
        status: 'rejected',
        updatedAt: MoreThanOrEqual(today),
      },
    });

    return {
      pending,
      approvedToday,
      rejectedToday,
    };
  }
}

export const adminService = new AdminService();
