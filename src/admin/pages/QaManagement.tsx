/**
 * QA质检管理页面 - 现代化改造版
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClipboardCheck,
  RefreshCw,
  Package,
  CheckCircle,
  XCircle,
  X,
  Truck,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../api/client';
import { DataTable, Column, KPICard } from '../../components/admin-ui';

// ═══════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════

interface QaOrder {
  id: string;
  orderNumber: string;
  partNumber: string;
  quantity: number;
  totalAmount: number;
  status: 'qa_in_transit' | 'qa_received' | 'qa_failed' | 'shipped_to_buyer';
  sellerName: string;
  sellerHash: string;
  createdAt: string;
  logistics?: {
    carrier: string;
    trackingNumber: string;
    status: string;
    shippedAt: string;
  } | null;
}

interface QaManagementProps {
  showToast: (msg: string) => void;
}

// ═══════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════

export const QaManagement: React.FC<QaManagementProps> = ({ showToast }) => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<QaOrder[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<QaOrder | null>(null);
  const [modalType, setModalType] = useState<'ship' | 'reject' | null>(null);
  const [shipData, setShipData] = useState({ carrier: '', trackingNumber: '' });
  const [rejectReason, setRejectReason] = useState('');

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersResult, statsResult] = await Promise.all([
        api.getQaOrders() as any,
        api.getQaStats().catch(() => null) as any,
      ]);
      console.log('QA Orders:', ordersResult);
      setOrders(ordersResult.items || []);
      setStats(statsResult);
    } catch (err) {
      console.error('加载质检订单失败:', err);
      showToast('加载质检订单失败');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 接收质检
  const handleReceive = async (orderId: string) => {
    try {
      await api.qaReceiveOrder(orderId);
      showToast('已接收订单');
      loadData();
    } catch (err) {
      showToast('操作失败');
    }
  };

  // 发货
  const handleShip = async () => {
    if (!selectedOrder || !shipData.carrier || !shipData.trackingNumber) {
      showToast('请填写快递公司和单号');
      return;
    }
    try {
      await api.qaShipToBuyer(selectedOrder.id, shipData);
      showToast('已发货给买家');
      closeModal();
      loadData();
    } catch (err) {
      showToast('操作失败');
    }
  };

  // 退回
  const handleReject = async () => {
    if (!selectedOrder || !rejectReason.trim()) {
      showToast('请填写退回原因');
      return;
    }
    try {
      await api.qaRejectOrder(selectedOrder.id, rejectReason);
      showToast('已退回给供应商');
      closeModal();
      loadData();
    } catch (err) {
      showToast('操作失败');
    }
  };

  // 打开弹窗
  const openModal = (type: 'ship' | 'reject', order: QaOrder) => {
    setSelectedOrder(order);
    setModalType(type);
    if (type === 'ship') setShipData({ carrier: '', trackingNumber: '' });
    else setRejectReason('');
  };

  // 关闭弹窗
  const closeModal = () => {
    setSelectedOrder(null);
    setModalType(null);
  };

  // 状态映射
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      qa_in_transit: { text: '待接收', className: 'admin-badge-warning' },
      qa_received: { text: '质检中', className: 'admin-badge-info' },
      qa_failed: { text: '已退回', className: 'admin-badge-error' },
      shipped_to_buyer: { text: '已发货', className: 'admin-badge-success' },
    };
    return statusMap[status] || { text: status, className: 'admin-badge-default' };
  };

  // 统计
  const orderStats = stats || {
    inTransit: orders.filter((o) => o.status === 'qa_in_transit').length,
    received: orders.filter((o) => o.status === 'qa_received').length,
    failed: orders.filter((o) => o.status === 'qa_failed').length,
    shipped: orders.filter((o) => o.status === 'shipped_to_buyer').length,
  };

  // 表格列定义
  const columns: Column<QaOrder>[] = [
    {
      key: 'orderNumber',
      title: '订单号',
      width: 140,
      render: (_, o) => (
        <span className="font-mono text-sm font-semibold text-gray-900">{o.orderNumber}</span>
      ),
    },
    {
      key: 'product',
      title: '商品信息',
      render: (_, o) => (
        <div className="min-w-0">
          <div className="font-semibold text-gray-900">{o.partNumber}</div>
          <div className="text-sm text-gray-600">数量: {o.quantity.toLocaleString()}</div>
        </div>
      ),
    },
    {
      key: 'seller',
      title: '供应商',
      hideOnMobile: true,
      render: (_, o) => (
        <span className="text-sm font-medium text-gray-800">{o.sellerName || '-'}</span>
      ),
    },
    {
      key: 'logistics',
      title: '物流信息',
      hideOnMobile: true,
      render: (_, o) => (
        o.logistics ? (
          <div className="text-sm">
            <div className="font-medium text-gray-900">{o.logistics.carrier}</div>
            <div className="text-gray-700 font-mono">{o.logistics.trackingNumber}</div>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (_, o) => {
        const statusInfo = getStatusInfo(o.status);
        return <span className={`admin-badge ${statusInfo.className}`}>{statusInfo.text}</span>;
      },
    },
    {
      key: 'actions',
      title: '操作',
      width: 120,
      align: 'center',
      render: (_, o) => (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {o.status === 'qa_in_transit' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReceive(o.id);
              }}
              className="admin-btn admin-btn-primary text-sm py-1.5 px-4 whitespace-nowrap"
            >
              接收质检
            </button>
          )}
          {o.status === 'qa_received' && (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openModal('ship', o);
                }}
                className="admin-btn admin-btn-primary text-sm py-1.5 px-3 whitespace-nowrap"
              >
                <Truck className="w-4 h-4" />
                通过
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openModal('reject', o);
                }}
                className="admin-btn bg-red-500 hover:bg-red-600 text-white text-sm py-1.5 px-3 whitespace-nowrap"
              >
                退回
              </button>
            </div>
          )}
          {!['qa_in_transit', 'qa_received'].includes(o.status) && (
            <span className="text-gray-400 text-sm">-</span>
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
          <h1 className="text-2xl font-bold text-gray-900">QA质检</h1>
          <p className="text-gray-500 mt-1 text-sm">质检工作台管理</p>
        </div>
        <button onClick={loadData} disabled={loading} className="admin-btn admin-btn-secondary">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* KPI 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="待接收"
          value={(orderStats.inTransit || 0).toString()}
          icon={<Package className="w-5 h-5" />}
          color="orange"
        />
        <KPICard
          title="质检中"
          value={(orderStats.received || 0).toString()}
          icon={<ClipboardCheck className="w-5 h-5" />}
          color="blue"
        />
        <KPICard
          title="已发货"
          value={(orderStats.shipped || 0).toString()}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
        <KPICard
          title="已退回"
          value={(orderStats.failed || 0).toString()}
          icon={<XCircle className="w-5 h-5" />}
          color="red"
        />
      </div>

      {/* 数据表格 */}
      <DataTable
        data={orders}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyText="暂无质检订单"
      />

      {/* 弹窗 */}
      <AnimatePresence>
        {selectedOrder && modalType && (
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
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalType === 'ship' ? '发货给买家' : '退回给供应商'}
                </h3>
                <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 订单信息 */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">订单号</span>
                  <span className="font-mono font-medium">{selectedOrder.orderNumber}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-500">商品</span>
                  <span className="font-medium">{selectedOrder.partNumber} x{selectedOrder.quantity}</span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {modalType === 'ship' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">快递公司</label>
                      <input
                        type="text"
                        value={shipData.carrier}
                        onChange={(e) => setShipData({ ...shipData, carrier: e.target.value })}
                        className="admin-input"
                        placeholder="如：顺丰、中通"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">快递单号</label>
                      <input
                        type="text"
                        value={shipData.trackingNumber}
                        onChange={(e) => setShipData({ ...shipData, trackingNumber: e.target.value })}
                        className="admin-input"
                        placeholder="输入快递单号"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">退回原因</label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="请填写退回原因..."
                      rows={4}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                <button onClick={closeModal} className="admin-btn admin-btn-secondary">
                  取消
                </button>
                <button
                  onClick={modalType === 'ship' ? handleShip : handleReject}
                  className={`admin-btn ${
                    modalType === 'ship' ? 'admin-btn-primary' : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  确认{modalType === 'ship' ? '发货' : '退回'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QaManagement;
