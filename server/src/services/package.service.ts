import { AppDataSource } from '../config/database.js';
import { InventoryPackage, PackageStatus } from '../models/InventoryPackage.js';
import { PackageItem } from '../models/PackageItem.js';
import { Inventory } from '../models/Inventory.js';
import { Order } from '../models/Order.js';
import { NotFoundError, ValidationError } from '../middlewares/error.middleware.js';
import { In, DataSource } from 'typeorm';

export class PackageService {
  private packageRepo = AppDataSource.getRepository(InventoryPackage);
  private itemRepo = AppDataSource.getRepository(PackageItem);
  private inventoryRepo = AppDataSource.getRepository(Inventory);
  private orderRepo = AppDataSource.getRepository(Order);

  /**
   * 创建库存包
   */
  async createPackage(
    sellerId: string,
    data: { name: string; description?: string }
  ): Promise<InventoryPackage> {
    const pkg = this.packageRepo.create({
      sellerId,
      name: data.name,
      description: data.description,
      totalItems: 0,
      totalValue: 0,
      packagePrice: 0,
      status: 'draft',
    });
    return this.packageRepo.save(pkg);
  }

  /**
   * 添加物料到包
   */
  async addPackageItem(
    packageId: string,
    inventoryId: string,
    quantity: number
  ): Promise<PackageItem> {
    const pkg = await this.packageRepo.findOne({ where: { id: packageId } });
    if (!pkg) {
      throw new NotFoundError('库存包不存在');
    }

    if (pkg.status !== 'draft') {
      throw new ValidationError('只能编辑草稿状态的库存包');
    }

    const inventory = await this.inventoryRepo.findOne({ where: { id: inventoryId } });
    if (!inventory) {
      throw new NotFoundError('库存物料不存在');
    }

    if (inventory.sellerId !== pkg.sellerId) {
      throw new ValidationError('只能添加自己的库存物料');
    }

    if (inventory.availableQty < quantity) {
      throw new ValidationError('库存数量不足');
    }

    // 检查是否已存在
    const existing = await this.itemRepo.findOne({
      where: { packageId, inventoryId },
    });
    if (existing) {
      throw new ValidationError('该物料已存在于包中');
    }

    const subtotal = Number(inventory.price) * quantity;

    const item = this.itemRepo.create({
      packageId,
      inventoryId,
      quantity,
      unitPrice: inventory.price,
      subtotal,
    });

    await this.itemRepo.save(item);

    // 更新包统计
    await this.updatePackageStats(packageId);

    return item;
  }

  /**
   * 从包移除物料
   */
  async removePackageItem(packageId: string, itemId: string): Promise<void> {
    const pkg = await this.packageRepo.findOne({ where: { id: packageId } });
    if (!pkg) {
      throw new NotFoundError('库存包不存在');
    }

    if (pkg.status !== 'draft') {
      throw new ValidationError('只能编辑草稿状态的库存包');
    }

    await this.itemRepo.delete({ id: itemId, packageId });
    await this.updatePackageStats(packageId);
  }

  /**
   * 更新包统计信息
   */
  private async updatePackageStats(packageId: string): Promise<void> {
    const items = await this.itemRepo.find({ where: { packageId } });

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = items.reduce((sum, item) => sum + Number(item.subtotal), 0);

    await this.packageRepo.update(packageId, {
      totalItems,
      totalValue,
    });
  }

  /**
   * 更新打包价格
   */
  async updatePackagePrice(
    packageId: string,
    packagePrice: number,
    discountRate?: number
  ): Promise<void> {
    const pkg = await this.packageRepo.findOne({ where: { id: packageId } });
    if (!pkg) {
      throw new NotFoundError('库存包不存在');
    }

    if (pkg.status !== 'draft') {
      throw new ValidationError('只能编辑草稿状态的库存包');
    }

    await this.packageRepo.update(packageId, {
      packagePrice,
      discountRate: discountRate ?? undefined,
    });
  }

  /**
   * 发布包
   */
  async publishPackage(packageId: string, expiresAt?: Date): Promise<void> {
    const pkg = await this.packageRepo.findOne({ where: { id: packageId } });
    if (!pkg) {
      throw new NotFoundError('库存包不存在');
    }

    if (pkg.status !== 'draft') {
      throw new ValidationError('只能发布草稿状态的库存包');
    }

    if (pkg.totalItems === 0) {
      throw new ValidationError('库存包为空，无法发布');
    }

    if (pkg.packagePrice <= 0) {
      throw new ValidationError('请设置打包价格');
    }

    await this.packageRepo.update(packageId, {
      status: 'active',
      expiresAt: expiresAt ?? undefined,
    });
  }

  /**
   * 获取包列表
   */
  async getPackages(options: {
    sellerId?: string;
    status?: PackageStatus;
    page?: number;
    pageSize?: number;
  }) {
    const { sellerId, status, page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;

    const queryBuilder = this.packageRepo
      .createQueryBuilder('pkg')
      .leftJoinAndSelect('pkg.items', 'item')
      .leftJoinAndSelect('item.inventory', 'inventory')
      .orderBy('pkg.createdAt', 'DESC');

    if (sellerId) {
      queryBuilder.andWhere('pkg.sellerId = :sellerId', { sellerId });
    }
    if (status) {
      queryBuilder.andWhere('pkg.status = :status', { status });
    }

    queryBuilder.skip(offset).take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items: items.map(pkg => ({
        ...pkg,
        discountRate: pkg.totalValue > 0
          ? Math.round((Number(pkg.packagePrice) / Number(pkg.totalValue)) * 100) / 100
          : null,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取包详情
   */
  async getPackageDetail(packageId: string) {
    const pkg = await this.packageRepo.findOne({
      where: { id: packageId },
      relations: ['items', 'items.inventory', 'seller'],
    });

    if (!pkg) {
      throw new NotFoundError('库存包不存在');
    }

    return {
      ...pkg,
      discountRate: pkg.totalValue > 0
        ? Math.round((Number(pkg.packagePrice) / Number(pkg.totalValue)) * 100) / 100
        : null,
    };
  }

  /**
   * 购买包
   */
  async buyPackage(buyerId: string, packageId: string): Promise<Order> {
    const pkg = await this.packageRepo.findOne({
      where: { id: packageId },
      relations: ['items', 'items.inventory'],
    });

    if (!pkg) {
      throw new NotFoundError('库存包不存在');
    }

    if (pkg.status !== 'active') {
      throw new ValidationError('该库存包不可购买');
    }

    if (pkg.expiresAt && new Date() > pkg.expiresAt) {
      throw new ValidationError('该库存包已过期');
    }

    if (pkg.sellerId === buyerId) {
      throw new ValidationError('不能购买自己的库存包');
    }

    // 检查库存
    for (const item of pkg.items) {
      if (item.inventory.availableQty < item.quantity) {
        throw new ValidationError(`物料 ${item.inventory.partNumber} 库存不足`);
      }
    }

    // 使用事务
    await AppDataSource.transaction(async (manager) => {
      // 扣减库存
      for (const item of pkg.items) {
        await manager.update(Inventory, item.inventoryId, {
          availableQty: () => `available_qty - ${item.quantity}`,
        });
      }

      // 更新包状态
      await manager.update(InventoryPackage, packageId, {
        status: 'sold',
        soldTo: buyerId,
        soldAt: new Date(),
      });
    });

    // 创建订单（这里简化处理，实际可能需要创建多个订单或特殊订单）
    const orderNumber = `PKG${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const order = this.orderRepo.create({
      buyerId,
      sellerId: pkg.sellerId,
      orderNumber,
      partNumber: `打包-${pkg.name}`,
      inventoryId: pkg.items[0]?.inventoryId || '',
      quantity: pkg.totalItems,
      unitPrice: pkg.packagePrice,
      totalAmount: pkg.packagePrice,
      status: 'awaiting_payment',
      orderType: 'direct',
    });

    return this.orderRepo.save(order);
  }

  /**
   * 删除包
   */
  async deletePackage(packageId: string, sellerId: string): Promise<void> {
    const pkg = await this.packageRepo.findOne({ where: { id: packageId } });
    if (!pkg) {
      throw new NotFoundError('库存包不存在');
    }

    if (pkg.sellerId !== sellerId) {
      throw new ValidationError('无权删除此库存包');
    }

    if (pkg.status === 'sold') {
      throw new ValidationError('已售出的库存包不能删除');
    }

    await this.itemRepo.delete({ packageId });
    await this.packageRepo.delete(packageId);
  }

  /**
   * 获取活跃的打包列表（买家视角）
   */
  async getActivePackages(options: { page?: number; pageSize?: number; sortBy?: 'discount' | 'newest' }) {
    const { page = 1, pageSize = 20, sortBy = 'newest' } = options;
    const offset = (page - 1) * pageSize;

    const queryBuilder = this.packageRepo
      .createQueryBuilder('pkg')
      .where('pkg.status = :status', { status: 'active' })
      .andWhere('(pkg.expiresAt IS NULL OR pkg.expiresAt > :now)', { now: new Date() });

    if (sortBy === 'discount') {
      queryBuilder.orderBy('pkg.packagePrice / pkg.totalValue', 'ASC');
    } else {
      queryBuilder.orderBy('pkg.createdAt', 'DESC');
    }

    queryBuilder.skip(offset).take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items: items.map(pkg => ({
        ...pkg,
        discountRate: pkg.totalValue > 0
          ? Math.round((Number(pkg.packagePrice) / Number(pkg.totalValue)) * 100)
          : 100,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}

export const packageService = new PackageService();
