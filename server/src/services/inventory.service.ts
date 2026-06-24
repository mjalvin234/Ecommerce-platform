import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../config/database.js';
import { inventoryRepository } from '../repositories/inventory.repository.js';
import { CreateInventoryInput, UpdateInventoryInput } from '../validators/inventory.validator.js';
import { NotFoundError, ForbiddenError } from '../middlewares/error.middleware.js';

export class InventoryService {
  async search(query: string = '', page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;

    const [items, total] = query
      ? await inventoryRepository.search(query, { limit: pageSize, offset })
      : await inventoryRepository.findAll({ limit: pageSize, offset });

    // 脱敏处理：隐藏卖家真实信息
    const sanitizedItems = items.map((item) => ({
      id: item.id,
      partNumber: item.partNumber,
      quantity: item.quantity,
      availableQty: item.availableQty,
      year: item.year,
      price: item.price,
      eccn: item.eccn,
      leadTime: item.leadTime,
      status: item.status,
      supplier: item.seller?.anonymousHash || '匿名供应商',
    }));

    return {
      items: sanitizedItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getById(id: string) {
    const inventory = await inventoryRepository.findById(id);
    if (!inventory) {
      throw new NotFoundError('库存不存在');
    }

    return {
      id: inventory.id,
      partNumber: inventory.partNumber,
      quantity: inventory.quantity,
      availableQty: inventory.availableQty,
      year: inventory.year,
      price: inventory.price,
      eccn: inventory.eccn,
      leadTime: inventory.leadTime,
      status: inventory.status,
      supplier: inventory.seller?.anonymousHash || '匿名供应商',
    };
  }

  async getBySeller(sellerId: string) {
    const items = await inventoryRepository.findBySellerId(sellerId);
    return items.map((item) => ({
      id: item.id,
      partNumber: item.partNumber,
      quantity: item.quantity,
      availableQty: item.availableQty,
      year: item.year,
      price: item.price,
      eccn: item.eccn,
      leadTime: item.leadTime,
      status: item.status,
      createdAt: item.createdAt,
    }));
  }

  async create(sellerId: string, data: CreateInventoryInput) {
    const inventory = await inventoryRepository.create({
      id: uuidv4(),
      sellerId,
      partNumber: data.partNumber,
      quantity: data.quantity,
      availableQty: data.quantity,
      year: data.year,
      price: data.price,
      eccn: data.eccn,
      leadTime: data.leadTime,
      status: 'active',
    });

    return inventory;
  }

  async update(userId: string, inventoryId: string, data: UpdateInventoryInput) {
    const inventory = await inventoryRepository.findById(inventoryId);
    if (!inventory) {
      throw new NotFoundError('库存不存在');
    }

    if (inventory.sellerId !== userId) {
      throw new ForbiddenError('无权修改此库存');
    }

    // 如果修改了 quantity，需要同步调整 availableQty，保持锁定量不变
    // 锁定量 = quantity - availableQty
    // 新 availableQty = 新 quantity - 锁定量
    const updateData: any = { ...data };
    if (data.quantity !== undefined) {
      const lockedQty = inventory.quantity - inventory.availableQty;
      const newAvailableQty = data.quantity - lockedQty;
      if (newAvailableQty < 0) {
        throw new ForbiddenError('新库存量不能低于已锁定数量（' + lockedQty + '件已被订单锁定）');
      }
      updateData.availableQty = newAvailableQty;
    }

    const updated = await inventoryRepository.update(inventoryId, updateData);

    return updated;
  }

  async delete(userId: string, inventoryId: string) {
    const inventory = await inventoryRepository.findById(inventoryId);
    if (!inventory) {
      throw new NotFoundError('库存不存在');
    }

    if (inventory.sellerId !== userId) {
      throw new ForbiddenError('无权删除此库存');
    }

    // 清理关联的 pending 议价
    const negotiationRepo = AppDataSource.getRepository(
      (await import('../models/Negotiation.js')).Negotiation
    );
    await negotiationRepo.update(
      { inventoryId, status: 'pending' },
      { status: 'rejected' }
    );

    await inventoryRepository.delete(inventoryId);
    return { success: true };
  }

  /**
   * 上架商品
   */
  async activate(userId: string, inventoryId: string) {
    const inventory = await inventoryRepository.findById(inventoryId);
    if (!inventory) {
      throw new NotFoundError('库存不存在');
    }

    if (inventory.sellerId !== userId) {
      throw new ForbiddenError('无权操作此库存');
    }

    if (inventory.status === 'active') {
      return { success: true, message: '商品已处于上架状态' };
    }

    // 检查库存是否足够
    if (inventory.availableQty <= 0) {
      throw new ForbiddenError('库存不足，无法上架');
    }

    const updated = await inventoryRepository.update(inventoryId, { status: 'active' });
    return {
      success: true,
      status: updated?.status,
      message: '商品已上架',
    };
  }

  /**
   * 下架商品
   */
  async deactivate(userId: string, inventoryId: string) {
    const inventory = await inventoryRepository.findById(inventoryId);
    if (!inventory) {
      throw new NotFoundError('库存不存在');
    }

    if (inventory.sellerId !== userId) {
      throw new ForbiddenError('无权操作此库存');
    }

    if (inventory.status === 'inactive') {
      return { success: true, message: '商品已处于下架状态' };
    }

    const updated = await inventoryRepository.update(inventoryId, { status: 'inactive' });

    // 取消关联的待处理议价
    const negotiationRepo = AppDataSource.getRepository(
      (await import('../models/Negotiation.js')).Negotiation
    );
    await negotiationRepo.update(
      { inventoryId, status: 'pending' },
      { status: 'rejected' }
    );

    return {
      success: true,
      status: updated?.status,
      message: '商品已下架',
    };
  }
}

export const inventoryService = new InventoryService();
