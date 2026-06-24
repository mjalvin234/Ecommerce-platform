import { AppDataSource } from '../config/database.js';
import { Favorite } from '../models/Favorite.js';
import { Inventory } from '../models/Inventory.js';
import { User } from '../models/User.js';
import { In } from 'typeorm';

export class FavoriteService {
  private favoriteRepo = AppDataSource.getRepository(Favorite);
  private inventoryRepo = AppDataSource.getRepository(Inventory);
  private userRepo = AppDataSource.getRepository(User);

  /**
   * 添加收藏
   */
  async addFavorite(userId: string, inventoryId: string, note?: string) {
    // 检查库存是否存在
    const inventory = await this.inventoryRepo.findOne({
      where: { id: inventoryId },
      relations: ['seller'],
    });

    if (!inventory) {
      throw new Error('库存不存在');
    }

    // 检查是否已收藏
    const existing = await this.favoriteRepo.findOne({
      where: { userId, inventoryId },
    });

    if (existing) {
      // 如果已有收藏，更新备注
      if (note !== undefined) {
        existing.note = note;
        await this.favoriteRepo.save(existing);
      }
      return existing;
    }

    // 创建新收藏
    const favorite = this.favoriteRepo.create({
      userId,
      inventoryId,
      note,
    });

    return this.favoriteRepo.save(favorite);
  }

  /**
   * 取消收藏
   */
  async removeFavorite(userId: string, inventoryId: string) {
    const result = await this.favoriteRepo.delete({ userId, inventoryId });
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * 获取用户收藏列表
   */
  async getUserFavorites(userId: string, options: {
    page?: number;
    pageSize?: number;
  } = {}) {
    const { page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;

    const [favorites, total] = await this.favoriteRepo.findAndCount({
      where: { userId },
      relations: ['inventory', 'inventory.seller'],
      order: { createdAt: 'DESC' },
      skip: offset,
      take: pageSize,
    });

    return {
      items: favorites.map(f => ({
        id: f.id,
        inventory: f.inventory ? {
          id: f.inventory.id,
          partNumber: f.inventory.partNumber,
          quantity: f.inventory.quantity,
          price: f.inventory.price,
          status: f.inventory.status,
          seller: f.inventory.seller ? {
            id: f.inventory.seller.id,
            companyName: f.inventory.seller.companyName,
          } : null,
        } : null,
        note: f.note,
        createdAt: f.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 检查是否已收藏
   */
  async isFavorited(userId: string, inventoryId: string): Promise<boolean> {
    const count = await this.favoriteRepo.count({
      where: { userId, inventoryId },
    });
    return count > 0;
  }

  /**
   * 批量检查收藏状态
   */
  async checkFavorites(userId: string, inventoryIds: string[]): Promise<Record<string, boolean>> {
    const favorites = await this.favoriteRepo.find({
      where: {
        userId,
        inventoryId: In(inventoryIds),
      },
      select: ['inventoryId'],
    });

    const result: Record<string, boolean> = {};
    inventoryIds.forEach(id => {
      result[id] = favorites.some(f => f.inventoryId === id);
    });

    return result;
  }

  /**
   * 获取用户收藏数量
   */
  async getFavoriteCount(userId: string): Promise<number> {
    return this.favoriteRepo.count({ where: { userId } });
  }
}

export const favoriteService = new FavoriteService();
