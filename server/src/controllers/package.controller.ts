import { Request, Response, NextFunction } from 'express';
import { packageService } from '../services/package.service.js';
import { success } from '../utils/response.js';

export class PackageController {
  async createPackage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: { message: '包名称不能为空' },
        });
      }

      const pkg = await packageService.createPackage(userId, { name, description });
      return success(res, pkg, '创建成功');
    } catch (error) {
      next(error);
    }
  }

  async getPackages(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { status, page = '1', pageSize = '20' } = req.query;

      const result = await packageService.getPackages({
        sellerId: userId,
        status: status as any,
        page: parseInt(page as string, 10),
        pageSize: parseInt(pageSize as string, 10),
      });

      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getActivePackages(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = '1', pageSize = '20', sortBy = 'newest' } = req.query;

      const result = await packageService.getActivePackages({
        page: parseInt(page as string, 10),
        pageSize: parseInt(pageSize as string, 10),
        sortBy: sortBy as any,
      });

      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getPackage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const pkg = await packageService.getPackageDetail(id);
      return success(res, pkg);
    } catch (error) {
      next(error);
    }
  }

  async updatePackage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, description, packagePrice, discountRate, expiresAt } = req.body;

      if (packagePrice !== undefined) {
        await packageService.updatePackagePrice(id, packagePrice, discountRate);
      }

      return success(res, null, '更新成功');
    } catch (error) {
      next(error);
    }
  }

  async deletePackage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      await packageService.deletePackage(id, userId);
      return success(res, null, '删除成功');
    } catch (error) {
      next(error);
    }
  }

  async addPackageItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { inventoryId, quantity } = req.body;

      if (!inventoryId || !quantity) {
        return res.status(400).json({
          success: false,
          error: { message: '缺少必要参数' },
        });
      }

      const item = await packageService.addPackageItem(id, inventoryId, quantity);
      return success(res, item, '添加成功');
    } catch (error) {
      next(error);
    }
  }

  async removePackageItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, itemId } = req.params;
      await packageService.removePackageItem(id, itemId);
      return success(res, null, '移除成功');
    } catch (error) {
      next(error);
    }
  }

  async publishPackage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { expiresAt } = req.body;
      await packageService.publishPackage(id, expiresAt ? new Date(expiresAt) : undefined);
      return success(res, null, '发布成功');
    } catch (error) {
      next(error);
    }
  }

  async buyPackage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const order = await packageService.buyPackage(userId, id);
      return success(res, order, '购买成功');
    } catch (error) {
      next(error);
    }
  }
}

export const packageController = new PackageController();
