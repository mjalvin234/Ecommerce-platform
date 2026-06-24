import nodemailer from 'nodemailer';
import { AppDataSource } from '../config/database.js';
import { EmailVerification } from '../models/EmailVerification.js';

/**
 * 邮件服务配置
 */
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

/**
 * 默认邮件配置（开发环境使用Ethereal测试邮箱）
 */
const getEmailConfig = (): EmailConfig => {
  // 生产环境配置
  if (process.env.SMTP_HOST) {
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
      from: process.env.SMTP_FROM || 'noreply@example.com',
    };
  }

  // 开发环境返回空配置，会使用模拟邮件
  return {
    host: '',
    port: 465,
    secure: true,
    auth: { user: '', pass: '' },
    from: 'noreply@xinhe-trading.com',
  };
};

/**
 * 邮件服务
 */
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig;
  private verificationRepo = AppDataSource.getRepository(EmailVerification);

  constructor() {
    this.config = getEmailConfig();
    this.initTransporter();
  }

  /**
   * 初始化邮件传输器
   */
  private async initTransporter() {
    if (this.config.host) {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: this.config.auth,
      });
    } else {
      // 开发环境使用Ethereal测试邮箱
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.log('📧 邮件服务已启动（测试模式 - Ethereal）');
        console.log(`📧 测试邮箱: ${testAccount.user}`);
      } catch (error) {
        console.log('📧 邮件服务：未配置SMTP，验证码将输出到控制台');
      }
    }
  }

  /**
   * 生成6位验证码
   */
  private generateCode(): string {
    return Math.random().toString().slice(2, 8);
  }

  /**
   * 发送验证码邮件
   */
  async sendVerificationCode(
    email: string,
    type: 'register' | 'reset_password' | 'change_email' = 'register',
    ipAddress: string = ''
  ): Promise<{ code: string; expiresIn: number }> {
    // 生成验证码
    const code = this.generateCode();
    const expiresIn = 10 * 60 * 1000; // 10分钟过期
    const expiresAt = new Date(Date.now() + expiresIn);

    // 保存到数据库
    const verification = this.verificationRepo.create({
      email,
      code,
      type,
      expiresAt,
      used: false,
      ipAddress,
    });
    await this.verificationRepo.save(verification);

    // 邮件内容
    const subjects: Record<string, string> = {
      register: '【芯核交易中心】注册验证码',
      reset_password: '【芯核交易中心】密码重置验证码',
      change_email: '【芯核交易中心】邮箱变更验证码',
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb; text-align: center;">芯核交易中心</h2>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 16px; color: #374151;">您好！</p>
          <p style="font-size: 16px; color: #374151;">您的验证码是：</p>
          <div style="font-size: 32px; font-weight: bold; color: #2563eb; text-align: center; padding: 20px; letter-spacing: 8px;">
            ${code}
          </div>
          <p style="font-size: 14px; color: #6b7280;">验证码将在10分钟后过期，请尽快使用。</p>
        </div>
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          如果您没有请求此验证码，请忽略此邮件。
        </p>
      </div>
    `;

    // 发送邮件
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: this.config.from,
          to: email,
          subject: subjects[type],
          html,
        });

        // 开发环境输出测试链接
        if (process.env.NODE_ENV !== 'production') {
          console.log(`📧 验证码邮件已发送: ${email}`);
          console.log(`📧 验证码: ${code}`);
          console.log(`📧 预览链接: ${nodemailer.getTestMessageUrl(info)}`);
        }
      } catch (error) {
        console.error('邮件发送失败:', error);
        // 失败时仍然返回验证码（开发环境）
        if (process.env.NODE_ENV !== 'production') {
          console.log(`📧 [开发模式] 验证码: ${code}`);
        }
      }
    } else {
      // 无邮件配置时直接输出
      console.log(`📧 验证码: ${code} (邮箱: ${email})`);
    }

    return { code, expiresIn };
  }

  /**
   * 验证验证码
   */
  async verifyCode(
    email: string,
    code: string,
    type: 'register' | 'reset_password' | 'change_email' = 'register'
  ): Promise<{ valid: boolean; message: string }> {
    const verification = await this.verificationRepo.findOne({
      where: { email, code, type, used: false },
      order: { createdAt: 'DESC' },
    });

    if (!verification) {
      return { valid: false, message: '验证码无效' };
    }

    if (verification.expiresAt < new Date()) {
      return { valid: false, message: '验证码已过期' };
    }

    // 标记为已使用
    verification.used = true;
    await this.verificationRepo.save(verification);

    return { valid: true, message: '验证成功' };
  }

  /**
   * 发送通知邮件
   */
  async sendNotification(
    email: string,
    subject: string,
    content: string
  ): Promise<boolean> {
    if (!this.transporter) {
      console.log(`📧 通知邮件: ${email} - ${subject}`);
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: this.config.from,
        to: email,
        subject: `【芯核交易中心】${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb; text-align: center;">芯核交易中心</h2>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              ${content}
            </div>
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              此邮件由系统自动发送，请勿回复。
            </p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error('通知邮件发送失败:', error);
      return false;
    }
  }

  /**
   * 发送订单状态通知
   */
  async sendOrderStatusNotification(
    email: string,
    orderNo: string,
    status: string,
    message: string
  ): Promise<boolean> {
    const statusMap: Record<string, string> = {
      awaiting_payment: '待付款',
      paid_awaiting_shipment: '已付款，等待发货',
      qa_in_transit: '质检中',
      shipped_to_buyer: '已发货',
      completed: '已完成',
      cancelled: '已取消',
    };

    return this.sendNotification(
      email,
      `订单状态更新`,
      `
        <p style="font-size: 16px; color: #374151;">您的订单状态已更新</p>
        <p style="font-size: 14px; color: #6b7280;">订单号：${orderNo}</p>
        <p style="font-size: 16px; color: #2563eb; font-weight: bold;">
          当前状态：${statusMap[status] || status}
        </p>
        <p style="font-size: 14px; color: #374151; margin-top: 16px;">${message}</p>
      `
    );
  }
}

export const emailService = new EmailService();
