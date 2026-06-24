import { AppDataSource } from '../config/database.js';
import { Inventory } from '../models/Inventory.js';
import { Like, MoreThan, FindManyOptions } from 'typeorm';

/**
 * 转义 Like 查询中的通配符，防止 SQL 注入和信息泄露
 */
function escapeLikeQuery(query: string): string {
  return query.replace(/[%_\\]/g, '\\$&');
}

export class InventoryRepository {
  private repo = AppDataSource.getRepository(Inventory);

  async findById(id: string): Promise<Inventory | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['seller'],
    });
  }

  async findBySellerId(sellerId: string): Promise<Inventory[]> {
    return this.repo.find({
      where: { sellerId },
      order: { createdAt: 'DESC' },
    });
  }

  async search(query: string, options?: { limit?: number; offset?: number }): Promise<[Inventory[], number]> {
    const escapedQuery = escapeLikeQuery(query);
    const findOptions: FindManyOptions<Inventory> = {
      where: [
        { partNumber: Like(`%${escapedQuery}%`), status: 'active', availableQty: MoreThan(0) },
      ],
      relations: ['seller'],
      order: { createdAt: 'DESC' },
    };

    if (options?.limit) {
      findOptions.take = options.limit;
    }
    if (options?.offset) {
      findOptions.skip = options.offset;
    }

    return this.repo.findAndCount(findOptions);
  }

  async findAll(options?: { limit?: number; offset?: number }): Promise<[Inventory[], number]> {
    const findOptions: FindManyOptions<Inventory> = {
      where: { status: 'active', availableQty: MoreThan(0) },
      relations: ['seller'],
      order: { createdAt: 'DESC' },
    };

    if (options?.limit) findOptions.take = options.limit;
    if (options?.offset) findOptions.skip = options.offset;

    return this.repo.findAndCount(findOptions);
  }

  async create(data: Partial<Inventory>): Promise<Inventory> {
    const inventory = this.repo.create(data);
    return this.repo.save(inventory);
  }

  async update(id: string, data: Partial<Inventory>): Promise<Inventory | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async updateQuantity(id: string, quantity: number): Promise<void> {
    await this.repo.update(id, { quantity, availableQty: quantity });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return result.affected ? result.affected > 0 : false;
  }
}

export const inventoryRepository = new InventoryRepository();
