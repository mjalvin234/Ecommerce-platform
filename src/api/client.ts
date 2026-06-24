const API_BASE = import.meta.env.PROD
  ? 'https://ecommerce-platform.mjalvin234-18e.workers.dev/api'
  : '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    code?: string;
  };
}

export interface User {
  id: string;
  email: string;
  companyName: string;
  role: 'buyer' | 'seller';
  anonymousHash: string;
  verificationStatus: string;
}

export interface Inventory {
  id: string;
  partNumber: string;
  quantity: number;
  availableQty: number;
  year?: string;
  price: number;
  eccn?: string;
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

export interface Negotiation {
  id: string;
  partNumber: string;
  sellerPrice: number;
  offerPrice: number;
  quantity: number;
  status: 'pending' | 'accepted' | 'rejected';
  seller?: string;
  buyer?: string;
  createdAt: string;
}

export type MessageType =
  | 'order_created'
  | 'order_paid'
  | 'order_shipped'
  | 'order_completed'
  | 'order_cancelled'
  | 'negotiation_received'
  | 'negotiation_accepted'
  | 'negotiation_rejected'
  | 'system_announcement'
  | 'verification_result'
  | 'credit_change';

export type MessageCategory = 'order' | 'negotiation' | 'system';

export interface Message {
  id: string;
  type: MessageType;
  title: string;
  content: string;
  relatedData?: {
    orderId?: string;
    orderNumber?: string;
    negotiationId?: string;
    partNumber?: string;
    trackingNumber?: string;
    carrier?: string;
    [key: string]: any;
  };
  read: boolean;
  createdAt: string;
}

export interface MessageListResponse {
  items: Message[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  unreadCount: {
    total: number;
    byCategory: Record<MessageCategory, number>;
  };
}

// 通知节点配置
export interface NotificationNode {
  id: string;
  code: string;
  name: string;
  description: string;
  adminMessageEnabled: boolean;
  adminEmailEnabled: boolean;
  userNotificationEnabled: boolean;
  category: 'order' | 'negotiation' | 'system';
  createdAt: string;
  updatedAt: string;
}

// 管理员邮箱
export interface AdminEmail {
  id: string;
  email: string;
  name: string;
  isPrimary: boolean;
  verified: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// 邮件模版
export interface EmailTemplate {
  id: string;
  code: string;
  name: string;
  subject: string;
  body: string;
  adminSubject?: string;
  adminBody?: string;
  variables: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    const stored = localStorage.getItem('token');
    if (stored) {
      this.token = stored;
    }
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  getToken() {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || '请求失败');
    }

    return data.data as T;
  }

  // 公共方法 - 供组件直接调用
  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // 认证
  async login(email: string, password: string) {
    const result = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(result.token);
    return result;
  }

  async register(data: {
    email: string;
    password: string;
    companyName: string;
    role: 'buyer' | 'seller';
  }) {
    const result = await this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(result.token);
    return result;
  }

  async getProfile() {
    return this.request<User>('/auth/profile');
  }

  // 库存
  async searchInventory(query: string = '', page: number = 1, pageSize: number = 20) {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    return this.request<{ items: Inventory[]; total: number; page: number; pageSize: number; totalPages: number }>(
      `/inventory?${params.toString()}`
    );
  }

  async getInventory(id: string) {
    return this.request<Inventory>(`/inventory/${id}`);
  }

  async getSellerInventory() {
    return this.request<Inventory[]>('/inventory/seller/my');
  }

  async createInventory(data: {
    partNumber: string;
    quantity: number;
    year?: string;
    price: number;
    eccn?: string;
    leadTime?: string;
  }) {
    return this.request<Inventory>('/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInventory(id: string, data: Partial<{
    partNumber: string;
    quantity: number;
    year: string;
    price: number;
    eccn: string;
    leadTime: string;
    status: string;
  }>) {
    return this.request<Inventory>(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInventory(id: string) {
    return this.request<{ success: boolean }>(`/inventory/${id}`, {
      method: 'DELETE',
    });
  }

  // 订单
  async createOrder(data: { inventoryId: string; quantity: number; type?: 'direct' | 'negotiated' }) {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getBuyerOrders() {
    return this.request<Order[]>('/orders/buyer');
  }

  async getSellerOrders() {
    return this.request<Order[]>('/orders/seller');
  }

  async getOrder(id: string) {
    return this.request<Order>(`/orders/${id}`);
  }

  async payOrder(id: string) {
    return this.request<{ success: boolean; status: string }>(`/orders/${id}/pay`, {
      method: 'POST',
    });
  }

  async shipOrder(id: string, data: { carrier: string; trackingNumber: string }) {
    return this.request<{ success: boolean; status: string }>(`/orders/${id}/ship`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async completeOrder(id: string) {
    return this.request<{ success: boolean; status: string }>(`/orders/${id}/complete`, {
      method: 'POST',
    });
  }

  async cancelOrder(id: string) {
    return this.request<{ success: boolean; status: string }>(`/orders/${id}/cancel`, {
      method: 'POST',
    });
  }

  // 议价
  async createNegotiation(data: { inventoryId: string; offerPrice: number; quantity: number }) {
    return this.request<Negotiation>('/negotiations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getBuyerNegotiations() {
    return this.request<Negotiation[]>('/negotiations/buyer');
  }

  async getSellerNegotiations() {
    return this.request<Negotiation[]>('/negotiations/seller');
  }

  async acceptNegotiation(id: string) {
    return this.request<{ success: boolean; orderId: string; orderNumber: string }>(`/negotiations/${id}/accept`, {
      method: 'POST',
    });
  }

  async rejectNegotiation(id: string) {
    return this.request<{ success: boolean }>(`/negotiations/${id}/reject`, {
      method: 'POST',
    });
  }

  // 消息
  async getMessages(options?: {
    type?: MessageType;
    category?: MessageCategory;
    page?: number;
    pageSize?: number;
  }) {
    const params = new URLSearchParams();
    if (options?.type) params.set('type', options.type);
    if (options?.category) params.set('category', options.category);
    params.set('page', String(options?.page || 1));
    params.set('pageSize', String(options?.pageSize || 20));
    return this.request<MessageListResponse>(`/messages?${params.toString()}`);
  }

  async getUnreadCount() {
    return this.request<{
      total: number;
      byCategory: Record<MessageCategory, number>;
    }>('/messages/unread-count');
  }

  async markMessageAsRead(id: string) {
    return this.request<{ read: boolean }>(`/messages/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllMessagesAsRead(options?: { type?: MessageType; category?: MessageCategory }) {
    const params = new URLSearchParams();
    if (options?.type) params.set('type', options.type);
    if (options?.category) params.set('category', options.category);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ success: boolean; updatedCount: number }>(`/messages/read-all${query}`, {
      method: 'PATCH',
    });
  }

  // 支付
  async getPaymentChannels() {
    return this.request<Array<{
      channel: 'alipay' | 'wechat';
      channelName: string;
      enabled: boolean;
      configured: boolean;
    }>>('/payments/channels');
  }

  async createPayment(orderId: string, channel: 'alipay' | 'wechat') {
    return this.request<{
      paymentNo: string;
      qrCode?: string;
      payUrl?: string;
      expiredAt: string;
    }>('/payments/create', {
      method: 'POST',
      body: JSON.stringify({ orderId, channel }),
    });
  }

  async queryPaymentStatus(paymentNo: string) {
    return this.request<{
      status: 'pending' | 'paying' | 'success' | 'failed' | 'closed';
      paidAt?: string;
    }>(`/payments/${paymentNo}/status`);
  }

  // 支付配置管理（管理员）
  async getPaymentConfigs() {
    return this.request<Array<{
      channel: 'alipay' | 'wechat';
      channelName: string;
      enabled: boolean;
      configured: boolean;
      sandboxMode: boolean;
      // 支付宝配置
      alipayAppId?: string;
      alipayAppIdConfigured: boolean;
      alipayPrivateKeyConfigured: boolean;
      alipayPublicKeyConfigured: boolean;
      alipayNotifyUrl?: string;
      alipayReturnUrl?: string;
      // 微信配置
      wechatAppId?: string;
      wechatAppIdConfigured: boolean;
      wechatMchId?: string;
      wechatMchIdConfigured: boolean;
      wechatApiKeyConfigured: boolean;
      wechatApiV3KeyConfigured: boolean;
      wechatSerialNoConfigured: boolean;
      wechatPrivateKeyConfigured: boolean;
      wechatNotifyUrl?: string;
    }>>('/payments/config');
  }

  async updatePaymentConfig(channel: 'alipay' | 'wechat', data: {
    enabled?: boolean;
    sandboxMode?: boolean;
    alipayAppId?: string;
    alipayPrivateKey?: string;
    alipayPublicKey?: string;
    alipayNotifyUrl?: string;
    alipayReturnUrl?: string;
    wechatAppId?: string;
    wechatMchId?: string;
    wechatApiKey?: string;
    wechatApiV3Key?: string;
    wechatSerialNo?: string;
    wechatPrivateKey?: string;
    wechatNotifyUrl?: string;
  }) {
    return this.request<{ success: boolean }>(`/payments/config/${channel}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async testPaymentConfig(channel: 'alipay' | 'wechat') {
    return this.request<{
      success: boolean;
      message: string;
      details?: any;
    }>(`/payments/config/${channel}/test`, {
      method: 'POST',
    });
  }

  async getMyPayments(page: number = 1, pageSize: number = 20) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    return this.request<{
      items: any[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`/payments/my?${params.toString()}`);
  }

  // 收藏
  async getFavorites(page: number = 1, pageSize: number = 20) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    return this.request<{
      items: Array<{
        id: string;
        inventory: Inventory & { seller?: { id: string; companyName: string } };
        note?: string;
        createdAt: string;
      }>;
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`/favorites?${params.toString()}`);
  }

  async addFavorite(inventoryId: string, note?: string) {
    return this.request<{ id: string }>('/favorites', {
      method: 'POST',
      body: JSON.stringify({ inventoryId, note }),
    });
  }

  async removeFavorite(inventoryId: string) {
    return this.request<{ success: boolean }>(`/favorites/${inventoryId}`, {
      method: 'DELETE',
    });
  }

  async checkFavorites(inventoryIds: string[]) {
    return this.request<Record<string, boolean>>('/favorites/check', {
      method: 'POST',
      body: JSON.stringify({ inventoryIds }),
    });
  }

  async getFavoriteCount() {
    return this.request<{ count: number }>('/favorites/count');
  }

  // 关注
  async getFollowing(page: number = 1, pageSize: number = 20) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    return this.request<{
      items: Array<{
        id: string;
        user: { id: string; companyName: string; role: string; verificationStatus: string; creditScore?: number };
        createdAt: string;
      }>;
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`/follows/following?${params.toString()}`);
  }

  async getFollowers(page: number = 1, pageSize: number = 20) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    return this.request<{
      items: Array<{
        id: string;
        user: { id: string; companyName: string; role: string; verificationStatus: string };
        createdAt: string;
      }>;
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`/follows/followers?${params.toString()}`);
  }

  async followUser(userId: string) {
    return this.request<{ id: string }>('/follows', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async followByInventory(inventoryId: string) {
    return this.request<{ id: string }>(`/follows/by-inventory/${inventoryId}`, {
      method: 'POST',
    });
  }

  async unfollowUser(userId: string) {
    return this.request<{ success: boolean }>(`/follows/${userId}`, {
      method: 'DELETE',
    });
  }

  async getFollowStats() {
    return this.request<{ followingCount: number; followerCount: number }>('/follows/stats');
  }

  // 预警
  async getAlerts(options?: {
    alertType?: 'low_stock' | 'price_change' | 'status_change' | 'expiring';
    isRead?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const params = new URLSearchParams();
    if (options?.alertType) params.set('alertType', options.alertType);
    if (options?.isRead !== undefined) params.set('isRead', String(options.isRead));
    params.set('page', String(options?.page || 1));
    params.set('pageSize', String(options?.pageSize || 20));
    return this.request<{
      items: Array<{
        id: string;
        alertType: string;
        title: string;
        message?: string;
        inventory?: { id: string; partNumber: string };
        isRead: boolean;
        createdAt: string;
      }>;
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`/alerts?${params.toString()}`);
  }

  async getUnreadAlertCount() {
    return this.request<{ count: number }>('/alerts/unread-count');
  }

  async markAlertAsRead(id: string) {
    return this.request<{ success: boolean }>(`/alerts/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllAlertsAsRead() {
    return this.request<{ success: boolean }>('/alerts/read-all', {
      method: 'POST',
    });
  }

  // 信用
  async getMyCreditInfo() {
    return this.request<{
      score: number;
      level: 'excellent' | 'good' | 'normal' | 'poor' | 'very_poor';
      levelLabel: string;
      recentChange: number;
      positiveCount: number;
      negativeCount: number;
    }>('/credit/info');
  }

  async getCreditHistory(page: number = 1, pageSize: number = 20) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    return this.request<{
      items: Array<{
        id: string;
        changeType: string;
        changeAmount: number;
        scoreBefore: number;
        scoreAfter: number;
        relatedId?: string;
        remark?: string;
        createdAt: string;
      }>;
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`/credit/history?${params.toString()}`);
  }

  async getUserCredit(userId: string) {
    return this.request<{
      score: number;
      level: 'excellent' | 'good' | 'normal' | 'poor' | 'very_poor';
      levelLabel: string;
    }>(`/credit/user/${userId}`);
  }

  // 管理
  async getAdminStatistics() {
    return this.request<{
      users: { total: number; buyers: number; sellers: number; newToday: number; pendingVerification: number };
      orders: { total: number; newToday: number; pendingPayment: number; pendingShipment: number; completed: number };
      transactions: { totalAmount: number; todayAmount: number; monthAmount: number };
      inventory: { total: number; active: number };
      negotiations: { total: number; pending: number };
    }>('/admin/statistics');
  }

  async getAdminUsers(options?: {
    role?: 'buyer' | 'seller' | 'admin';
    verificationStatus?: 'pending' | 'verified' | 'rejected';
    page?: number;
    pageSize?: number;
  }) {
    const params = new URLSearchParams();
    if (options?.role) params.set('role', options.role);
    if (options?.verificationStatus) params.set('verificationStatus', options.verificationStatus);
    params.set('page', String(options?.page || 1));
    params.set('pageSize', String(options?.pageSize || 20));
    return this.request<{
      items: Array<{
        id: string;
        email: string;
        companyName: string;
        role: string;
        verificationStatus: string;
        creditScore: number;
        anonymousHash: string;
        createdAt: string;
      }>;
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`/admin/users?${params.toString()}`);
  }

  async updateUserStatus(userId: string, data: {
    verificationStatus?: 'pending' | 'verified' | 'rejected';
    creditScore?: number;
  }) {
    return this.request<{ success: boolean }>(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getOrderTrend(days: '7d' | '30d' | '90d' = '7d') {
    const daysNum = days === '7d' ? 7 : days === '30d' ? 30 : 90;
    return this.request<Array<{ date: string; count: number }>>(`/admin/trend/orders?days=${daysNum}`);
  }

  async getTopModels(limit: number = 10) {
    return this.request<Array<{ partNumber: string; count: number }>>(`/admin/top-models?limit=${limit}`);
  }

  // 获取所有订单（管理员）
  async getAdminOrders(options?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }) {
    const params = new URLSearchParams();
    if (options?.status) params.set('status', options.status);
    params.set('page', String(options?.page || 1));
    params.set('pageSize', String(options?.pageSize || 20));
    return this.request<{
      items: Array<{
        id: string;
        orderNumber: string;
        partNumber: string;
        quantity: number;
        totalAmount: number;
        status: string;
        orderType: string;
        buyer?: { id: string; companyName: string };
        seller?: { id: string; companyName: string };
        createdAt: string;
      }>;
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`/admin/orders?${params.toString()}`);
  }

  // 删除用户（管理员）
  async deleteAdminUser(userId: string) {
    return this.request<{
      success: boolean;
      softDelete: boolean;
    }>(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // 获取认证审核统计
  async getCertificationStats() {
    return this.request<{
      pending: number;
      approvedToday: number;
      rejectedToday: number;
    }>('/admin/certification/stats');
  }

  // 新闻资讯
  async getNews(options?: {
    type?: 'industry' | 'platform';
    keyword?: string;
    page?: number;
    pageSize?: number;
  }) {
    const params = new URLSearchParams();
    if (options?.type) params.set('type', options.type);
    if (options?.keyword) params.set('keyword', options.keyword);
    params.set('page', String(options?.page || 1));
    params.set('pageSize', String(options?.pageSize || 10));
    return this.request<{
      items: Array<{
        id: string;
        title: string;
        content: string;
        type: 'industry' | 'platform';
        coverImage?: string;
        viewCount: number;
        publishedAt?: string;
        createdAt: string;
      }>;
      total: number;
      page: number;
      pageSize: number;
    }>(`/news?${params.toString()}`);
  }

  async getNewsById(id: string) {
    return this.request<{
      id: string;
      title: string;
      content: string;
      type: 'industry' | 'platform';
      coverImage?: string;
      viewCount: number;
      publishedAt?: string;
      createdAt: string;
      author?: { id: string; companyName: string };
    }>(`/news/${id}`);
  }

  async createNews(data: {
    title: string;
    content: string;
    type: 'industry' | 'platform';
    coverImage?: string;
  }) {
    return this.request<{ id: string }>('/news', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNews(id: string, data: Partial<{
    title: string;
    content: string;
    type: 'industry' | 'platform';
    coverImage: string;
  }>) {
    return this.request<{ success: boolean }>(`/news/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteNews(id: string) {
    return this.request<{ deleted: boolean }>(`/news/${id}`, {
      method: 'DELETE',
    });
  }

  async publishNews(id: string) {
    return this.request<{ success: boolean }>(`/news/${id}/publish`, {
      method: 'POST',
    });
  }

  // 搜索相关
  async getSearchHistory(limit: number = 10) {
    return this.request<Array<{
      id: string;
      keyword: string;
      resultCount: number;
      createdAt: string;
    }>>(`/search/history?limit=${limit}`);
  }

  async clearSearchHistory() {
    return this.request<{ deletedCount: number }>('/search/history', {
      method: 'DELETE',
    });
  }

  async getHotKeywords(limit: number = 10) {
    return this.request<Array<{ keyword: string; count: number }>>(`/search/hot-keywords?limit=${limit}`);
  }

  async getHotInventories(limit: number = 10) {
    return this.request<Inventory[]>(`/search/hot-inventories?limit=${limit}`);
  }

  async getPromotedInventories(limit: number = 5) {
    return this.request<Inventory[]>(`/search/promoted-inventories?limit=${limit}`);
  }

  async getSimilarInventories(partNumber: string, limit: number = 5) {
    return this.request<Inventory[]>(`/search/similar/${encodeURIComponent(partNumber)}?limit=${limit}`);
  }

  // 批量上传
  async downloadBatchTemplate() {
    const response = await fetch('/api/batch-upload/template', {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    const blob = await response.blob();
    return blob;
  }

  async uploadBatchInventory(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/batch-upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error?.message || '上传失败');
    return data.data as {
      id: string;
      fileName: string;
      totalCount: number;
      successCount: number;
      failCount: number;
      status: string;
      errors?: Array<{ row: number; field: string; message: string }>;
    };
  }

  async getBatchUploadHistory(page: number = 1, pageSize: number = 20) {
    return this.request<{
      items: Array<{
        id: string;
        fileName: string;
        totalCount: number;
        successCount: number;
        failCount: number;
        status: string;
        createdAt: string;
      }>;
      total: number;
      page: number;
      pageSize: number;
    }>(`/batch-upload/history?page=${page}&pageSize=${pageSize}`);
  }

  // 发票管理
  async createInvoice(data: {
    orderId: string;
    invoiceType: 'normal' | 'special';
    title: string;
    taxNumber: string;
    remark?: string;
  }) {
    return this.request<{
      id: string;
      orderId: string;
      status: string;
    }>('/invoices', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getBuyerInvoices(page: number = 1, pageSize: number = 20) {
    return this.request<{
      items: any[];
      total: number;
      page: number;
      pageSize: number;
    }>(`/invoices/buyer?page=${page}&pageSize=${pageSize}`);
  }

  async getSellerInvoices(status?: string, page: number = 1, pageSize: number = 20) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (status) params.set('status', status);
    return this.request<{
      items: any[];
      total: number;
      page: number;
      pageSize: number;
    }>(`/invoices/seller?${params.toString()}`);
  }

  async processInvoice(id: string, invoiceNo: string) {
    return this.request<{ success: boolean }>(`/invoices/${id}/process`, {
      method: 'PATCH',
      body: JSON.stringify({ invoiceNo })
    });
  }

  async rejectInvoice(id: string, reason: string) {
    return this.request<{ success: boolean }>(`/invoices/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    });
  }

  // 评价系统
  async createReview(data: { orderId: string; rating: number; content: string }) {
    return this.request<{ id: string }>('reviews', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getInventoryReviews(inventoryId: string, page: number = 1, pageSize: number = 10) {
    return this.request<{
      items: any[];
      total: number;
      page: number;
      pageSize: number;
    }>(`/reviews/inventory/${inventoryId}?page=${page}&pageSize=${pageSize}`);
  }

  async getSellerReviews(page: number = 1, pageSize: number = 10) {
    return this.request<{
      items: any[];
      total: number;
      page: number;
      pageSize: number;
    }>(`/reviews/seller?page=${page}&pageSize=${pageSize}`);
  }

  async replyReview(reviewId: string, content: string) {
    return this.request<{ success: boolean }>(`/reviews/${reviewId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }

  async getSellerReviewStats(sellerId: string) {
    return this.request<{
      averageRating: number;
      totalReviews: number;
      ratingDistribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
    }>(`/reviews/seller/${sellerId}/stats`);
  }

  // 微信登录
  async getWechatQrcode() {
    return this.request<{
      scene: string;
      ticket: string;
      qrcodeUrl: string;
      expiresAt: string;
    }>('/auth/wechat/qrcode');
  }

  async checkWechatLoginStatus(scene: string) {
    return this.request<{
      status: string;
      user?: { id: string; email: string; companyName: string; role: string };
      token?: string;
    }>(`/auth/wechat/status/${scene}`);
  }

  async bindWechat(code: string) {
    return this.request<{ id: string; openid: string }>('/auth/wechat/bind', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  }

  async unbindWechat() {
    return this.request<{ success: boolean }>('/auth/wechat/unbind', {
      method: 'DELETE'
    });
  }

  async getBinding() {
    return this.request<{
      bound: boolean;
      openid?: string;
      nickname?: string;
      boundAt?: string;
    }>('/auth/wechat/binding');
  }

  // 物流查询
  async submitLogistics(orderId: string, carrierCode: string, trackingNumber: string) {
    return this.request<{ id: string; status: string }>('/logistics/submit', {
      method: 'POST',
      body: JSON.stringify({ orderId, carrierCode, trackingNumber })
    });
  }

  async queryLogistics(trackingNumber: string) {
    return this.request<{
      carrier: string;
      status: string;
      traces: Array<{ time: string; context: string; location?: string }>;
      estimatedDelivery?: string;
    }>(`/logistics/query/${trackingNumber}`);
  }

  async autoDetectCarrier(trackingNumber: string) {
    return this.request<{ carrier: string; carrierCode: string } | null>(`/logistics/auto-detect/${trackingNumber}`);
  }

  async batchSubmitLogistics(items: Array<{ orderId: string; carrierCode: string; trackingNumber: string }>) {
    return this.request<{
      success: number;
      failed: number;
      errors: Array<{ orderId: string; message: string }>;
    }>('/logistics/batch', {
      method: 'POST',
      body: JSON.stringify({ items })
    });
  }

  // 数据导出
  async createExportTask(type: 'orders' | 'inventory' | 'transactions', filters?: Record<string, any>) {
    return this.request<{ id: string; status: string }>(`/export/${type}`, {
      method: 'POST',
      body: JSON.stringify({ filters })
    });
  }

  async getExportHistory() {
    return this.request<{
      items: Array<{
        id: string;
        type: string;
        status: string;
        fileName?: string;
        totalCount: number;
        processedCount: number;
        createdAt: string;
        completedAt?: string;
      }>;
      total: number;
    }>('/export/history');
  }

  async getExportTask(taskId: string) {
    return this.request<{
      id: string;
      type: string;
      status: string;
      fileUrl?: string;
      fileName?: string;
      totalCount: number;
      processedCount: number;
    }>(`/export/task/${taskId}`);
  }

  // ========== v3.0 API开放平台 ==========

  // API Key管理
  async getApiKeys() {
    return this.request<Array<{
      id: string;
      name: string;
      key: string;
      plan: string;
      rateLimit: number;
      permissions: string[];
      status: string;
      lastUsedAt?: string;
      createdAt: string;
    }>>('/api-keys');
  }

  async createApiKey(name: string, plan: 'free' | 'basic' | 'pro' | 'enterprise' = 'free') {
    return this.request<{
      id: string;
      name: string;
      key: string;
      secret: string;
      plan: string;
      permissions: string[];
      rateLimit: number;
    }>('/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name, plan })
    });
  }

  async getApiKey(id: string) {
    return this.request<{
      id: string;
      name: string;
      key: string;
      plan: string;
      rateLimit: number;
      permissions: string[];
      status: string;
      lastUsedAt?: string;
      createdAt: string;
    }>(`/api-keys/${id}`);
  }

  async updateApiKey(id: string, data: { name?: string; permissions?: string[] }) {
    return this.request<{ id: string; name: string }>(`/api-keys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async regenerateApiSecret(id: string) {
    return this.request<{ id: string; secret: string }>(`/api-keys/${id}/regenerate`, {
      method: 'POST'
    });
  }

  async toggleApiKey(id: string, status: 'active' | 'suspended') {
    return this.request<{ id: string; status: string }>(`/api-keys/${id}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
  }

  async deleteApiKey(id: string) {
    return this.request<{ success: boolean }>(`/api-keys/${id}`, {
      method: 'DELETE'
    });
  }

  async upgradeApiKey(id: string, plan: string) {
    return this.request<{ id: string; plan: string }>(`/api-keys/${id}/upgrade`, {
      method: 'POST',
      body: JSON.stringify({ plan })
    });
  }

  async getApiKeyStats(id: string) {
    return this.request<{
      todayCount: number;
      monthCount: number;
      limitPerDay: number;
    }>(`/api-keys/${id}/stats`);
  }

  // Webhook管理
  async getWebhooks() {
    return this.request<Array<{
      id: string;
      url: string;
      events: string[];
      active: boolean;
      createdAt: string;
    }>>('/webhooks');
  }

  async createWebhook(url: string, events: string[]) {
    return this.request<{
      id: string;
      url: string;
      secret: string;
      events: string[];
      active: boolean;
    }>('/webhooks', {
      method: 'POST',
      body: JSON.stringify({ url, events })
    });
  }

  async updateWebhook(id: string, data: { url?: string; events?: string[]; active?: boolean }) {
    return this.request<{ id: string; url: string }>(`/webhooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteWebhook(id: string) {
    return this.request<{ success: boolean }>(`/webhooks/${id}`, {
      method: 'DELETE'
    });
  }

  async regenerateWebhookSecret(id: string) {
    return this.request<{ id: string; secret: string }>(`/webhooks/${id}/regenerate`, {
      method: 'POST'
    });
  }

  async testWebhook(id: string) {
    return this.request<{
      success: boolean;
      response?: string;
      error?: string;
    }>(`/webhooks/${id}/test`, {
      method: 'POST'
    });
  }

  async getWebhookLogs(id: string, page: number = 1, pageSize: number = 20) {
    return this.request<{
      items: Array<{
        id: string;
        eventType: string;
        responseStatus: number | null;
        success: boolean;
        duration: number | null;
        createdAt: string;
      }>;
      total: number;
    }>(`/webhooks/${id}/logs?page=${page}&pageSize=${pageSize}`);
  }

  // BOM导入
  async downloadBomTemplate() {
    const response = await fetch('/api/bom/templates', {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    const blob = await response.blob();
    return blob;
  }

  async uploadBom(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/bom/import', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error?.message || '上传失败');
    return data.data as {
      id: string;
      fileName: string;
      totalCount: number;
      matchedCount: number;
      status: string;
    };
  }

  async importBomJson(items: Array<{
    model: string;
    brand?: string;
    quantity: number;
    targetPrice?: number;
    remark?: string;
  }>, name?: string) {
    return this.request<{
      id: string;
      totalCount: number;
      status: string;
    }>('/bom/import-json', {
      method: 'POST',
      body: JSON.stringify({ items, name })
    });
  }

  async getBomTask(id: string) {
    return this.request<{
      id: string;
      fileName: string;
      totalCount: number;
      matchedCount: number;
      partialCount: number;
      notFoundCount: number;
      status: string;
      items?: Array<{
        model: string;
        brand?: string;
        quantity: number;
        targetPrice?: number;
        matchedInventoryId?: string;
        matchedPrice?: number;
        matchStatus?: string;
      }>;
      resultUrl?: string;
      createdAt: string;
      completedAt?: string;
    }>(`/bom/tasks/${id}`);
  }

  async getBomTasks(page: number = 1, pageSize: number = 20) {
    return this.request<{
      items: Array<{
        id: string;
        fileName: string;
        totalCount: number;
        matchedCount: number;
        status: string;
        createdAt: string;
      }>;
      total: number;
    }>(`/bom/tasks?page=${page}&pageSize=${pageSize}`);
  }

  async downloadBomResult(id: string) {
    const response = await fetch(`/api/bom/tasks/${id}/download`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    const blob = await response.blob();
    return blob;
  }

  // 文件上传
  async uploadCertificationFile(file: File): Promise<{
    filename: string;
    originalName: string;
    url: string;
    size: number;
    mimetype: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/uploads/certification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || '上传失败');
    }

    return data.data;
  }

  // ========== 打包出售 API ==========

  async getPackages(options?: {
    status?: 'draft' | 'active' | 'sold' | 'expired';
    page?: number;
    pageSize?: number;
  }) {
    const params = new URLSearchParams();
    if (options?.status) params.set('status', options.status);
    params.set('page', String(options?.page || 1));
    params.set('pageSize', String(options?.pageSize || 20));
    return this.request<{
      items: Array<{
        id: string;
        name: string;
        description?: string;
        totalItems: number;
        totalValue: number;
        packagePrice: number;
        discountRate?: number;
        status: string;
        expiresAt?: string;
        createdAt: string;
        items?: Array<{
          id: string;
          inventoryId: string;
          partNumber: string;
          quantity: number;
          unitPrice: number;
          subtotal: number;
        }>;
      }>;
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`/packages?${params.toString()}`);
  }

  async getActivePackages(options?: { page?: number; pageSize?: number; sortBy?: 'discount' | 'newest' }) {
    const params = new URLSearchParams();
    params.set('page', String(options?.page || 1));
    params.set('pageSize', String(options?.pageSize || 20));
    if (options?.sortBy) params.set('sortBy', options.sortBy);
    return this.request<{
      items: Array<{
        id: string;
        name: string;
        description?: string;
        totalItems: number;
        totalValue: number;
        packagePrice: number;
        discountRate: number;
        status: string;
        expiresAt?: string;
        createdAt: string;
      }>;
      total: number;
    }>(`/packages/active?${params.toString()}`);
  }

  async getPackage(id: string) {
    return this.request<{
      id: string;
      name: string;
      description?: string;
      totalItems: number;
      totalValue: number;
      packagePrice: number;
      discountRate?: number;
      status: string;
      expiresAt?: string;
      createdAt: string;
      seller: { id: string; companyName: string };
      items: Array<{
        id: string;
        inventoryId: string;
        partNumber: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
      }>;
    }>(`/packages/${id}`);
  }

  async createPackage(data: { name: string; description?: string }) {
    return this.request<{ id: string }>(`/packages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePackage(id: string, data: { name?: string; description?: string; packagePrice?: number; discountRate?: number; expiresAt?: string }) {
    return this.request<{ success: boolean }>(`/packages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePackage(id: string) {
    return this.request<{ success: boolean }>(`/packages/${id}`, {
      method: 'DELETE',
    });
  }

  async addPackageItem(packageId: string, data: { inventoryId: string; quantity: number }) {
    return this.request<{ id: string }>(`/packages/${packageId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removePackageItem(packageId: string, itemId: string) {
    return this.request<{ success: boolean }>(`/packages/${packageId}/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  async publishPackage(id: string, expiresAt?: string) {
    return this.request<{ success: boolean; status: string }>(`/packages/${id}/publish`, {
      method: 'POST',
      body: JSON.stringify({ expiresAt }),
    });
  }

  async buyPackage(id: string) {
    return this.request<{ orderId: string; orderNumber: string }>(`/packages/${id}/buy`, {
      method: 'POST',
    });
  }

  // ========== 阶梯定价 API ==========

  async getTieredPrices(inventoryId: string) {
    return this.request<Array<{
      id: string;
      inventoryId: string;
      minQuantity: number;
      maxQuantity: number | null;
      unitPrice: number;
      discountRate?: number;
      sortOrder: number;
    }>>(`/tiered-prices/${inventoryId}`);
  }

  async setTieredPrices(inventoryId: string, tiers: Array<{
    minQuantity: number;
    maxQuantity: number | null;
    unitPrice: number;
  }>) {
    return this.request<{ success: boolean }>(`/tiered-prices/${inventoryId}`, {
      method: 'POST',
      body: JSON.stringify({ tiers }),
    });
  }

  async deleteTieredPrices(inventoryId: string) {
    return this.request<{ success: boolean }>(`/tiered-prices/${inventoryId}`, {
      method: 'DELETE',
    });
  }

  async calculateTieredPrice(inventoryId: string, quantity: number) {
    return this.request<{
      unitPrice: number;
      totalPrice: number;
      appliedTier: {
        minQuantity: number;
        maxQuantity: number | null;
        unitPrice: number;
      } | null;
    }>(`/tiered-prices/${inventoryId}/calculate`, {
      method: 'POST',
      body: JSON.stringify({ quantity }),
    });
  }

  // ========== 老客户标记 API ==========

  async getTaggedCustomers(options?: {
    tagType?: 'vip' | 'old_customer' | 'preferred';
    page?: number;
    pageSize?: number;
  }) {
    const params = new URLSearchParams();
    if (options?.tagType) params.set('tagType', options.tagType);
    params.set('page', String(options?.page || 1));
    params.set('pageSize', String(options?.pageSize || 20));
    return this.request<{
      items: Array<{
        id: string;
        buyerId: string;
        buyer: { id: string; companyName: string };
        tagType: 'vip' | 'old_customer' | 'preferred';
        discountRate?: number;
        totalOrders: number;
        totalAmount: number;
        taggedAt: string;
        remark?: string;
      }>;
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`/customer-tags?${params.toString()}`);
  }

  async tagCustomer(data: {
    buyerId: string;
    tagType: 'vip' | 'old_customer' | 'preferred';
    discountRate?: number;
    remark?: string;
  }) {
    return this.request<{ id: string }>(`/customer-tags`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async untagCustomer(buyerId: string) {
    return this.request<{ success: boolean }>(`/customer-tags/${buyerId}`, {
      method: 'DELETE',
    });
  }

  async getTagFromSeller(sellerId: string) {
    return this.request<{
      tagType: 'vip' | 'old_customer' | 'preferred';
      discountRate?: number;
      totalOrders: number;
      totalAmount: number;
    } | null>(`/customer-tags/from-seller/${sellerId}`);
  }

  async updateCustomerDiscount(buyerId: string, discountRate: number) {
    return this.request<{ success: boolean }>(`/customer-tags/${buyerId}/discount`, {
      method: 'PUT',
      body: JSON.stringify({ discountRate }),
    });
  }

  async getMyCustomerTags(page: number = 1, pageSize: number = 20) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    return this.request<{
      items: Array<{
        id: string;
        sellerId: string;
        seller: { id: string; companyName: string };
        tagType: 'vip' | 'old_customer' | 'preferred';
        discountRate?: number;
        totalOrders: number;
        totalAmount: number;
        taggedAt: string;
      }>;
      total: number;
    }>(`/customer-tags/my?${params.toString()}`);
  }

  // ========== 结算系统 API ==========

  // 获取当前用户信息（包含收款账号）
  async getMyProfile() {
    return this.request<{
      id: string;
      email: string;
      companyName: string;
      role: string;
      wechatOpenid?: string;
      wechatNickname?: string;
      alipayAccount?: string;
      bankName?: string;
      bankAccount?: string;
      bankAccountName?: string;
      creditScore: number;
      verificationStatus: string;
    }>('/users/me');
  }

  // ========== QA质检 API ==========

  // 获取QA待处理订单
  async getQaOrders(status?: string) {
    const params = status ? `?status=${status}` : '';
    return this.request<{
      items: any[];
      total: number;
      page: number;
      pageSize: number;
    }>(`/qa/pending${params}`);
  }

  // QA收货确认
  async qaReceiveOrder(orderId: string) {
    return this.request<{ success: boolean; status: string }>(`/qa/orders/${orderId}/receive`, {
      method: 'POST',
    });
  }

  // QA发货给买家
  async qaShipToBuyer(orderId: string, data: { carrier: string; trackingNumber: string }) {
    return this.request<{ success: boolean; status: string }>(`/qa/orders/${orderId}/ship`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // QA质检失败
  async qaRejectOrder(orderId: string, reason: string) {
    return this.request<{ success: boolean; status: string }>(`/qa/orders/${orderId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // QA统计
  async getQaStats() {
    return this.request<{
      inTransit: number;
      received: number;
      failed: number;
      shipped: number;
    }>('/qa/stats');
  }

  // 更新收款账号
  async updatePaymentAccount(data: {
    alipayAccount?: string;
  }) {
    return this.request<{ success: boolean }>('/users/me/payment', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // 获取卖家结算记录
  async getSellerSettlements(options?: {
    status?: 'pending' | 'processing' | 'completed' | 'failed';
    page?: number;
    pageSize?: number;
  }) {
    const params = new URLSearchParams();
    if (options?.status) params.set('status', options.status);
    params.set('page', String(options?.page || 1));
    params.set('pageSize', String(options?.pageSize || 20));
    return this.request<{
      items: Array<{
        id: string;
        settlementNo: string;
        orderId: string;
        orderNumber: string;
        amount: number;
        status: 'pending' | 'processing' | 'completed' | 'failed';
        paymentMethod: 'wechat' | 'alipay' | 'bank';
        failureReason?: string;
        processedAt?: string;
        createdAt: string;
      }>;
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`/settlements?${params.toString()}`);
  }

  // 管理员获取待处理结算列表
  async getPendingSettlements() {
    return this.request<Array<{
      id: string;
      settlementNo: string;
      sellerId: string;
      seller: { id: string; companyName: string; alipayAccount?: string; bankName?: string; bankAccount?: string };
      orderId: string;
      orderNumber: string;
      amount: number;
      paymentMethod: 'wechat' | 'alipay' | 'bank';
      status: 'pending' | 'processing' | 'completed' | 'failed';
      createdAt: string;
    }>>('/settlements/pending');
  }

  // 处理结算
  async processSettlement(settlementId: string) {
    return this.request<{
      success: boolean;
      status: string;
      transactionId?: string;
    }>(`/settlements/${settlementId}/process`, {
      method: 'POST',
    });
  }

  // 重试失败的结算
  async retrySettlement(settlementId: string) {
    return this.request<{
      success: boolean;
      status: string;
    }>(`/settlements/${settlementId}/retry`, {
      method: 'POST',
    });
  }

  // 获取结算统计
  async getSettlementStats() {
    return this.request<{
      todayAmount: number;
      pendingCount: number;
      processingCount: number;
      completedCount: number;
      failedCount: number;
      monthAmount: number;
    }>('/settlements/stats');
  }

  // ========== 通知配置 API ==========

  // 获取通知节点列表
  async getNotificationNodes() {
    return this.request<NotificationNode[]>('/notification-config/nodes');
  }

  // 更新通知节点配置
  async updateNotificationNode(code: string, data: {
    adminMessageEnabled?: boolean;
    adminEmailEnabled?: boolean;
    userNotificationEnabled?: boolean;
  }) {
    return this.request<NotificationNode>(`/notification-config/nodes/${code}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // 获取管理员邮箱列表
  async getAdminEmails() {
    return this.request<AdminEmail[]>('/notification-config/admin-emails');
  }

  // 添加管理员邮箱
  async addAdminEmail(email: string, name?: string) {
    return this.request<AdminEmail>('/notification-config/admin-emails', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
  }

  // 更新管理员邮箱
  async updateAdminEmail(id: string, data: { name?: string; active?: boolean; verified?: boolean }) {
    return this.request<AdminEmail>(`/notification-config/admin-emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // 设为主邮箱
  async setPrimaryEmail(id: string) {
    return this.request<{ success: boolean }>(`/notification-config/admin-emails/${id}/primary`, {
      method: 'PUT',
    });
  }

  // 删除管理员邮箱
  async deleteAdminEmail(id: string) {
    return this.request<{ success: boolean }>(`/notification-config/admin-emails/${id}`, {
      method: 'DELETE',
    });
  }

  // 获取邮件模版列表
  async getEmailTemplates() {
    return this.request<EmailTemplate[]>('/notification-config/templates');
  }

  // 获取单个邮件模版
  async getEmailTemplate(code: string) {
    return this.request<EmailTemplate>(`/notification-config/templates/${code}`);
  }

  // 更新邮件模版
  async updateEmailTemplate(code: string, data: {
    subject?: string;
    body?: string;
    adminSubject?: string;
    adminBody?: string;
  }) {
    return this.request<EmailTemplate>(`/notification-config/templates/${code}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // 初始化通知配置默认数据
  async initializeNotificationDefaults() {
    return this.request<{ success: boolean }>('/notification-config/initialize', {
      method: 'POST',
    });
  }

  // ========== 系统配置 API ==========

  // 获取公开的系统配置（无需登录）
  async getPublicSystemConfig() {
    return this.request<{
      siteName: string;
      siteDescription: string;
      contactEmail: string;
      contactPhone: string;
      businessEmail?: string;
      privacyEmail?: string;
      legalEmail?: string;
      address: string;
      labInfo?: string;
      companyName: string;
      foundedYear: string;
      registeredCapital: string;
      employeeCount: string;
      customerCount: string;
      enableRegistration: boolean;
      platformBankName?: string;
      platformBankAccount?: string;
      platformBankHolder?: string;
    }>('/system-config/public');
  }

  // 获取完整系统配置（管理员）
  async getSystemConfig() {
    return this.request<{
      id: string;
      siteName: string;
      siteDescription: string;
      contactEmail: string;
      contactPhone: string;
      businessEmail?: string;
      privacyEmail?: string;
      legalEmail?: string;
      address: string;
      labInfo?: string;
      companyName: string;
      foundedYear: string;
      registeredCapital: string;
      employeeCount: string;
      customerCount: string;
      platformBankName?: string;
      platformBankAccount?: string;
      platformBankHolder?: string;
      enableRegistration: boolean;
      enableEmailVerification: boolean;
      enableSmsVerification: boolean;
      maxLoginAttempts: number;
      sessionTimeout: number;
      minPasswordLength: number;
      requirePasswordUppercase: boolean;
      requirePasswordNumber: boolean;
      requirePasswordSpecial: boolean;
      updatedAt: string;
    }>('/system-config');
  }

  // 更新系统配置
  async updateSystemConfig(data: {
    siteName?: string;
    siteDescription?: string;
    contactEmail?: string;
    contactPhone?: string;
    businessEmail?: string;
    privacyEmail?: string;
    legalEmail?: string;
    address?: string;
    labInfo?: string;
    companyName?: string;
    foundedYear?: string;
    registeredCapital?: string;
    employeeCount?: string;
    customerCount?: string;
    platformBankName?: string;
    platformBankAccount?: string;
    platformBankHolder?: string;
    enableRegistration?: boolean;
    enableEmailVerification?: boolean;
    enableSmsVerification?: boolean;
    maxLoginAttempts?: number;
    sessionTimeout?: number;
    minPasswordLength?: number;
    requirePasswordUppercase?: boolean;
    requirePasswordNumber?: boolean;
    requirePasswordSpecial?: boolean;
  }) {
    return this.request<{
      id: string;
      siteName: string;
      siteDescription: string;
      contactEmail: string;
      contactPhone: string;
      address: string;
      companyName: string;
    }>('/system-config', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // 重置系统配置
  async resetSystemConfig() {
    return this.request<{ success: boolean }>('/system-config/reset', {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
