import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// 类型定义
export interface Inventory {
  id: string;
  partNumber: string;
  brand?: string;
  quantity: number;
  availableQty: number;
  price: number;
  year?: string;
  leadTime?: string;
  status: string;
  supplier: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  partNumber: string;
  quantity: number;
  totalAmount: number;
  status: string;
  orderType: string;
  seller?: string;
  buyer?: string;
  createdAt: string;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateOrderOptions {
  inventoryId: string;
  quantity: number;
  type?: 'direct' | 'negotiate';
  targetPrice?: number;
  remark?: string;
}

export interface ClientConfig {
  baseURL?: string;
  apiKey: string;
  apiSecret: string;
  timeout?: number;
}

// 默认配置
const DEFAULT_BASE_URL = 'http://localhost:3001/api';

/**
 * 交易中心 API 客户端
 */
export class TradingCenter {
  private client: AxiosInstance;
  private apiKey: string;
  private apiSecret: string;

  public inventory: InventoryAPI;
  public orders: OrderAPI;
  public search: SearchAPI;

  constructor(config: ClientConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;

    this.client = axios.create({
      baseURL: config.baseURL || DEFAULT_BASE_URL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'X-API-Secret': this.apiSecret,
      },
    });

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        const message = error.response?.data?.error?.message || error.message;
        return Promise.reject(new Error(message));
      }
    );

    // 初始化API模块
    this.inventory = new InventoryAPI(this.client);
    this.orders = new OrderAPI(this.client);
    this.search = new SearchAPI(this.client);
  }

  /**
   * 测试连接
   */
  async ping(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取API使用统计
   */
  async getStats(): Promise<{
    todayCount: number;
    monthCount: number;
    limitPerDay: number;
  }> {
    return this.client.get('/stats');
  }
}

/**
 * 库存API
 */
class InventoryAPI {
  constructor(private client: AxiosInstance) {}

  /**
   * 搜索库存
   */
  async search(options?: {
    keyword?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    pageSize?: number;
  }): Promise<SearchResult<Inventory>> {
    const params = new URLSearchParams();
    if (options?.keyword) params.set('keyword', options.keyword);
    if (options?.brand) params.set('brand', options.brand);
    if (options?.minPrice) params.set('minPrice', String(options.minPrice));
    if (options?.maxPrice) params.set('maxPrice', String(options.maxPrice));
    if (options?.page) params.set('page', String(options.page));
    if (options?.pageSize) params.set('pageSize', String(options.pageSize));

    return this.client.get(`/inventory?${params.toString()}`);
  }

  /**
   * 获取库存详情
   */
  async get(id: string): Promise<Inventory> {
    return this.client.get(`/inventory/${id}`);
  }

  /**
   * 发布库存（需要卖家权限）
   */
  async create(data: {
    partNumber: string;
    brand?: string;
    quantity: number;
    price: number;
    year?: string;
    leadTime?: string;
  }): Promise<Inventory> {
    return this.client.post('/inventory', data);
  }

  /**
   * 更新库存
   */
  async update(id: string, data: Partial<{
    quantity: number;
    price: number;
    status: string;
  }>): Promise<Inventory> {
    return this.client.put(`/inventory/${id}`, data);
  }

  /**
   * 删除库存
   */
  async delete(id: string): Promise<void> {
    await this.client.delete(`/inventory/${id}`);
  }
}

/**
 * 订单API
 */
class OrderAPI {
  constructor(private client: AxiosInstance) {}

  /**
   * 创建订单
   */
  async create(options: CreateOrderOptions): Promise<Order> {
    return this.client.post('/orders', options);
  }

  /**
   * 获取订单列表
   */
  async list(options?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<SearchResult<Order>> {
    const params = new URLSearchParams();
    if (options?.status) params.set('status', options.status);
    if (options?.page) params.set('page', String(options.page));
    if (options?.pageSize) params.set('pageSize', String(options.pageSize));

    return this.client.get(`/orders?${params.toString()}`);
  }

  /**
   * 获取订单详情
   */
  async get(id: string): Promise<Order> {
    return this.client.get(`/orders/${id}`);
  }

  /**
   * 支付订单
   */
  async pay(id: string, channel: 'alipay' | 'wechat'): Promise<{
    paymentNo: string;
    qrCode?: string;
    payUrl?: string;
  }> {
    return this.client.post(`/orders/${id}/pay`, { channel });
  }

  /**
   * 取消订单
   */
  async cancel(id: string, reason?: string): Promise<void> {
    await this.client.post(`/orders/${id}/cancel`, { reason });
  }

  /**
   * 确认收货
   */
  async confirm(id: string): Promise<void> {
    await this.client.post(`/orders/${id}/confirm`);
  }
}

/**
 * 搜索API
 */
class SearchAPI {
  constructor(private client: AxiosInstance) {}

  /**
   * 搜索库存
   */
  async inventory(keyword: string, options?: {
    page?: number;
    pageSize?: number;
  }): Promise<SearchResult<Inventory>> {
    const params = new URLSearchParams();
    params.set('keyword', keyword);
    if (options?.page) params.set('page', String(options.page));
    if (options?.pageSize) params.set('pageSize', String(options.pageSize));

    return this.client.get(`/search?${params.toString()}`);
  }

  /**
   * 获取热门关键词
   */
  async hotKeywords(limit: number = 10): Promise<Array<{ keyword: string; count: number }>> {
    return this.client.get(`/search/hot-keywords?limit=${limit}`);
  }

  /**
   * 获取相似型号
   */
  async similar(partNumber: string, limit: number = 5): Promise<Inventory[]> {
    return this.client.get(`/search/similar/${encodeURIComponent(partNumber)}?limit=${limit}`);
  }
}

// 默认导出
export default TradingCenter;
