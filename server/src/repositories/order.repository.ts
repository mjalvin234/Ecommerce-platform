import { AppDataSource } from '../config/database.js';
import { Order, OrderStatus } from '../models/Order.js';
import { FindManyOptions, In } from 'typeorm';

export class OrderRepository {
  private repo = AppDataSource.getRepository(Order);

  async findById(id: string): Promise<Order | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['buyer', 'seller', 'negotiation'],
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.repo.findOne({
      where: { orderNumber },
      relations: ['buyer', 'seller'],
    });
  }

  async findByBuyerId(buyerId: string, status?: OrderStatus): Promise<Order[]> {
    const where: FindManyOptions<Order>['where'] = { buyerId };
    if (status) where.status = status;

    return this.repo.find({
      where,
      relations: ['seller'],
      order: { createdAt: 'DESC' },
    });
  }

  async findBySellerId(sellerId: string, status?: OrderStatus): Promise<Order[]> {
    const where: FindManyOptions<Order>['where'] = { sellerId };
    if (status) where.status = status;

    return this.repo.find({
      where,
      relations: ['buyer'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: Partial<Order>): Promise<Order> {
    const order = this.repo.create(data);
    return this.repo.save(order);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    await this.repo.update(id, { status });
    return this.findById(id);
  }

  async countByStatus(status: OrderStatus): Promise<number> {
    return this.repo.count({ where: { status } });
  }
}

export const orderRepository = new OrderRepository();
