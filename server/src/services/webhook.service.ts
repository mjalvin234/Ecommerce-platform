import { AppDataSource } from '../config/database.js';
import { Webhook, WebhookLog, WebhookEvent } from '../models/Webhook.js';
import crypto from 'crypto';
import https from 'https';
import http from 'http';

// 简单的HTTP请求函数
async function httpRequest(url: string, options: {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const lib = isHttps ? https : http;

    const req = lib.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'POST',
      headers: options.headers,
      timeout: options.timeout || 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode || 0, data }));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

const webhookRepo = () => AppDataSource.getRepository(Webhook);
const webhookLogRepo = () => AppDataSource.getRepository(WebhookLog);

export interface WebhookPayload {
  id: string;
  type: WebhookEvent;
  timestamp: string;
  data: any;
}

export const webhookService = {
  /**
   * 生成Webhook签名
   */
  generateSignature(secret: string, payload: string): string {
    return 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
  },

  /**
   * 创建Webhook
   */
  async createWebhook(userId: string, url: string, events: WebhookEvent[]): Promise<Webhook> {
    // 验证URL格式
    try {
      new URL(url);
    } catch {
      throw new Error('无效的URL格式');
    }

    // 检查用户已有Webhook数量
    const existing = await webhookRepo().count({ where: { userId } });
    if (existing >= 10) {
      throw new Error('每个用户最多可创建10个Webhook');
    }

    const webhook = webhookRepo().create({
      userId,
      url,
      secret: crypto.randomBytes(24).toString('hex'),
      events,
      active: true
    });

    return await webhookRepo().save(webhook);
  },

  /**
   * 获取用户的Webhooks
   */
  async getUserWebhooks(userId: string): Promise<Webhook[]> {
    return await webhookRepo().find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  },

  /**
   * 获取Webhook详情
   */
  async getWebhook(id: string, userId: string): Promise<Webhook | null> {
    return await webhookRepo().findOne({ where: { id, userId } });
  },

  /**
   * 更新Webhook
   */
  async updateWebhook(id: string, userId: string, data: { url?: string; events?: WebhookEvent[]; active?: boolean }): Promise<Webhook> {
    const webhook = await this.getWebhook(id, userId);
    if (!webhook) {
      throw new Error('Webhook不存在');
    }

    if (data.url) {
      try {
        new URL(data.url);
      } catch {
        throw new Error('无效的URL格式');
      }
      webhook.url = data.url;
    }
    if (data.events) webhook.events = data.events;
    if (data.active !== undefined) webhook.active = data.active;

    return await webhookRepo().save(webhook);
  },

  /**
   * 删除Webhook
   */
  async deleteWebhook(id: string, userId: string): Promise<void> {
    const webhook = await this.getWebhook(id, userId);
    if (!webhook) {
      throw new Error('Webhook不存在');
    }

    await webhookRepo().remove(webhook);
  },

  /**
   * 重新生成Secret
   */
  async regenerateSecret(id: string, userId: string): Promise<Webhook> {
    const webhook = await this.getWebhook(id, userId);
    if (!webhook) {
      throw new Error('Webhook不存在');
    }

    webhook.secret = crypto.randomBytes(24).toString('hex');
    return await webhookRepo().save(webhook);
  },

  /**
   * 测试Webhook
   */
  async testWebhook(id: string, userId: string): Promise<{ success: boolean; response?: string; error?: string }> {
    const webhook = await this.getWebhook(id, userId);
    if (!webhook) {
      throw new Error('Webhook不存在');
    }

    const testPayload: WebhookPayload = {
      id: 'test_' + Date.now(),
      type: 'order.created',
      timestamp: new Date().toISOString(),
      data: { test: true, message: '这是一条测试消息' }
    };

    try {
      const payloadStr = JSON.stringify(testPayload);
      const signature = this.generateSignature(webhook.secret, payloadStr);

      const response = await httpRequest(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': 'test'
        },
        body: payloadStr,
        timeout: 10000
      });

      return { success: true, response: `HTTP ${response.status}` };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * 触发Webhook事件
   */
  async triggerEvent(eventType: WebhookEvent, data: any): Promise<void> {
    // 查找订阅了此事件的所有活跃Webhook
    const webhooks = await webhookRepo()
      .createQueryBuilder('webhook')
      .where('webhook.active = :active', { active: true })
      .andWhere(':event IN (SELECT 1 FROM json_each(webhook.events))', { event: eventType })
      .getMany();

    for (const webhook of webhooks) {
      this.sendWebhook(webhook, eventType, data).catch(err => {
        console.error(`Webhook ${webhook.id} 发送失败:`, err.message);
      });
    }
  },

  /**
   * 发送Webhook
   */
  async sendWebhook(webhook: Webhook, eventType: WebhookEvent, data: any, retryCount = 0): Promise<void> {
    const payload: WebhookPayload = {
      id: 'evt_' + crypto.randomBytes(8).toString('hex'),
      type: eventType,
      timestamp: new Date().toISOString(),
      data
    };

    const payloadStr = JSON.stringify(payload);
    const signature = this.generateSignature(webhook.secret, payloadStr);

    const log = webhookLogRepo().create({
      webhookId: webhook.id,
      eventType,
      requestBody: payloadStr,
      retryCount,
      success: false
    });

    const startTime = Date.now();

    try {
      const response = await httpRequest(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': eventType,
          'X-Webhook-Id': payload.id
        },
        body: payloadStr,
        timeout: 10000
      });

      log.responseStatus = response.status;
      log.responseBody = response.data;
      log.duration = Date.now() - startTime;
      log.success = response.status >= 200 && response.status < 300;

    } catch (err: any) {
      log.responseStatus = 0;
      log.responseBody = err.message;
      log.duration = Date.now() - startTime;
      log.success = false;
      log.errorMessage = err.message;

      // 重试逻辑（最多3次）
      if (retryCount < 3) {
        setTimeout(() => {
          this.sendWebhook(webhook, eventType, data, retryCount + 1);
        }, Math.pow(2, retryCount) * 1000); // 指数退避
      }
    }

    await webhookLogRepo().save(log);
  },

  /**
   * 获取Webhook日志
   */
  async getWebhookLogs(webhookId: string, userId: string, options?: { limit?: number; offset?: number }): Promise<[WebhookLog[], number]> {
    // 验证所有权
    const webhook = await this.getWebhook(webhookId, userId);
    if (!webhook) {
      throw new Error('Webhook不存在');
    }

    return await webhookLogRepo().findAndCount({
      where: { webhookId },
      order: { createdAt: 'DESC' },
      take: options?.limit || 20,
      skip: options?.offset || 0
    });
  }
};
