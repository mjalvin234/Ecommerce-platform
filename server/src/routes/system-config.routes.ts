import { Router } from 'express';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware.js';
import { systemConfigRepository } from '../repositories/system-config.repository.js';

const router = Router();

/**
 * 获取系统配置（公开接口）
 * 任何人都可以获取联系方式等公开信息
 */
router.get('/public', async (_req, res) => {
  try {
    const config = await systemConfigRepository.getConfig();

    // 只返回公开信息
    res.json({
      success: true,
      data: {
        siteName: config.siteName,
        siteDescription: config.siteDescription,
        contactEmail: config.contactEmail,
        contactPhone: config.contactPhone,
        businessEmail: config.businessEmail,
        privacyEmail: config.privacyEmail,
        legalEmail: config.legalEmail,
        address: config.address,
        labInfo: config.labInfo,
        companyName: config.companyName,
        foundedYear: config.foundedYear,
        registeredCapital: config.registeredCapital,
        employeeCount: config.employeeCount,
        customerCount: config.customerCount,
        enableRegistration: config.enableRegistration,
        // 平台对公账户信息
        platformBankName: config.platformBankName,
        platformBankAccount: config.platformBankAccount,
        platformBankHolder: config.platformBankHolder,
      },
    });
  } catch (error) {
    console.error('获取系统配置失败:', error);
    res.status(500).json({
      success: false,
      error: { message: '获取系统配置失败' },
    });
  }
});

/**
 * 获取完整系统配置（管理员接口）
 */
router.get('/', authMiddleware, roleMiddleware('admin'), async (_req, res) => {
  try {
    const config = await systemConfigRepository.getConfig();
    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('获取系统配置失败:', error);
    res.status(500).json({
      success: false,
      error: { message: '获取系统配置失败' },
    });
  }
});

/**
 * 更新系统配置（管理员接口）
 */
router.put('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const config = await systemConfigRepository.updateConfig(req.body);
    res.json({
      success: true,
      data: config,
      message: '配置已保存',
    });
  } catch (error) {
    console.error('更新系统配置失败:', error);
    res.status(500).json({
      success: false,
      error: { message: '更新系统配置失败' },
    });
  }
});

/**
 * 重置为默认配置（管理员接口）
 */
router.post('/reset', authMiddleware, roleMiddleware('admin'), async (_req, res) => {
  try {
    const config = await systemConfigRepository.resetToDefault();
    res.json({
      success: true,
      data: config,
      message: '已重置为默认配置',
    });
  } catch (error) {
    console.error('重置系统配置失败:', error);
    res.status(500).json({
      success: false,
      error: { message: '重置系统配置失败' },
    });
  }
});

export default router;
