import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { sign, type SignOptions } from 'jsonwebtoken';
import { hash, compare } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middlewares/auth.middleware';

const authRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 登录
authRoutes.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({
        success: false,
        error: { message: '请输入邮箱和密码' },
      }, 400);
    }

    // 查询用户
    const result = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL'
    ).bind(email.toLowerCase()).first();

    if (!result) {
      return c.json({
        success: false,
        error: { message: '邮箱或密码错误' },
      }, 401);
    }

    // 验证密码
    const isValid = await compare(password, result.password_hash as string);

    if (!isValid) {
      return c.json({
        success: false,
        error: { message: '邮箱或密码错误' },
      }, 401);
    }

    // 生成 Token
    const jwtSecret = c.env.JWT_SECRET;
    const tokenOptions: SignOptions = { expiresIn: '7d' };
    const refreshOptions: SignOptions = { expiresIn: '30d' };

    const token = sign(
      { id: result.id, email: result.email, role: result.role },
      jwtSecret,
      tokenOptions
    );

    const refreshToken = sign(
      { id: result.id },
      jwtSecret,
      refreshOptions
    );

    // 更新最后登录时间
    await c.env.DB.prepare(
      'UPDATE users SET last_login_at = ? WHERE id = ?'
    ).bind(new Date().toISOString(), result.id).run();

    return c.json({
      success: true,
      data: {
        user: {
          id: result.id,
          email: result.email,
          companyName: result.company_name,
          role: result.role,
          verificationStatus: result.verification_status,
          creditScore: result.credit_score,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('登录错误:', error);
    return c.json({
      success: false,
      error: { message: '登录失败' },
    }, 500);
  }
});

// 注册
authRoutes.post('/register', async (c) => {
  try {
    const { email, password, companyName, role } = await c.req.json();

    if (!email || !password || !companyName) {
      return c.json({
        success: false,
        error: { message: '请填写完整信息' },
      }, 400);
    }

    // 验证角色
    const userRole = role === 'seller' ? 'seller' : 'buyer';

    // 检查邮箱是否已存在
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first();

    if (existing) {
      return c.json({
        success: false,
        error: { message: '该邮箱已注册' },
      }, 400);
    }

    // 创建用户
    const id = uuidv4();
    const passwordHash = await hash(password, 12);
    const anonymousHash = `USR-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    await c.env.DB.prepare(`
      INSERT INTO users (id, email, password_hash, company_name, role, verification_status, anonymous_hash, credit_score, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, 60, ?, ?)
    `).bind(
      id,
      email.toLowerCase(),
      passwordHash,
      companyName,
      userRole,
      anonymousHash,
      new Date().toISOString(),
      new Date().toISOString()
    ).run();

    // 生成 Token
    const jwtSecret = c.env.JWT_SECRET;
    const registerTokenOptions: SignOptions = { expiresIn: '7d' };

    const token = sign(
      { id, email: email.toLowerCase(), role: userRole },
      jwtSecret,
      registerTokenOptions
    );

    return c.json({
      success: true,
      data: {
        user: {
          id,
          email: email.toLowerCase(),
          companyName,
          role: userRole,
          verificationStatus: 'pending',
          creditScore: 60,
        },
        token,
      },
    });
  } catch (error) {
    console.error('注册错误:', error);
    return c.json({
      success: false,
      error: { message: '注册失败' },
    }, 500);
  }
});

// 获取当前用户信息
authRoutes.get('/profile', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({
        success: false,
        error: { message: '未授权' },
      }, 401);
    }

    const result = await c.env.DB.prepare(
      'SELECT id, email, company_name, role, verification_status, credit_score FROM users WHERE id = ? AND deleted_at IS NULL'
    ).bind(user.id).first();

    if (!result) {
      return c.json({
        success: false,
        error: { message: '用户不存在' },
      }, 404);
    }

    return c.json({
      success: true,
      data: {
        id: result.id,
        email: result.email,
        companyName: result.company_name,
        role: result.role,
        verificationStatus: result.verification_status,
        creditScore: result.credit_score,
      },
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return c.json({
      success: false,
      error: { message: '获取用户信息失败' },
    }, 500);
  }
});

// 刷新令牌
authRoutes.post('/refresh', async (c) => {
  try {
    const { refreshToken } = await c.req.json();

    if (!refreshToken) {
      return c.json({
        success: false,
        error: { message: '缺少刷新令牌' },
      }, 400);
    }

    const jwtSecret = c.env.JWT_SECRET;
    const decoded = require('jsonwebtoken').verify(refreshToken, jwtSecret) as { id: string };

    // 查询用户
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL'
    ).bind(decoded.id).first();

    if (!user) {
      return c.json({
        success: false,
        error: { message: '用户不存在' },
      }, 401);
    }

    // 生成新令牌
    const newTokenOptions: SignOptions = { expiresIn: '7d' };
    const newRefreshOptions: SignOptions = { expiresIn: '30d' };

    const token = sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      newTokenOptions
    );

    const newRefreshToken = sign(
      { id: user.id },
      jwtSecret,
      newRefreshOptions
    );

    return c.json({
      success: true,
      data: { token, refreshToken: newRefreshToken },
    });
  } catch (error) {
    return c.json({
      success: false,
      error: { message: '刷新令牌无效' },
    }, 401);
  }
});

// 绑定微信
authRoutes.post('/wechat/bind', authMiddleware, async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: { message: '请先登录' } }, 401);
  }

  const { code } = await c.req.json();

  // 模拟微信绑定（实际需要调用微信 API）
  try {
    // 这里应该调用微信 API 获取 openid
    // 目前返回模拟数据
    return c.json({
      success: true,
      data: { message: '微信绑定成功' },
    });
  } catch (error) {
    return c.json({ success: false, error: { message: '微信绑定失败' } }, 500);
  }
});

// 解绑微信
authRoutes.post('/wechat/unbind', authMiddleware, async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: { message: '请先登录' } }, 401);
  }

  try {
    // 清除用户的微信 openid
    await c.env.DB.prepare(`
      UPDATE users SET wechat_openid = NULL, updated_at = ? WHERE id = ?
    `).bind(new Date().toISOString(), user.id).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: { message: '解绑失败' } }, 500);
  }
});

export default authRoutes;
