import React, { useState, useEffect } from 'react';
import {
  X, Package, CheckCircle2, XCircle, Truck, FileText,
  Clock, ShieldCheck, AlertTriangle, ChevronRight, Upload
} from 'lucide-react';
import { api } from '../api/client';

interface QaOrder {
  id: string;
  orderNumber: string;
  partNumber: string;
  quantity: number;
  totalAmount: number;
  status: string;
  sellerName: string;
  sellerHash: string;
  createdAt: string;
  logistics: {
    carrier: string;
    tracking_number: string;
    status: string;
    shipped_at: string;
  } | null;
}

interface QaWorkbenchProps {
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const QaWorkbench: React.FC<QaWorkbenchProps> = ({ onClose, showToast }) => {
  const [orders, setOrders] = useState<QaOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ inTransit: 0, received: 0, failed: 0, shipped: 0 });
  const [activeTab, setActiveTab] = useState<'in_transit' | 'qa_received' | 'all'>('in_transit');
  const [selectedOrder, setSelectedOrder] = useState<QaOrder | null>(null);
  const [shipModal, setShipModal] = useState<QaOrder | null>(null);
  const [rejectModal, setRejectModal] = useState<QaOrder | null>(null);
  const [shipData, setShipData] = useState({ carrier: '', trackingNumber: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const status = activeTab === 'all' ? undefined : activeTab;
      const [ordersRes, statsRes] = await Promise.all([
        api.getQaOrders(status),
        api.getQaStats(),
      ]);
      setOrders(ordersRes.items || []);
      setStats(statsRes || { inTransit: 0, received: 0, failed: 0, shipped: 0 });
    } catch (err: any) {
      showToast(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async (orderId: string) => {
    setProcessing(true);
    try {
      await api.qaReceiveOrder(orderId);
      showToast('已确认收货入库');
      loadData();
    } catch (err: any) {
      showToast(err.message || '操作失败');
    } finally {
      setProcessing(false);
    }
  };

  const handleShip = async () => {
    if (!shipModal || !shipData.carrier || !shipData.trackingNumber) {
      showToast('请填写完整物流信息');
      return;
    }

    setProcessing(true);
    try {
      await api.qaShipToBuyer(shipModal.id, shipData);
      showToast('已发货给买家');
      setShipModal(null);
      setShipData({ carrier: '', trackingNumber: '' });
      loadData();
    } catch (err: any) {
      showToast(err.message || '发货失败');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason) {
      showToast('请填写失败原因');
      return;
    }

    setProcessing(true);
    try {
      await api.qaRejectOrder(rejectModal.id, rejectReason);
      showToast('质检失败，已退回卖家');
      setRejectModal(null);
      setRejectReason('');
      loadData();
    } catch (err: any) {
      showToast(err.message || '操作失败');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string; icon: any }> = {
      'qa_in_transit': { label: '运输中', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Truck },
      'qa_received': { label: '已入库', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Package },
      'qa_failed': { label: '质检失败', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
      'shipped_to_buyer': { label: '已发买家', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
    };

    const c = config[status] || { label: status, color: 'bg-gray-100 text-gray-700', icon: Clock };
    const Icon = c.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${c.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {c.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-100 overflow-auto">
      {/* 顶部导航 */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-orange-600" />
            <h1 className="text-xl font-bold text-gray-900">QA质检工作台</h1>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">运输中</span>
              <Truck className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-blue-600">{stats.inTransit}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">已入库待检</span>
              <Package className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-orange-600">{stats.received}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">质检失败</span>
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-red-600">{stats.failed}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">已发买家</span>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-600">{stats.shipped}</div>
          </div>
        </div>

        {/* 标签页 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('in_transit')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'in_transit' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            运输中 ({stats.inTransit})
          </button>
          <button
            onClick={() => setActiveTab('qa_received')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'qa_received' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            已入库待检 ({stats.received})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'all' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            全部
          </button>
        </div>

        {/* 订单列表 */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
            加载中...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            暂无待处理订单
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {/* 订单头部 */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-gray-500 text-xs">订单号：</span>
                      <span className="font-mono font-medium text-gray-900">{order.orderNumber}</span>
                    </div>
                    <div className="text-gray-400">|</div>
                    <div className="text-sm text-gray-500">
                      卖家：{order.sellerHash}
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                {/* 订单内容 */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-xl font-bold text-gray-900 mb-2">{order.partNumber}</div>
                      <div className="text-sm text-gray-500 space-y-1">
                        <div>数量：<span className="font-medium text-gray-900">{order.quantity.toLocaleString()} 件</span></div>
                        <div>金额：<span className="font-medium text-red-600">¥ {order.totalAmount.toLocaleString()}</span></div>
                        {order.logistics && (
                          <div>物流：<span className="font-medium">{order.logistics.carrier} - {order.logistics.tracking_number}</span></div>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                  {order.status === 'qa_in_transit' && (
                    <>
                      <button
                        onClick={() => handleReceive(order.id)}
                        disabled={processing}
                        className="px-4 py-2 bg-blue-500 text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        确认收货入库
                      </button>
                      <button
                        onClick={() => setRejectModal(order)}
                        className="px-4 py-2 bg-red-100 text-red-600 text-sm font-bold rounded-lg hover:bg-red-200 transition-colors"
                      >
                        标记异常
                      </button>
                    </>
                  )}

                  {order.status === 'qa_received' && (
                    <>
                      <button
                        onClick={() => setShipModal(order)}
                        disabled={processing}
                        className="px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <Truck className="w-4 h-4" />
                        发货给买家
                      </button>
                      <button
                        onClick={() => setRejectModal(order)}
                        className="px-4 py-2 bg-red-100 text-red-600 text-sm font-bold rounded-lg hover:bg-red-200 transition-colors"
                      >
                        质检失败
                      </button>
                    </>
                  )}

                  {order.status === 'qa_failed' && (
                    <span className="text-red-600 text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      质检失败，已退回卖家
                    </span>
                  )}

                  {order.status === 'shipped_to_buyer' && (
                    <span className="text-green-600 text-sm font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      已发货给买家
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 发货弹窗 */}
      {shipModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">发货给买家</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">物流公司</label>
                <select
                  value={shipData.carrier}
                  onChange={(e) => setShipData({ ...shipData, carrier: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">请选择</option>
                  <option value="顺丰速运">顺丰速运</option>
                  <option value="京东物流">京东物流</option>
                  <option value="中通快递">中通快递</option>
                  <option value="圆通速递">圆通速递</option>
                  <option value="韵达快递">韵达快递</option>
                  <option value="EMS">EMS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">运单号</label>
                <input
                  type="text"
                  value={shipData.trackingNumber}
                  onChange={(e) => setShipData({ ...shipData, trackingNumber: e.target.value })}
                  placeholder="请输入运单号"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShipModal(null); setShipData({ carrier: '', trackingNumber: '' }); }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleShip}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                确认发货
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 拒绝弹窗 */}
      {rejectModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4 text-red-600">质检失败</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">失败原因</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请输入质检失败的原因..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none resize-none"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                确认退回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
