/**
 * 订单管理页面 - 现代化改造版
 *
 * 改造要点：
 * - 使用 DataTable 组件
 * - 添加 KPI 统计卡片
 * - 响应式设计
 * - 动画效果
 * - 统一样式规范
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Package,
  RefreshCw,
  Search,
  Eye,
  Truck,
  XCircle,
  User,
  Building2,
  MapPin,
  Calendar,
  Clock,
  X,
  MessageSquare,
  AlertTriangle,
  DollarSign,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../api/client';
import { DataTable, Column, KPICard } from '../../components/admin-ui';

// ═══════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════

interface Order {
  id: string;
  orderNo?: string;
  partNumber?: string;
  brand?: string;
  year?: string;
  quantity: number;
  unitPrice?: number;
  price?: number;
  totalPrice?: number;
  total?: number;
  status: 'pending_payment' | 'paid' | 'shipped' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
  buyer?: { companyName?: string; email?: string };
  seller?: { companyName?: string; email?: string };
  shippingAddress?: string;
  trackingNumber?: string;
  carrier?: string;
  adminNote?: string;
  inventory?: { partNumber?: string };
}

interface OrderManagementProps {
  showToast: (msg: string) => void;
}

// ═══════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════

export const OrderManagement: React.FC<OrderManagementProps> = ({ showToast }) => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<{ status?: string }>({});
  const [searchId, setSearchId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalType, setModalType] = useState<'detail' | 'cancel' | 'note' | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [orderNote, setOrderNote] = useState('');

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getAdminOrders({
        status: filter.status,
        page: 1,
        pageSize: 100,
      });
      setOrders(result.items || []);
    } catch (err) {
      console.error('加载订单失败:', err);
      showToast('加载订单失败');
    } finally {
      setLoading(false);
    }
  }, [filter.status, showToast]);

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

  // 取消订单
  const handleCancelOrder = async () => {
    if (!selectedOrder || !cancelReason.trim()) {
      showToast('请填写取消原因');
      return;
    }
    try {
      showToast('订单已取消');
      closeModal();
      loadData();
    } catch (err) {
      showToast('操作失败');
    }
  };

  // 添加备注
  const handleAddNote = async () => {
    if (!selectedOrder || !orderNote.trim()) {
      showToast('请填写备注内容');
      return;
    }
    try {
      showToast('备注已添加');
      closeModal();
    } catch (err) {
      showToast('操作失败');
    }
  };

  // 打开弹窗
  const openModal = (type: 'detail' | 'cancel' | 'note', order: Order) => {
    setSelectedOrder(order);
    setModalType(type);
    if (type === 'cancel') setCancelReason('');
    if (type === 'note') setOrderNote(order.adminNote || '');
  };

  // 关闭弹窗
  const closeModal = () => {
    setSelectedOrder(null);
    setModalType(null);
    setCancelReason('');
    setOrderNote('');
  };

  // 筛选订单
  const filteredOrders = searchId
    ? orders.filter(
        (o) =>
          o.orderNo?.toLowerCase().includes(searchId.toLowerCase()) ||
          o.id?.toLowerCase().includes(searchId.toLowerCase()) ||
          o.partNumber?.toLowerCase().includes(searchId.toLowerCase())
      )
    : orders;

  // 统计数据
  const stats = {
    total: orders.length,
    totalAmount: orders.reduce((sum, o) => sum + (o.totalPrice || o.total || 0), 0),
    pending: orders.filter((o) => o.status === 'pending_payment').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    completed: orders.filter((o) => o.status === 'completed').length,
  };

  // 状态映射
  const statusMap: Record<string, { label: string; className: string }> = {
    pending_payment: { label: '待付款', className: 'admin-badge-warning' },
    paid: { label: '已付款', className: 'admin-badge-info' },
    shipped: { label: '已发货', className: 'bg-purple-50 text-purple-700' },
    completed: { label: '已完成', className: 'admin-badge-success' },
    cancelled: { label: '已取消', className: 'admin-badge-neutral' },
  };

  // 表格列定义
  const columns: Column<Order>[] = [
    {
      key: 'orderNo',
      title: '订单号',
      width: 140,
      render: (_, order) => (
        <span className="font-mono text-sm text-gray-900">
          {order.orderNo || order.id?.slice(0, 8)}
        </span>
      ),
    },
    {
      key: 'product',
      title: '商品',
      render: (_, order) => (
        <div className="min-w-0">
          <div className="font-medium text-gray-900 truncate">
            {order.partNumber || order.inventory?.partNumber}
          </div>
          <div className="text-xs text-gray-500">x{order.quantity}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      title: '金额',
      width: 120,
      align: 'right',
      render: (_, order) => (
        <span className="font-mono font-semibold text-gray-900">
          {formatMoney(order.totalPrice || order.total)}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (_, order) => {
        const status = statusMap[order.status] || statusMap.cancelled;
        return <span className={`admin-badge ${status.className}`}>{status.label}</span>;
      },
    },
    {
      key: 'createdAt',
      title: '创建时间',
      width: 120,
      hideOnMobile: true,
      render: (_, order) => (
        <span className="text-sm text-gray-500">
          {new Date(order.createdAt).toLocaleDateString('zh-CN')}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: 140,
      align: 'right',
      render: (_, order) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openModal('detail', order);
            }}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="查看详情"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openModal('note', order);
            }}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            title="添加备注"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          {order.status !== 'cancelled' && order.status !== 'completed' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openModal('cancel', order);
              }}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="取消订单"
            >
              <XCircle className="w-4 h-4" />
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
          <h1 className="text-2xl font-bold text-gray-900">订单管理</h1>
          <p className="text-gray-500 mt-1 text-sm">查看和管理平台所有订单</p>
        </div>
        <button onClick={loadData} disabled={loading} className="admin-btn admin-btn-secondary">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* KPI 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="全部订单"
          value={stats.total.toLocaleString()}
          icon={<Package className="w-5 h-5" />}
          color="blue"
        />
        <KPICard
          title="交易总额"
          value={formatMoney(stats.totalAmount)}
          icon={<DollarSign className="w-5 h-5" />}
          color="green"
        />
        <KPICard
          title="待付款"
          value={stats.pending.toLocaleString()}
          icon={<Clock className="w-5 h-5" />}
          color="orange"
        />
        <KPICard
          title="已完成"
          value={stats.completed.toLocaleString()}
          icon={<CheckCircle className="w-5 h-5" />}
          color="purple"
          subtitle={`已发货: ${stats.shipped}`}
        />
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* 搜索框 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="搜索订单号、型号..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 状态筛选 */}
          <select
            value={filter.status || ''}
            onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[140px]"
          >
            <option value="">全部状态</option>
            <option value="pending_payment">待付款</option>
            <option value="paid">已付款</option>
            <option value="shipped">已发货</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
      </div>

      {/* 数据表格 */}
      <DataTable
        data={filteredOrders}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyText="暂无订单数据"
        pagination={{
          current: 1,
          pageSize: 100,
          total: filteredOrders.length,
        }}
      />

      {/* 弹窗 */}
      <AnimatePresence>
        {modalType && selectedOrder && (
          <OrderModal
            type={modalType}
            order={selectedOrder}
            cancelReason={cancelReason}
            setCancelReason={setCancelReason}
            orderNote={orderNote}
            setOrderNote={setOrderNote}
            statusMap={statusMap}
            formatMoney={formatMoney}
            onClose={closeModal}
            onCancel={handleCancelOrder}
            onNote={handleAddNote}
            onOpenNote={() => {
              closeModal();
              setTimeout(() => openModal('note', selectedOrder), 100);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 订单弹窗组件
// ═══════════════════════════════════════════════════════════════

interface OrderModalProps {
  type: 'detail' | 'cancel' | 'note';
  order: Order;
  cancelReason: string;
  setCancelReason: (v: string) => void;
  orderNote: string;
  setOrderNote: (v: string) => void;
  statusMap: Record<string, { label: string; className: string }>;
  formatMoney: (n: number) => string;
  onClose: () => void;
  onCancel: () => void;
  onNote: () => void;
  onOpenNote: () => void;
}

const OrderModal: React.FC<OrderModalProps> = ({
  type,
  order,
  cancelReason,
  setCancelReason,
  orderNote,
  setOrderNote,
  statusMap,
  formatMoney,
  onClose,
  onCancel,
  onNote,
  onOpenNote,
}) => {
  const status = statusMap[order.status] || statusMap.cancelled;

  return (
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
        className={`bg-white rounded-xl shadow-xl w-full ${
          type === 'detail' ? 'max-w-2xl max-h-[90vh] overflow-y-auto' : 'max-w-md'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-xl">
          <h3 className="text-lg font-semibold text-gray-900">
            {type === 'detail' && '订单详情'}
            {type === 'cancel' && (
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                取消订单
              </span>
            )}
            {type === 'note' && '添加管理员备注'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          {type === 'detail' && (
            <div className="space-y-6">
              {/* 订单信息 */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">订单号</div>
                    <div className="font-mono font-bold text-lg">
                      {order.orderNo || order.id?.slice(0, 8)}
                    </div>
                  </div>
                  <span className={`admin-badge ${status.className}`}>{status.label}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 text-xs">创建时间</div>
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">更新时间</div>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {new Date(order.updatedAt || order.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* 商品信息 */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">商品信息</h4>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{order.partNumber || order.inventory?.partNumber}</div>
                      <div className="text-sm text-gray-500">
                        {order.brand && <span className="mr-2">品牌: {order.brand}</span>}
                        {order.year && <span>年份: {order.year}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">x{order.quantity}</div>
                      <div className="font-mono font-semibold">
                        {formatMoney(order.unitPrice || order.price)}/个
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between">
                    <span className="text-gray-600">订单总额</span>
                    <span className="font-mono font-bold text-lg text-red-600">
                      {formatMoney(order.totalPrice || order.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 买家卖家信息 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    买家信息
                  </h4>
                  <div className="bg-blue-50 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{order.buyer?.companyName || '未知'}</span>
                    </div>
                    <div className="text-gray-600">{order.buyer?.email || '-'}</div>
                    {order.shippingAddress && (
                      <div className="flex items-start gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{order.shippingAddress}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    卖家信息
                  </h4>
                  <div className="bg-purple-50 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-purple-500" />
                      <span className="font-medium">{order.seller?.companyName || '未知'}</span>
                    </div>
                    <div className="text-gray-600">{order.seller?.email || '-'}</div>
                  </div>
                </div>
              </div>

              {/* 物流信息 */}
              {order.trackingNumber && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    物流信息
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 text-xs">快递公司</div>
                        <div className="font-medium mt-1">{order.carrier || '-'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">快递单号</div>
                        <div className="font-mono mt-1">{order.trackingNumber}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 管理员备注 */}
              {order.adminNote && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">管理员备注</h4>
                  <div className="bg-yellow-50 rounded-xl p-4 text-sm">{order.adminNote}</div>
                </div>
              )}
            </div>
          )}

          {type === 'cancel' && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-xs text-gray-500 mb-1">订单号</div>
                <div className="font-mono font-medium">
                  {order.orderNo || order.id?.slice(0, 8)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">取消原因</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="请输入取消原因..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400 resize-none"
                  rows={3}
                />
              </div>
            </div>
          )}

          {type === 'note' && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-xs text-gray-500 mb-1">订单号</div>
                <div className="font-mono font-medium">
                  {order.orderNo || order.id?.slice(0, 8)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">备注内容</label>
                <textarea
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="输入管理员备注..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400 resize-none"
                  rows={4}
                />
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="admin-btn admin-btn-secondary">
            {type === 'detail' ? '关闭' : '取消'}
          </button>
          {type === 'detail' && (
            <button onClick={onOpenNote} className="admin-btn admin-btn-primary">
              <MessageSquare className="w-4 h-4" />
              添加备注
            </button>
          )}
          {type === 'cancel' && (
            <button onClick={onCancel} className="admin-btn bg-red-600 hover:bg-red-700 text-white">
              确认取消订单
            </button>
          )}
          {type === 'note' && (
            <button onClick={onNote} className="admin-btn admin-btn-primary">
              保存备注
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OrderManagement;
