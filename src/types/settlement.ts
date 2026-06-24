// 结算相关类型定义

export type SettlementStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type PaymentMethod = 'wechat' | 'alipay' | 'bank';

export interface UserProfile {
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
}

export interface Settlement {
  id: string;
  settlementNo: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  status: SettlementStatus;
  paymentMethod: PaymentMethod;
  failureReason?: string;
  processedAt?: string;
  createdAt: string;
}

export interface PendingSettlement {
  id: string;
  settlementNo: string;
  sellerId: string;
  seller: {
    id: string;
    companyName: string;
    alipayAccount?: string;
    bankName?: string;
    bankAccount?: string;
  };
  orderId: string;
  orderNumber: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: SettlementStatus;
  createdAt: string;
}

export interface SettlementStats {
  todayAmount: number;
  pendingCount: number;
  processingCount: number;
  completedCount: number;
  failedCount: number;
  monthAmount: number;
}

// API 响应类型
export interface SettlementListResponse {
  items: Settlement[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
