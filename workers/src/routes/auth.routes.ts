import { Hono } from 'hono';
import { sign } from 'jsonwebtoken';
import { hash, compare } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const authRoutes = new Hono();

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
    const token = sign(
      { id: result.id, email: result.email, role: result.role },
      jwtSecret,
      { expiresIn: c.env.JWT_EXPIRES_IN || '7d' }
    );

    const refreshToken = sign(
      { id: result.id },
      jwtSecret,
      { expiresIn: c.env.JWT_REFRESH_EXPIRES_IN || '30d' }
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
    const { email, password, companyName } = await c.req.json();

    if (!email || !password || !companyName) {
      return c.json({
        success: false,
        error: { message: '请填写完整信息' },
      }, 400);
    }

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
      VALUES (?, ?, ?, ?, 'buyer', 'pending', ?, 60, ?, ?)
    `).bind(
      id,
      email.toLowerCase(),
      passwordHash,
      companyName,
      anonymousHash,
      new Date().toISOString(),
      new Date().toISOString()
    ).run();

    // 生成 Token
    const jwtSecret = c.env.JWT_SECRET;
    const token = sign(
      { id, email: email.toLowerCase(), role: 'buyer' },
      jwtSecret,
      { expiresIn: c.env.JWT_EXPIRES_IN || '7d' }
    );

    return c.json({
      success: true,
      data: {
        user: {
          id,
          email: email.toLowerCase(),
          companyName,
          role: 'buyer',
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
    const token = sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: c.env.JWT_EXPIRES_IN || '7d' }
    );

    const newRefreshToken = sign(
      { id: user.id },
      jwtSecret,
      { expiresIn: c.env.JWT_REFRESH_EXPIRES_IN || '30d' }
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

export default authRoutes;
