/**
 * 结算审核页面 - 现代化改造版
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCcw,
  Loader2,
  Play,
  RotateCw,
  Building2,
  Smartphone,
  X,
} from 'lucide-react';
import { api } from '../../api/client';
import { DataTable, Column, KPICard } from '../../components/admin-ui';
import type { PendingSettlement, SettlementStatus } from '../../types/settlement';

// ═══════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════

interface SettlementReviewProps {
  showToast: (msg: string) => void;
}

// 状态配置
const statusConfig: Record<
  SettlementStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  pending: { label: '待处理', className: 'admin-badge-warning', icon: Clock },
  processing: { label: '处理中', className: 'admin-badge-info', icon: Loader2 },
  completed: { label: '已完成', className: 'admin-badge-success', icon: CheckCircle2 },
  failed: { label: '失败', className: 'admin-badge-error', icon: AlertTriangle },
};

// 状态徽章组件
const StatusBadge: React.FC<{ status: SettlementStatus }> = ({ status }) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <span className={`admin-badge ${config.className} inline-flex items-center gap-1.5`}>
      <Icon className={`w-3.5 h-3.5 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {config.label}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════

export const SettlementReview: React.FC<SettlementReviewProps> = ({ showToast }) => {
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState<PendingSettlement[]>([]);
  const [stats, setStats] = useState({
    todayAmount: 0,
    pendingCount: 0,
    processingCount: 0,
    completedCount: 0,
    failedCount: 0,
    monthAmount: 0,
  });
  const [detailSettlement, setDetailSettlement] = useState<PendingSettlement | null>(null);
  const [processModal, setProcessModal] = useState<PendingSettlement | null>(null);
  const [processing, setProcessing] = useState(false);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [settlementsRes, statsRes] = await Promise.all([
        api.getPendingSettlements(),
        api.getSettlementStats(),
      ]);
      setSettlements(settlementsRes);
      setStats(statsRes);
    } catch (err: any) {
      showToast(err.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 处理结算
  const handleProcess = async (settlementId: string) => {
    setProcessing(true);
    try {
      const result = await api.processSettlement(settlementId);
      if (result.success) {
        showToast('结算处理成功');
        setProcessModal(null);
        await loadData();
      }
    } catch (err: any) {
      showToast(err.message || '处理失败');
    } finally {
      setProcessing(false);
    }
  };

  // 重试
  const handleRetry = async (settlementId: string) => {
    try {
      const result = await api.retrySettlement(settlementId);
      if (result.success) {
        showToast('重试成功');
        await loadData();
      }
    } catch (err: any) {
      showToast(err.message || '重试失败');
    }
  };

  // 格式化
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatMoney = useCallback((amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  // 表格列定义
  const columns: Column<PendingSettlement>[] = [
    {
      key: 'settlementNo',
      title: '结算单号',
      width: 140,
      render: (_, s) => (
        <span className="font-mono text-sm font-medium text-gray-900">{s.settlementNo}</span>
      ),
    },
    {
      key: 'seller',
      title: '卖家信息',
      render: (_, s) => (
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">{s.seller.companyName}</div>
          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            {s.paymentMethod === 'alipay' && s.seller.alipayAccount && (
              <>
                <Smartphone className="w-3 h-3" />
                {s.seller.alipayAccount}
              </>
            )}
            {s.paymentMethod === 'bank' && s.seller.bankName && (
              <>
                <Building2 className="w-3 h-3" />
                {s.seller.bankName}
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      title: '金额',
      width: 120,
      align: 'right',
      render: (_, s) => (
        <span className="font-mono font-bold text-lg text-red-600">{formatMoney(s.amount)}</span>
      ),
    },
    {
      key: 'paymentMethod',
      title: '收款方式',
      width: 100,
      hideOnMobile: true,
      render: (_, s) => (
        <span className="text-sm text-gray-600">
          {s.paymentMethod === 'wechat' ? '微信' : s.paymentMethod === 'alipay' ? '支付宝' : '银行转账'}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (_, s) => <StatusBadge status={s.status} />,
    },
    {
      key: 'actions',
      title: '操作',
      width: 140,
      align: 'right',
      render: (_, s) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDetailSettlement(s);
            }}
            className="admin-btn admin-btn-secondary text-sm py-1.5"
          >
            详情
          </button>
          {s.status === 'pending' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setProcessModal(s);
              }}
              className="admin-btn admin-btn-primary text-sm py-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              处理
            </button>
          )}
          {s.status === 'failed' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRetry(s.id);
              }}
              className="admin-btn bg-orange-500 hover:bg-orange-600 text-white text-sm py-1.5"
            >
              <RotateCw className="w-3.5 h-3.5" />
              重试
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">结算审核</h1>
          <p className="text-gray-500 mt-1 text-sm">审核并处理卖家结算申请</p>
        </div>
        <button onClick={loadData} disabled={loading} className="admin-btn admin-btn-secondary">
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* KPI 统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          title="今日结算"
          value={formatMoney(stats.todayAmount)}
          icon={<DollarSign className="w-5 h-5" />}
          color="blue"
        />
        <KPICard
          title="本月结算"
          value={formatMoney(stats.monthAmount)}
          icon={<DollarSign className="w-5 h-5" />}
          color="green"
        />
        <KPICard
          title="待处理"
          value={stats.pendingCount.toString()}
          icon={<Clock className="w-5 h-5" />}
          color="orange"
        />
        <KPICard
          title="处理中"
          value={stats.processingCount.toString()}
          icon={<Loader2 className="w-5 h-5" />}
          color="blue"
        />
        <KPICard
          title="已完成"
          value={stats.completedCount.toString()}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="green"
        />
        <KPICard
          title="失败"
          value={stats.failedCount.toString()}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
        />
      </div>

      {/* 数据表格 */}
      <DataTable
        data={settlements}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyText="暂无待处理的结算"
      />

      {/* 详情弹窗 */}
      <AnimatePresence>
        {detailSettlement && (
          <SettlementDetailModal
            settlement={detailSettlement}
            formatMoney={formatMoney}
            formatDate={formatDate}
            onClose={() => setDetailSettlement(null)}
            onProcess={() => {
              setDetailSettlement(null);
              setProcessModal(detailSettlement);
            }}
          />
        )}
      </AnimatePresence>

      {/* 处理确认弹窗 */}
      <AnimatePresence>
        {processModal && (
          <ProcessModal
            settlement={processModal}
            processing={processing}
            formatMoney={formatMoney}
            onClose={() => setProcessModal(null)}
            onProcess={() => handleProcess(processModal.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 详情弹窗组件
// ═══════════════════════════════════════════════════════════════

interface SettlementDetailModalProps {
  settlement: PendingSettlement;
  formatMoney: (n: number) => string;
  formatDate: (d: string) => string;
  onClose: () => void;
  onProcess: () => void;
}

const SettlementDetailModal: React.FC<SettlementDetailModalProps> = ({
  settlement,
  formatMoney,
  formatDate,
  onClose,
  onProcess,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ type: 'spring', duration: 0.3 }}
      className="bg-white rounded-xl shadow-xl w-full max-w-lg"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">结算详情</h3>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="text-xs text-gray-500 mb-1">结算单号</div>
          <div className="font-mono font-bold text-lg">{settlement.settlementNo}</div>
        </div>

        <div className="p-4 bg-blue-50 rounded-xl space-y-2">
          <div className="text-sm text-blue-600 font-semibold">卖家信息</div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">公司名称</span>
            <span className="font-medium">{settlement.seller.companyName}</span>
          </div>
          {settlement.seller.alipayAccount && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">支付宝账号</span>
              <span className="font-mono">{settlement.seller.alipayAccount}</span>
            </div>
          )}
          {settlement.seller.bankName && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">开户银行</span>
                <span className="font-mono">{settlement.seller.bankName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">银行账号</span>
                <span className="font-mono">{settlement.seller.bankAccount}</span>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="text-xs text-gray-500 mb-1">订单号</div>
            <div className="font-mono text-sm">{settlement.orderNumber}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="text-xs text-gray-500 mb-1">结算金额</div>
            <div className="font-mono font-bold text-lg text-red-600">{formatMoney(settlement.amount)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="text-xs text-gray-500 mb-1">收款方式</div>
            <div className="text-sm">
              {settlement.paymentMethod === 'wechat'
                ? '微信企业付款'
                : settlement.paymentMethod === 'alipay'
                ? '支付宝转账'
                : '银行转账'}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="text-xs text-gray-500 mb-1">状态</div>
            <StatusBadge status={settlement.status} />
          </div>
        </div>
      </div>

      <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        <button onClick={onClose} className="admin-btn admin-btn-secondary flex-1">
          关闭
        </button>
        {settlement.status === 'pending' && (
          <button onClick={onProcess} className="admin-btn admin-btn-primary flex-1">
            处理结算
          </button>
        )}
      </div>
    </motion.div>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════
// 处理确认弹窗
// ═══════════════════════════════════════════════════════════════

interface ProcessModalProps {
  settlement: PendingSettlement;
  processing: boolean;
  formatMoney: (n: number) => string;
  onClose: () => void;
  onProcess: () => void;
}

const ProcessModal: React.FC<ProcessModalProps> = ({
  settlement,
  processing,
  formatMoney,
  onClose,
  onProcess,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ type: 'spring', duration: 0.3 }}
      className="bg-white rounded-xl shadow-xl w-full max-w-md"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-green-50">
        <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
          <Play className="w-5 h-5" />
          确认处理结算
        </h3>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div className="p-4 bg-gray-50 rounded-xl space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">结算单号</span>
            <span className="font-mono font-medium">{settlement.settlementNo}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">卖家</span>
            <span className="font-medium">{settlement.seller.companyName}</span>
          </div>
          <div className="border-t border-gray-200 pt-3 flex justify-between">
            <span className="text-gray-700 font-bold">结算金额</span>
            <span className="font-mono font-bold text-xl text-red-600">{formatMoney(settlement.amount)}</span>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          确认后系统将自动打款至卖家收款账户
        </div>
      </div>

      <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        <button onClick={onClose} className="admin-btn admin-btn-secondary flex-1">
          取消
        </button>
        <button
          onClick={onProcess}
          disabled={processing}
          className="admin-btn admin-btn-primary flex-1"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              处理中...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              确认处理
            </>
          )}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

export default SettlementReview;
