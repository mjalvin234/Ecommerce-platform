import { v4 as uuidv4 } from 'uuid';
import { userRepository } from '../repositories/user.repository.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { generateToken, generateRefreshToken } from '../utils/token.js';
import { RegisterInput, LoginInput } from '../validators/auth.validator.js';
import { UnauthorizedError, ValidationError } from '../middlewares/error.middleware.js';
import { emailService } from './email.service.js';
import { loginLogService } from './login-log.service.js';

export interface AuthResult {
  user: {
    id: string;
    email: string;
    companyName: string;
    role: string;
    anonymousHash: string;
    verificationStatus: string;
    emailVerified?: boolean;
  };
  token: string;
  refreshToken: string;
  isAnomalousLogin?: boolean;
  anomalousReasons?: string[];
}

export class AuthService {
  async register(data: RegisterInput, ipAddress?: string): Promise<AuthResult> {
    // 检查邮箱是否已存在
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new ValidationError('邮箱已被注册');
    }

    // 如果提供了验证码，验证邮箱
    let emailVerified = false;
    if (data.emailCode) {
      const result = await emailService.verifyCode(data.email, data.emailCode, 'register');
      emailVerified = result.valid;
    }

    // 创建用户
    const passwordHash = await hashPassword(data.password);
    const anonymousHash = `${data.role === 'buyer' ? 'BYR' : 'SLR'}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const user = await userRepository.create({
      id: uuidv4(),
      email: data.email,
      passwordHash,
      companyName: data.companyName,
      role: data.role,
      anonymousHash,
      verificationStatus: 'pending',
      emailVerified,
      emailVerifiedAt: emailVerified ? new Date() : undefined,
    });

    // 发送欢迎邮件
    if (emailVerified) {
      await emailService.sendNotification(
        data.email,
        '注册成功',
        `<p>欢迎加入芯核交易中心！您的账号已注册成功。</p>
         <p>请完善企业信息以开始使用平台功能。</p>`
      );
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      companyName: user.companyName,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
      companyName: user.companyName,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        companyName: user.companyName,
        role: user.role,
        anonymousHash: user.anonymousHash,
        verificationStatus: user.verificationStatus,
        emailVerified,
      },
      token,
      refreshToken,
    };
  }

  async login(data: LoginInput, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    const user = await userRepository.findByEmail(data.email);

    if (!user) {
      throw new UnauthorizedError('邮箱或密码错误');
    }

    const isValid = await comparePassword(data.password, user.passwordHash);
    if (!isValid) {
      // 异步记录失败日志，不阻塞响应
      loginLogService.logLogin({
        userId: user.id,
        ipAddress: ipAddress || '',
        userAgent: userAgent || '',
        status: 'failed',
        failReason: '密码错误',
      }).catch(() => {});
      throw new UnauthorizedError('邮箱或密码错误');
    }

    // 异步检测异常登录和记录成功日志，不阻塞主流程
    const logPromise = loginLogService.logLogin({
      userId: user.id,
      ipAddress: ipAddress || '',
      userAgent: userAgent || '',
      status: 'success',
    }).catch(() => {});

    const anomalousPromise = loginLogService.detectAnomalousLogin(
      user.id,
      ipAddress || '',
      userAgent || ''
    ).catch(() => ({ isAnomalous: false, reasons: [] }));

    // 生成token（主要操作）
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      companyName: user.companyName,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
      companyName: user.companyName,
    });

    // 等待异常检测结果（但不等待日志写入）
    const anomalousCheck = await anomalousPromise;

    return {
      user: {
        id: user.id,
        email: user.email,
        companyName: user.companyName,
        role: user.role,
        anonymousHash: user.anonymousHash,
        verificationStatus: user.verificationStatus,
        emailVerified: user.emailVerified,
      },
      token,
      refreshToken,
      isAnomalousLogin: anomalousCheck.isAnomalous,
      anomalousReasons: anomalousCheck.reasons,
    };
  }

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('用户不存在');
    }

    return {
      id: user.id,
      email: user.email,
      companyName: user.companyName,
      role: user.role,
      anonymousHash: user.anonymousHash,
      verificationStatus: user.verificationStatus,
      creditScore: user.creditScore,
      createdAt: user.createdAt,
    };
  }

  /**
   * 请求重置密码
   * 发送验证码到用户邮箱
   */
  async requestPasswordReset(email: string, ipAddress?: string): Promise<{ success: boolean; message: string }> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // 为了安全，不透露用户是否存在
      return { success: true, message: '如果该邮箱已注册，将收到验证码' };
    }

    // 发送验证码
    await emailService.sendVerificationCode(email, 'reset_password', ipAddress);

    return { success: true, message: '验证码已发送到您的邮箱' };
  }

  /**
   * 重置密码
   * 使用验证码重置密码
   */
  async resetPassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    // 验证验证码
    const verifyResult = await emailService.verifyCode(email, code, 'reset_password');
    if (!verifyResult.valid) {
      throw new ValidationError(verifyResult.message);
    }

    // 查找用户
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new ValidationError('用户不存在');
    }

    // 更新密码
    const passwordHash = await hashPassword(newPassword);
    await userRepository.update(user.id, { passwordHash });

    return { success: true, message: '密码重置成功，请使用新密码登录' };
  }

  /**
   * 刷新Token
   * 使用 refreshToken 获取新的 token
   */
  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      // 验证 refreshToken
      const { verifyToken } = await import('../utils/token.js');
      const payload = verifyToken(refreshToken);

      // 检查用户是否仍然有效
      const user = await userRepository.findById(payload.id);
      if (!user) {
        throw new UnauthorizedError('用户不存在');
      }

      // 生成新的 token 和 refreshToken
      const newToken = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
      });

      const newRefreshToken = generateRefreshToken({
        id: user.id,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
      });

      return { token: newToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new UnauthorizedError('无效的刷新令牌');
    }
  }
}

export const authService = new AuthService();
