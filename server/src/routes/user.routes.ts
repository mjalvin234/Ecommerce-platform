import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { success } from '../utils/response.js';
import { AppDataSource } from '../config/database.js';
import { User } from '../models/User.js';

const router = Router();

/**
 * @route   GET /api/users/me
 * @desc    获取当前用户信息（包含收款账号）
 * @access  Private
 */
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: '用户不存在' },
      });
    }

    return success(res, {
      id: user.id,
      email: user.email,
      companyName: user.companyName,
      role: user.role,
      wechatOpenid: user.wechatOpenid,
      alipayAccount: user.alipayAccount,
      bankName: user.bankName,
      bankAccount: user.bankAccount,
      bankBranch: user.bankBranch,
      creditScore: user.creditScore,
      verificationStatus: user.verificationStatus,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/users/me/payment
 * @desc    更新收款账号
 * @access  Private
 */
router.put('/me/payment', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { alipayAccount, bankName, bankAccount, bankBranch } = req.body;

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: '用户不存在' },
      });
    }

    // 更新收款账号信息
    if (alipayAccount !== undefined) user.alipayAccount = alipayAccount;
    if (bankName !== undefined) user.bankName = bankName;
    if (bankAccount !== undefined) user.bankAccount = bankAccount;
    if (bankBranch !== undefined) user.bankBranch = bankBranch;

    await userRepo.save(user);

    return success(res, null, '收款账号更新成功');
  } catch (error) {
    next(error);
  }
});

export default router;
