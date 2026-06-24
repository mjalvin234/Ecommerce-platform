import { Router, Request, Response } from 'express';
import { emailService } from '../services/email.service.js';
import { loginLogService } from '../services/login-log.service.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * 发送验证码
 * POST /api/email/send-code
 */
router.post('/send-code', async (req: Request, res: Response) => {
  try {
    const { email, type = 'register' } = req.body;

    if (!email) {
      return res.status(400).json({ message: '请提供邮箱地址' });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: '邮箱格式不正确' });
    }

    // 获取客户端IP
    const ipAddress = req.ip || req.socket.remoteAddress || '';

    const result = await emailService.sendVerificationCode(
      email,
      type,
      ipAddress
    );

    res.json({
      message: '验证码已发送，请查收邮件',
      expiresIn: result.expiresIn,
    });
  } catch (error) {
    console.error('发送验证码失败:', error);
    res.status(500).json({ message: '发送验证码失败，请稍后重试' });
  }
});

/**
 * 验证验证码
 * POST /api/email/verify-code
 */
router.post('/verify-code', async (req: Request, res: Response) => {
  try {
    const { email, code, type = 'register' } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: '请提供邮箱和验证码' });
    }

    const result = await emailService.verifyCode(email, code, type);

    if (result.valid) {
      res.json({ message: result.message, verified: true });
    } else {
      res.status(400).json({ message: result.message, verified: false });
    }
  } catch (error) {
    console.error('验证码验证失败:', error);
    res.status(500).json({ message: '验证失败，请稍后重试' });
  }
});

/**
 * 获取登录历史
 * GET /api/email/login-history
 */
router.get('/login-history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    const { limit = 10, offset = 0 } = req.query;

    const [logs, total] = await loginLogService.getUserLoginHistory(userId, {
      limit: Number(limit),
      offset: Number(offset),
    });

    res.json({ logs, total });
  } catch (error) {
    console.error('获取登录历史失败:', error);
    res.status(500).json({ message: '获取登录历史失败' });
  }
});

/**
 * 获取登录统计
 * GET /api/email/login-stats
 */
router.get('/login-stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    const stats = await loginLogService.getLoginStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('获取登录统计失败:', error);
    res.status(500).json({ message: '获取登录统计失败' });
  }
});

export default router;
