import { AppDataSource } from '../config/database.js';
import { WechatBinding, WechatLoginSession } from '../models/WechatBinding.js';
import { User } from '../models/User.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const wechatBindingRepo = () => AppDataSource.getRepository(WechatBinding);
const loginSessionRepo = () => AppDataSource.getRepository(WechatLoginSession);
const userRepo = () => AppDataSource.getRepository(User);

// 微信配置（实际使用时从环境变量读取）
const WECHAT_APPID = process.env.WECHAT_APPID || '';
const WECHAT_SECRET = process.env.WECHAT_SECRET || '';

export interface WechatQrcodeResult {
  scene: string;
  ticket: string;
  qrcodeUrl: string;
  expiresAt: Date;
}

export interface WechatLoginStatus {
  status: string;
  user?: { id: string; email: string; companyName: string; role: string };
  token?: string;
}

export const wechatService = {
  async createLoginQrcode(): Promise<WechatQrcodeResult> {
    const scene = uuidv4().replace(/-/g, '').substring(0, 16);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟有效

    // 调用微信API获取二维码（模拟）
    const ticket = `ticket_${scene}`;
    const qrcodeUrl = `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${ticket}`;

    const session = loginSessionRepo().create({
      scene,
      ticket,
      qrcodeUrl,
      status: 'pending',
      expiresAt
    });

    await loginSessionRepo().save(session);

    return { scene, ticket, qrcodeUrl, expiresAt };
  },

  async checkLoginStatus(scene: string): Promise<WechatLoginStatus> {
    const session = await loginSessionRepo().findOne({ where: { scene } });

    if (!session) {
      return { status: 'invalid' };
    }

    if (session.expiresAt < new Date()) {
      session.status = 'expired';
      await loginSessionRepo().save(session);
      return { status: 'expired' };
    }

    if (session.status === 'confirmed' && session.userId) {
      // 生成JWT token
      const user = await userRepo().findOne({ where: { id: session.userId } });
      if (user) {
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role, companyName: user.companyName },
          process.env.JWT_SECRET || 'secret',
          { expiresIn: '7d' }
        );
        return {
          status: 'confirmed',
          user: { id: user.id, email: user.email, companyName: user.companyName, role: user.role },
          token
        };
      }
    }

    return { status: session.status };
  },

  async bindWechat(userId: string, code: string): Promise<WechatBinding> {
    // 通过code换取openid（实际调用微信API）
    const openid = `mock_openid_${code}`;

    // 检查是否已绑定
    const existing = await wechatBindingRepo().findOne({ where: { openid } });
    if (existing) {
      throw new Error('该微信已绑定其他账号');
    }

    const userBinding = await wechatBindingRepo().findOne({ where: { userId } });
    if (userBinding) {
      throw new Error('该账号已绑定微信');
    }

    const binding = wechatBindingRepo().create({
      userId,
      openid,
      nickname: '微信用户',
      headimgurl: ''
    });

    return await wechatBindingRepo().save(binding);
  },

  async unbindWechat(userId: string): Promise<boolean> {
    const binding = await wechatBindingRepo().findOne({ where: { userId } });
    if (!binding) {
      throw new Error('未绑定微信');
    }

    binding.unbindAt = new Date();
    await wechatBindingRepo().save(binding);
    await wechatBindingRepo().delete({ userId });

    return true;
  },

  async getBinding(userId: string): Promise<WechatBinding | null> {
    return await wechatBindingRepo().findOne({ where: { userId } });
  },

  // 模拟微信扫码回调（实际使用时由微信服务器调用）
  async handleScan(scene: string, openid: string): Promise<void> {
    const session = await loginSessionRepo().findOne({ where: { scene } });
    if (!session || session.status !== 'pending') {
      return;
    }

    session.status = 'scanned';
    session.openid = openid;
    await loginSessionRepo().save(session);

    // 检查openid是否已绑定账号
    const binding = await wechatBindingRepo().findOne({ where: { openid } });
    if (binding) {
      // 已绑定，自动登录
      session.status = 'confirmed';
      session.userId = binding.userId;
      await loginSessionRepo().save(session);
    }
  },

  // 模拟用户确认登录
  async confirmLogin(scene: string): Promise<void> {
    const session = await loginSessionRepo().findOne({ where: { scene } });
    if (!session || session.status !== 'scanned') {
      throw new Error('无效的登录会话');
    }

    // 创建新用户（首次登录）
    const binding = await wechatBindingRepo().findOne({ where: { openid: session.openid! } });
    if (!binding) {
      const passwordHash = await bcrypt.hash(uuidv4(), 10);
      const user = userRepo().create({
        email: `wechat_${session.openid!.substring(0, 8)}@wechat.user`,
        passwordHash,
        companyName: '微信用户',
        role: 'buyer',
        verificationStatus: 'pending',
        anonymousHash: `WX-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
      });
      await userRepo().save(user);

      // 创建绑定
      const newBinding = wechatBindingRepo().create({
        userId: user.id,
        openid: session.openid!
      });
      await wechatBindingRepo().save(newBinding);

      session.userId = user.id;
    } else {
      session.userId = binding.userId;
    }

    session.status = 'confirmed';
    await loginSessionRepo().save(session);
  }
};
