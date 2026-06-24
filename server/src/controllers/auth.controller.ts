import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { success } from '../utils/response.js';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress || '';
      const result = await authService.register(req.body, ipAddress);
      return success(res, result, '注册成功', 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';
      const result = await authService.login(req.body, ipAddress, userAgent);
      return success(res, result, '登录成功');
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await authService.getProfile(userId);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 请求重置密码
   * POST /api/auth/forgot-password
   */
  async requestPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || '';
      const result = await authService.requestPasswordReset(email, ipAddress);
      return success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 重置密码
   * POST /api/auth/reset-password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, code, newPassword } = req.body;
      const result = await authService.resetPassword(email, code, newPassword);
      return success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 刷新Token
   * POST /api/auth/refresh
   */
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: { message: '缺少刷新令牌' },
        });
      }

      const result = await authService.refreshToken(refreshToken);
      return success(res, result, '令牌刷新成功');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
