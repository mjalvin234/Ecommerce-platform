// API 配置示例
// 将此文件放到前端项目中，替换原有的 API 配置

// 环境判断
const isProduction = import.meta.env.PROD;

// API 基础地址
export const API_BASE_URL = isProduction
  ? 'https://your-workers-url.workers.dev'  // ← 部署后修改为你的 Workers URL
  : 'http://localhost:8787';

// API 请求封装
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: { message: string } }> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // 添加认证令牌
  const token = localStorage.getItem('token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || { message: '请求失败' },
      };
    }

    return data;
  } catch (error) {
    console.error('API 请求错误:', error);
    return {
      success: false,
      error: { message: '网络错误，请检查网络连接' },
    };
  }
}

// 示例用法

// 登录
export async function login(email: string, password: string) {
  return apiRequest<{ user: any; token: string; refreshToken: string }>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }
  );
}

// 注册
export async function register(email: string, password: string, companyName: string) {
  return apiRequest<{ user: any; token: string }>(
    '/api/auth/register',
    {
      method: 'POST',
      body: JSON.stringify({ email, password, companyName }),
    }
  );
}

// 获取用户信息
export async function getCurrentUser() {
  return apiRequest<{ id: string; email: string; companyName: string }>(
    '/api/users/me'
  );
}

// 获取订单列表
export async function getOrders(params?: { status?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', params.page.toString());

  return apiRequest<any[]>(`/api/orders?${query.toString()}`);
}

// 获取产品列表
export async function getProducts(params?: { category?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.search) query.set('search', params.search);

  return apiRequest<any[]>(`/api/products?${query.toString()}`);
}

// 上传文件
export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/api/uploads`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  return response.json();
}
