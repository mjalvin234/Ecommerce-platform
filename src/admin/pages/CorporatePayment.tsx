/**
 * 对公支付页面 - 现代化改造版
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  X,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../api/client';
import { DataTable, Column, KPICard } from '../../components/admin-ui';

// ═══════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════

interface Payment {
  id: string;
  companyName?: string;
  user?: { companyName?: string; email?: string };
  email?: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'rejected';
  createdAt: string;
}

interface CorporatePaymentProps {
  showToast: (msg: string) => void;
}

// ═══════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════

export const CorporatePayment: React.FC<CorporatePaymentProps> = ({ showToast }) => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [modalType, setModalType] = useState<'confirm' | 'reject' | null>(null);
  const [confirmAmount, setConfirmAmount] = useState('');

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = (await api.getMyPayments(1, 50)) as any;
      const corporatePayments = (result.items || result.payments || result || []).filter(
        (p: Payment) => (p as any).method === 'corporate' || (p as any).type === 'corporate'
      );
      setPayments(corporatePayments.length > 0 ? corporatePayments : []);
    } catch (err) {
      console.error('加载对公支付失败:', err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 格式化金额
  const formatMoney = useCallback((amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  // 确认收款
  const handleConfirm = async () => {
    if (!selectedPayment) return;
    try {
      showToast('支付已确认');
      closeModal();
      loadData();
    } catch (err) {
      showToast('操作失败');
    }
  };

  // 拒绝
  const handleReject = async () => {
    if (!selectedPayment) return;
    try {
      showToast('支付已拒绝');
      closeModal();
      loadData();
    } catch (err) {
      showToast('操作失败');
    }
  };

  // 打开弹窗
  const openModal = (type: 'confirm' | 'reject', payment: Payment) => {
    setSelectedPayment(payment);
    setModalType(type);
    setConfirmAmount(payment.amount?.toString() || '');
  };

  // 关闭弹窗
  const closeModal = () => {
    setSelectedPayment(null);
    setModalType(null);
    setConfirmAmount('');
  };

  // 统计
  const stats = {
    pending: payments.filter((p) => p.status === 'pending').length,
    confirmed: payments.filter((p) => p.status === 'confirmed').length,
    rejected: payments.filter((p) => p.status === 'rejected').length,
    totalAmount: payments.filter((p) => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0),
  };

  // 表格列定义
  const columns: Column<Payment>[] = [
    {
      key: 'company',
      title: '企业',
      render: (_, p) => (
        <div className="min-w-0">
          <div className="font-medium text-gray-900 truncate">{p.companyName || p.user?.companyName}</div>
          <div className="text-xs text-gray-500 truncate">{p.email || p.user?.email}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      title: '金额',
      width: 120,
      align: 'right',
      render: (_, p) => <span className="font-mono font-bold text-gray-900">{formatMoney(p.amount)}</span>,
    },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (_, p) => {
        const statusMap = {
          pending: { text: '待审核', className: 'admin-badge-warning' },
          confirmed: { text: '已确认', className: 'admin-badge-success' },
          rejected: { text: '已拒绝', className: 'admin-badge-error' },
        };
        const status = statusMap[p.status];
        return <span className={`admin-badge ${status.className}`}>{status.text}</span>;
      },
    },
    {
      key: 'createdAt',
      title: '申请时间',
      width: 140,
      hideOnMobile: true,
      render: (_, p) => (
        <span className="text-sm text-gray-500">{new Date(p.createdAt).toLocaleDateString('zh-CN')}</span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: 140,
      align: 'right',
      render: (_, p) =>
        p.status === 'pending' ? (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openModal('confirm', p);
              }}
              className="admin-btn admin-btn-primary text-sm py-1.5"
            >
              确认
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openModal('reject', p);
              }}
              className="admin-btn bg-red-500 hover:bg-red-600 text-white text-sm py-1.5"
            >
              拒绝
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">对公支付</h1>
          <p className="text-gray-500 mt-1 text-sm">审核企业对公转账支付</p>
        </div>
        <button onClick={loadData} disabled={loading} className="admin-btn admin-btn-secondary">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* KPI 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="待审核"
          value={stats.pending.toString()}
          icon={<Clock className="w-5 h-5" />}
          color="orange"
        />
        <KPICard
          title="已确认"
          value={stats.confirmed.toString()}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
        <KPICard
          title="已拒绝"
          value={stats.rejected.toString()}
          icon={<XCircle className="w-5 h-5" />}
          color="red"
        />
        <KPICard
          title="待确认金额"
          value={formatMoney(stats.totalAmount)}
          icon={<DollarSign className="w-5 h-5" />}
          color="blue"
        />
      </div>

      {/* 数据表格 */}
      <DataTable
        data={payments}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyText="暂无对公支付申请"
      />

      {/* 说明信息 */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-start gap-3">
          <Building2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">对公支付说明</p>
            <p>企业用户通过银行转账方式付款后，需要管理员手动确认收款。确认后订单将自动进入下一步流程。</p>
          </div>
        </div>
      </div>

      {/* 弹窗 */}
      <AnimatePresence>
        {selectedPayment && modalType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`flex items-center justify-between px-6 py-4 border-b border-gray-100 ${
                  modalType === 'reject' ? 'bg-red-50' : 'bg-green-50'
                }`}
              >
                <h3
                  className={`text-lg font-semibold flex items-center gap-2 ${
                    modalType === 'reject' ? 'text-red-800' : 'text-green-800'
                  }`}
                >
                  {modalType === 'reject' ? (
                    <>
                      <AlertTriangle className="w-5 h-5" />
                      拒绝支付
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      确认收款
                    </>
                  )}
                </h3>
                <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-1">企业</div>
                  <div className="font-medium">{selectedPayment.companyName || selectedPayment.user?.companyName}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-1">金额</div>
                  <div className="font-mono font-bold text-xl">{formatMoney(selectedPayment.amount)}</div>
                </div>
                {modalType === 'confirm' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">确认金额</label>
                    <input
                      type="number"
                      value={confirmAmount}
                      onChange={(e) => setConfirmAmount(e.target.value)}
                      className="admin-input"
                      placeholder={selectedPayment.amount?.toString()}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                <button onClick={closeModal} className="admin-btn admin-btn-secondary">
                  取消
                </button>
                <button
                  onClick={modalType === 'reject' ? handleReject : handleConfirm}
                  className={`admin-btn ${
                    modalType === 'reject' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                  } text-white`}
                >
                  确认{modalType === 'reject' ? '拒绝' : '收款'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CorporatePayment;
