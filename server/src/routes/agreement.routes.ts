import { Router, Request, Response, NextFunction } from 'express';
import { agreementService } from '../services/agreement.service.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { success } from '../utils/response.js';
import { AgreementType } from '../models/Agreement.js';

const router = Router();

// 所有路由需要认证
router.use(authMiddleware);

/**
 * 获取承诺函模板
 * GET /api/agreements/template/:type
 */
router.get('/template/:type', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params;
    if (type !== 'seller' && type !== 'buyer') {
      return res.status(400).json({
        success: false,
        error: { message: '无效的承诺函类型' },
      });
    }

    const companyName = req.user!.companyName || '未填写公司名称';
    const template = agreementService.getTemplate(type as AgreementType, companyName);

    return success(res, template);
  } catch (error) {
    next(error);
  }
});

/**
 * 签署承诺函
 * POST /api/agreements/sign
 */
router.post('/sign', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.body;
    if (type !== 'seller' && type !== 'buyer') {
      return res.status(400).json({
        success: false,
        error: { message: '无效的承诺函类型' },
      });
    }

    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const companyName = req.user!.companyName || '未填写公司名称';

    const agreement = await agreementService.signAgreement(
      req.user!.id,
      type as AgreementType,
      ipAddress,
      companyName
    );

    return success(res, {
      id: agreement.id,
      type: agreement.type,
      version: agreement.version,
      signedAt: agreement.signedAt,
    }, '承诺函签署成功');
  } catch (error) {
    next(error);
  }
});

/**
 * 获取用户已签署的承诺函列表
 * GET /api/agreements
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agreements = await agreementService.getUserAgreements(req.user!.id);
    return success(res, agreements.map(a => ({
      id: a.id,
      type: a.type,
      version: a.version,
      signedAt: a.signedAt,
      ipAddress: a.ipAddress,
    })));
  } catch (error) {
    next(error);
  }
});

/**
 * 检查是否已签署承诺函
 * GET /api/agreements/check/:type
 */
router.get('/check/:type', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params;
    if (type !== 'seller' && type !== 'buyer') {
      return res.status(400).json({
        success: false,
        error: { message: '无效的承诺函类型' },
      });
    }

    const signed = await agreementService.checkAgreementSigned(
      req.user!.id,
      type as AgreementType
    );

    return success(res, { signed });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取承诺函详情
 * GET /api/agreements/:id
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agreement = await agreementService.getAgreementById(
      req.params.id,
      req.user!.id
    );
    return success(res, agreement);
  } catch (error) {
    next(error);
  }
});

export default router;
