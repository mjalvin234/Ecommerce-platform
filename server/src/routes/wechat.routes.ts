import { Router, Request, Response } from 'express';
import { wechatService } from '../services/wechat.service.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// 获取登录二维码
router.get('/qrcode', async (req: Request, res: Response) => {
  try {
    const result = await wechatService.createLoginQrcode();
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// 查询登录状态
router.get('/status/:scene', async (req: Request, res: Response) => {
  try {
    const result = await wechatService.checkLoginStatus(req.params.scene);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// 绑定微信
router.post('/bind', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { code } = req.body;
    const binding = await wechatService.bindWechat(user.id, code);
    res.json({ success: true, data: binding });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// 解绑微信
router.delete('/unbind', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    await wechatService.unbindWechat(user.id);
    res.json({ success: true, data: { message: '解绑成功' } });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// 获取绑定信息
router.get('/binding', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const binding = await wechatService.getBinding(user.id);
    res.json({ success: true, data: binding });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// 模拟扫码（开发测试用）
router.post('/simulate/scan', async (req: Request, res: Response) => {
  try {
    const { scene, openid } = req.body;
    await wechatService.handleScan(scene, openid);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// 模拟确认登录（开发测试用）
router.post('/simulate/confirm', async (req: Request, res: Response) => {
  try {
    const { scene } = req.body;
    await wechatService.confirmLogin(scene);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export default router;
