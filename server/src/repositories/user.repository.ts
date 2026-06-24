import { AppDataSource } from '../config/database.js';
import { User } from '../models/User.js';

export class UserRepository {
  private repo = AppDataSource.getRepository(User);

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async updateVerificationStatus(id: string, status: 'pending' | 'verified' | 'rejected'): Promise<User | null> {
    return this.update(id, { verificationStatus: status });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return result.affected ? result.affected > 0 : false;
  }
}

export const userRepository = new UserRepository();
