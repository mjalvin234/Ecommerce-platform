import { AppDataSource } from '../config/database.js';
import { Certification, CertificationStatus, CertificationType } from '../models/Certification.js';

export class CertificationRepository {
  private repo = AppDataSource.getRepository(Certification);

  /**
   * 根据ID查找
   */
  async findById(id: string): Promise<Certification | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['user', 'reviewer'],
    });
  }

  /**
   * 根据用户ID查找认证记录
   */
  async findByUserId(userId: string): Promise<Certification | null> {
    return this.repo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 获取待审核列表
   */
  async findPending(options?: { limit?: number; offset?: number }): Promise<[Certification[], number]> {
    const queryBuilder = this.repo
      .createQueryBuilder('cert')
      .where('cert.status = :status', { status: 'pending' })
      .leftJoinAndSelect('cert.user', 'user')
      .orderBy('cert.createdAt', 'ASC');

    if (options?.limit) queryBuilder.take(options.limit);
    if (options?.offset) queryBuilder.skip(options.offset);

    return queryBuilder.getManyAndCount();
  }

  /**
   * 获取所有认证列表（管理员）
   */
  async findAll(options?: {
    status?: CertificationStatus;
    limit?: number;
    offset?: number;
  }): Promise<[Certification[], number]> {
    const queryBuilder = this.repo
      .createQueryBuilder('cert')
      .leftJoinAndSelect('cert.user', 'user')
      .orderBy('cert.createdAt', 'DESC');

    if (options?.status) {
      queryBuilder.andWhere('cert.status = :status', { status: options.status });
    }
    if (options?.limit) queryBuilder.take(options.limit);
    if (options?.offset) queryBuilder.skip(options.offset);

    return queryBuilder.getManyAndCount();
  }

  /**
   * 创建认证申请
   */
  async create(data: Partial<Certification>): Promise<Certification> {
    const cert = this.repo.create(data);
    return this.repo.save(cert);
  }

  /**
   * 更新认证状态
   */
  async updateStatus(
    id: string,
    status: CertificationStatus,
    data?: {
      reviewedBy?: string;
      rejectReason?: string;
    }
  ): Promise<Certification | null> {
    const cert = await this.findById(id);
    if (!cert) return null;

    cert.status = status;
    cert.reviewedAt = new Date();
    if (data?.reviewedBy) cert.reviewedBy = data.reviewedBy;
    if (data?.rejectReason) cert.rejectReason = data.rejectReason;

    return this.repo.save(cert);
  }

  /**
   * 检查用户是否已认证
   */
  async isUserVerified(userId: string): Promise<boolean> {
    const cert = await this.repo.findOne({
      where: { userId, status: 'approved' },
    });
    return !!cert;
  }
}

export const certificationRepository = new CertificationRepository();
