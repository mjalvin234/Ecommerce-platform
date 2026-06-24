import { certificationRepository } from '../repositories/certification.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { CertificationType } from '../models/Certification.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../middlewares/error.middleware.js';
import { messageService } from './message.service.js';
import { encrypt, validateIdCard } from '../utils/encryption.js';

export class CertificationService {
  /**
   * 提交认证申请
   */
  async submit(userId: string, data: {
    type: CertificationType;
    companyName: string;
    creditCode: string;
    legalPerson: string;
    legalIdCard: string;
    contactPhone: string;
    contactEmail?: string;
    businessAddress?: string;
    businessLicense: string;
    legalIdCardFront: string;
    legalIdCardBack: string;
    bankAccountLicense?: string;
    otherDocuments?: string[];
  }) {
    // 检查是否已有认证记录
    const existing = await certificationRepository.findByUserId(userId);
    if (existing) {
      if (existing.status === 'pending') {
        throw new ValidationError('您已提交认证申请，请等待审核');
      }
      if (existing.status === 'approved') {
        throw new ValidationError('您已完成认证');
      }
    }

    // 验证身份证号格式
    if (!validateIdCard(data.legalIdCard)) {
      throw new ValidationError('身份证号格式不正确');
    }

    // 加密身份证号
    const encryptedIdCard = encrypt(data.legalIdCard);

    // 创建认证申请
    const cert = await certificationRepository.create({
      id: crypto.randomUUID(),
      userId,
      ...data,
      legalIdCard: encryptedIdCard, // 使用加密后的身份证号
      status: 'pending',
    });

    return {
      id: cert.id,
      status: cert.status,
      createdAt: cert.createdAt,
    };
  }

  /**
   * 获取用户的认证状态
   */
  async getMyCertification(userId: string) {
    const cert = await certificationRepository.findByUserId(userId);
    if (!cert) {
      return null;
    }

    return {
      id: cert.id,
      type: cert.type,
      status: cert.status,
      companyName: cert.companyName,
      reviewedAt: cert.reviewedAt,
      rejectReason: cert.rejectReason,
      createdAt: cert.createdAt,
    };
  }

  /**
   * 获取认证详情
   */
  async getDetail(userId: string, certId: string) {
    const cert = await certificationRepository.findById(certId);
    if (!cert) {
      throw new NotFoundError('认证记录不存在');
    }

    // 只能查看自己的认证，管理员可以查看所有
    if (cert.userId !== userId) {
      throw new ForbiddenError('无权查看此认证');
    }

    return cert;
  }

  /**
   * 获取待审核列表（管理员）
   */
  async getPendingList(page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;
    const [items, total] = await certificationRepository.findPending({
      limit: pageSize,
      offset,
    });

    return {
      items: items.map(cert => ({
        id: cert.id,
        userId: cert.userId,
        userName: cert.user?.companyName,
        userEmail: cert.user?.email,
        type: cert.type,
        companyName: cert.companyName,
        creditCode: cert.creditCode,
        status: cert.status,
        createdAt: cert.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 审核通过
   */
  async approve(certId: string, reviewerId: string) {
    const cert = await certificationRepository.findById(certId);
    if (!cert) {
      throw new NotFoundError('认证记录不存在');
    }

    if (cert.status !== 'pending') {
      throw new ValidationError('该认证已处理');
    }

    // 更新认证状态
    await certificationRepository.updateStatus(certId, 'approved', {
      reviewedBy: reviewerId,
    });

    // 更新用户认证状态
    await userRepository.updateVerificationStatus(cert.userId, 'verified');

    // 发送通知
    await messageService.sendSystemAnnouncement([cert.userId], '认证审核结果', '您的企业认证已通过审核，现在可以进行交易了。');

    return { success: true };
  }

  /**
   * 审核拒绝
   */
  async reject(certId: string, reviewerId: string, reason: string) {
    const cert = await certificationRepository.findById(certId);
    if (!cert) {
      throw new NotFoundError('认证记录不存在');
    }

    if (cert.status !== 'pending') {
      throw new ValidationError('该认证已处理');
    }

    // 更新认证状态
    await certificationRepository.updateStatus(certId, 'rejected', {
      reviewedBy: reviewerId,
      rejectReason: reason,
    });

    // 发送通知
    await messageService.sendSystemAnnouncement([cert.userId], '认证审核结果', `您的企业认证未通过审核。原因：${reason}`);

    return { success: true };
  }

  /**
   * 重新提交认证
   */
  async resubmit(userId: string, data: any) {
    const existing = await certificationRepository.findByUserId(userId);
    if (!existing || existing.status !== 'rejected') {
      throw new ValidationError('无法重新提交认证');
    }

    // 创建新的认证申请
    return this.submit(userId, data);
  }
}

export const certificationService = new CertificationService();
