import { AppDataSource } from '../config/database.js';
import { SearchHistory } from '../models/SearchHistory.js';
import { Inventory } from '../models/Inventory.js';
import { MoreThan } from 'typeorm';

const searchHistoryRepo = () => AppDataSource.getRepository(SearchHistory);
const inventoryRepo = () => AppDataSource.getRepository(Inventory);

export const searchService = {
  async saveHistory(userId: string, keyword: string, resultCount: number) {
    const history = searchHistoryRepo().create({
      userId,
      keyword,
      resultCount
    });
    return await searchHistoryRepo().save(history);
  },

  async getHistory(userId: string, limit = 10) {
    return await searchHistoryRepo().find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit
    });
  },

  async clearHistory(userId: string) {
    const result = await searchHistoryRepo().delete({ userId });
    return result.affected || 0;
  },

  async getHotKeywords(limit = 10) {
    // 获取最近7天的热门搜索词
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await searchHistoryRepo()
      .createQueryBuilder('sh')
      .select('sh.keyword', 'keyword')
      .addSelect('COUNT(*)', 'count')
      .where('sh.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
      .groupBy('sh.keyword')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map((r: { keyword: string; count: string }) => ({ keyword: r.keyword, count: parseInt(r.count) }));
  },

  async getHotInventories(limit = 10) {
    // 获取热门库存（按浏览量或交易量排序，这里用库存数量作为热度指标）
    return await inventoryRepo().find({
      where: { status: 'active', availableQty: MoreThan(0) },
      order: { quantity: 'DESC', createdAt: 'DESC' },
      take: limit,
      relations: ['seller']
    });
  },

  async getPromotedInventories(limit = 5) {
    // 获取推广库存（取最新的库存作为推广）
    return await inventoryRepo().find({
      where: { status: 'active', availableQty: MoreThan(0) },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['seller']
    });
  },

  async getSimilarInventories(partNumber: string, limit = 5) {
    // 相似型号匹配（模糊匹配型号）
    const baseModel = partNumber.replace(/[-\d]+$/, '').toUpperCase();

    return await inventoryRepo()
      .createQueryBuilder('inv')
      .where('inv.status = :status', { status: 'active' })
      .andWhere('inv.availableQty > 0')
      .andWhere('inv.partNumber != :partNumber', { partNumber })
      .andWhere('UPPER(inv.partNumber) LIKE :pattern', { pattern: `${baseModel}%` })
      .orderBy('inv.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }
};
