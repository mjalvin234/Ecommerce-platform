import { AppDataSource } from '../config/database.js';
import { TieredPrice } from '../models/TieredPrice.js';
import { Inventory } from '../models/Inventory.js';
import { NotFoundError, ValidationError } from '../middlewares/error.middleware.js';

export class TieredPriceService {
  private tieredPriceRepo = AppDataSource.getRepository(TieredPrice);
  private inventoryRepo = AppDataSource.getRepository(Inventory);

  /**
   * 设置阶梯价格（覆盖式）
   */
  async setTieredPrices(
    inventoryId: string,
    tiers: Array<{
      minQuantity: number;
      maxQuantity: number | null;
      unitPrice: number;
    }>
  ): Promise<TieredPrice[]> {
    const inventory = await this.inventoryRepo.findOne({ where: { id: inventoryId } });
    if (!inventory) {
      throw new NotFoundError('库存不存在');
    }

    // 验证区间有效性
    tiers.sort((a, b) => a.minQuantity - b.minQuantity);

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];

      if (tier.minQuantity < 1) {
        throw new ValidationError('最小数量必须大于0');
      }

      if (tier.maxQuantity !== null && tier.maxQuantity < tier.minQuantity) {
        throw new ValidationError('最大数量不能小于最小数量');
      }

      if (tier.unitPrice <= 0) {
        throw new ValidationError('单价必须大于0');
      }

      // 检查区间是否连续
      if (i > 0) {
        const prevTier = tiers[i - 1];
        if (prevTier.maxQuantity === null) {
          throw new ValidationError('只有最后一个区间可以不设上限');
        }
        if (prevTier.maxQuantity + 1 !== tier.minQuantity) {
          throw new ValidationError('数量区间必须连续');
        }
      }
    }

    // 删除旧的阶梯价格
    await this.tieredPriceRepo.delete({ inventoryId });

    // 创建新的阶梯价格
    const newTiers = tiers.map((tier, index) =>
      this.tieredPriceRepo.create({
        inventoryId,
        minQuantity: tier.minQuantity,
        maxQuantity: tier.maxQuantity,
        unitPrice: tier.unitPrice,
        discountRate: inventory.price > 0
          ? Math.round((tier.unitPrice / Number(inventory.price)) * 100)
          : null,
        sortOrder: index,
      })
    );

    // 更新库存标记
    await this.inventoryRepo.update(inventoryId, { hasTieredPrice: true } as any);

    return this.tieredPriceRepo.save(newTiers);
  }

  /**
   * 获取阶梯价格列表
   */
  async getTieredPrices(inventoryId: string): Promise<TieredPrice[]> {
    return this.tieredPriceRepo.find({
      where: { inventoryId },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * 根据数量计算单价
   */
  async calculatePrice(
    inventoryId: string,
    quantity: number
  ): Promise<{
    unitPrice: number;
    totalPrice: number;
    appliedTier: TieredPrice | null;
  }> {
    const inventory = await this.inventoryRepo.findOne({ where: { id: inventoryId } });
    if (!inventory) {
      throw new NotFoundError('库存不存在');
    }

    // 检查是否启用阶梯定价
    const hasTieredPrice = (inventory as any).hasTieredPrice;
    if (!hasTieredPrice) {
      return {
        unitPrice: Number(inventory.price),
        totalPrice: Number(inventory.price) * quantity,
        appliedTier: null,
      };
    }

    const tiers = await this.getTieredPrices(inventoryId);
    if (tiers.length === 0) {
      return {
        unitPrice: Number(inventory.price),
        totalPrice: Number(inventory.price) * quantity,
        appliedTier: null,
      };
    }

    // 查找适用的价格区间
    let appliedTier: TieredPrice | null = null;
    for (const tier of tiers) {
      if (quantity >= tier.minQuantity) {
        if (tier.maxQuantity === null || quantity <= tier.maxQuantity) {
          appliedTier = tier;
          break;
        }
      }
    }

    if (!appliedTier) {
      // 如果没有匹配的区间，使用基础价格
      return {
        unitPrice: Number(inventory.price),
        totalPrice: Number(inventory.price) * quantity,
        appliedTier: null,
      };
    }

    return {
      unitPrice: Number(appliedTier.unitPrice),
      totalPrice: Number(appliedTier.unitPrice) * quantity,
      appliedTier,
    };
  }

  /**
   * 删除阶梯价格
   */
  async deleteTieredPrices(inventoryId: string): Promise<void> {
    await this.tieredPriceRepo.delete({ inventoryId });
    await this.inventoryRepo.update(inventoryId, { hasTieredPrice: false } as any);
  }

  /**
   * 获取库存的最低阶梯价格
   */
  async getMinTieredPrice(inventoryId: string): Promise<number | null> {
    const tiers = await this.getTieredPrices(inventoryId);
    if (tiers.length === 0) return null;

    return Math.min(...tiers.map(t => Number(t.unitPrice)));
  }
}

export const tieredPriceService = new TieredPriceService();
