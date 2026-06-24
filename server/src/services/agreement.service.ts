import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../config/database.js';
import { Agreement, AgreementType } from '../models/Agreement.js';
import { NotFoundError, ValidationError } from '../middlewares/error.middleware.js';

/**
 * 承诺函模板
 */
const AGREEMENT_TEMPLATES = {
  seller: {
    version: '1.0',
    title: '卖家责任承诺函',
    content: `
尊敬的平台管理方：

本人/本公司作为芯核交易平台的卖家供应商，郑重承诺如下：

一、货物真实性承诺
1. 所售电子元器件均为原厂正品，绝不销售假冒伪劣产品
2. 如实描述货物的品牌、型号、年份、数量等关键信息
3. 确保货物来源合法，不存在侵权或违法问题

二、质量保证承诺
1. 货物将按照平台规定的质检标准进行交付
2. 如质检不合格，愿意承担退货运费及相关损失
3. 质检合格后，如买家反馈质量问题，愿意配合调查处理

三、交易诚信承诺
1. 遵守平台定价规则，不恶意抬价或低价倾销
2. 按约定时间发货，如延迟愿意承担相应责任
3. 尊重买家隐私，不利用交易信息进行不当营销

四、违约责任
如违反以上承诺，愿意接受以下处理：
1. 平台有权下架相关商品
2. 视情节轻重，平台可暂停或终止交易权限
3. 造成买家损失的，愿意承担赔偿责任

本承诺函自签署之日起生效，具有法律约束力。

承诺人：{companyName}
签署日期：{signedAt}
IP地址：{ipAddress}
    `.trim(),
  },
  buyer: {
    version: '1.0',
    title: '买家责任承诺函',
    content: `
尊敬的平台管理方：

本人/本公司作为芯核交易平台的买家，郑重承诺如下：

一、交易诚信承诺
1. 提供真实的企业信息和联系方式
2. 按约定时间完成付款，不恶意拖欠
3. 不利用平台信息进行不当竞争或侵权行为

二、验收承诺
1. 收到货物后，在规定时间内完成验收
2. 如实反馈货物质量问题，不恶意投诉
3. 验收合格后及时确认收货

三、保密承诺
1. 不泄露卖家身份信息
2. 不将交易信息用于非交易目的
3. 尊重平台知识产权和商业机密

四、违约责任
如违反以上承诺，愿意接受以下处理：
1. 平台有权限制交易权限
2. 视情节轻重，平台可暂停账号
3. 造成卖家或平台损失的，愿意承担赔偿责任

本承诺函自签署之日起生效，具有法律约束力。

承诺人：{companyName}
签署日期：{signedAt}
IP地址：{ipAddress}
    `.trim(),
  },
};

export class AgreementService {
  /**
   * 获取承诺函模板
   */
  getTemplate(type: AgreementType, companyName: string): {
    version: string;
    title: string;
    content: string;
  } {
    const template = AGREEMENT_TEMPLATES[type];
    const now = new Date().toLocaleString('zh-CN');

    return {
      version: template.version,
      title: template.title,
      content: template.content
        .replace('{companyName}', companyName)
        .replace('{signedAt}', now)
        .replace('{ipAddress}', '[签署时自动填充]'),
    };
  }

  /**
   * 签署承诺函
   */
  async signAgreement(
    userId: string,
    type: AgreementType,
    ipAddress: string,
    companyName: string
  ): Promise<Agreement> {
    const repo = AppDataSource.getRepository(Agreement);

    // 检查是否已签署最新版本
    const existing = await repo.findOne({
      where: { userId, type, version: AGREEMENT_TEMPLATES[type].version },
    });

    if (existing) {
      throw new ValidationError('您已签署最新版本的承诺函');
    }

    const template = this.getTemplate(type, companyName);
    const content = template.content.replace('[签署时自动填充]', ipAddress);

    const agreement = repo.create({
      id: uuidv4(),
      userId,
      type,
      version: template.version,
      content,
      ipAddress,
    });

    await repo.save(agreement);
    console.log(`[承诺函] 用户 ${userId} 签署了${type === 'seller' ? '卖家' : '买家'}承诺函`);

    return agreement;
  }

  /**
   * 获取用户已签署的承诺函
   */
  async getUserAgreements(userId: string): Promise<Agreement[]> {
    const repo = AppDataSource.getRepository(Agreement);
    return repo.find({
      where: { userId },
      order: { signedAt: 'DESC' },
    });
  }

  /**
   * 检查用户是否已签署承诺函
   */
  async checkAgreementSigned(userId: string, type: AgreementType): Promise<boolean> {
    const repo = AppDataSource.getRepository(Agreement);
    const agreement = await repo.findOne({
      where: { userId, type, version: AGREEMENT_TEMPLATES[type].version },
    });
    return !!agreement;
  }

  /**
   * 获取承诺函详情
   */
  async getAgreementById(agreementId: string, userId: string): Promise<Agreement> {
    const repo = AppDataSource.getRepository(Agreement);
    const agreement = await repo.findOne({
      where: { id: agreementId },
    });

    if (!agreement) {
      throw new NotFoundError('承诺函不存在');
    }

    if (agreement.userId !== userId) {
      throw new ValidationError('无权查看此承诺函');
    }

    return agreement;
  }
}

export const agreementService = new AgreementService();
