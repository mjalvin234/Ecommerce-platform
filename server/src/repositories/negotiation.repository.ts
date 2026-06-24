import { AppDataSource } from '../config/database.js';
import { Negotiation, NegotiationStatus } from '../models/Negotiation.js';
import { FindManyOptions } from 'typeorm';

export class NegotiationRepository {
  private repo = AppDataSource.getRepository(Negotiation);

  async findById(id: string): Promise<Negotiation | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['buyer', 'seller', 'inventory'],
    });
  }

  async findByBuyerId(buyerId: string, status?: NegotiationStatus): Promise<Negotiation[]> {
    const where: FindManyOptions<Negotiation>['where'] = { buyerId };
    if (status) where.status = status;

    return this.repo.find({
      where,
      relations: ['seller'],
      order: { createdAt: 'DESC' },
    });
  }

  async findBySellerId(sellerId: string, status?: NegotiationStatus): Promise<Negotiation[]> {
    const where: FindManyOptions<Negotiation>['where'] = { sellerId };
    if (status) where.status = status;

    return this.repo.find({
      where,
      relations: ['buyer'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: Partial<Negotiation>): Promise<Negotiation> {
    const negotiation = this.repo.create(data);
    return this.repo.save(negotiation);
  }

  async updateStatus(id: string, status: NegotiationStatus): Promise<Negotiation | null> {
    await this.repo.update(id, { status });
    return this.findById(id);
  }
}

export const negotiationRepository = new NegotiationRepository();
