import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { FileText, Send, X, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  partNumber: string;
  totalAmount: number;
  status: string;
}

interface Invoice {
  id: string;
  orderId: string;
  invoiceType: 'normal' | 'special';
  title: string;
  taxNumber: string;
  amount: number;
  status: 'pending' | 'processing' | 'issued' | 'rejected';
  invoiceNo?: string;
  rejectReason?: string;
  createdAt: string;
  order?: Order;
  seller?: { id: string; companyName: string };
  buyer?: { id: string; companyName: string };
}

// 买家申请开票
export function InvoiceApply() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string>('');
  const [invoiceType, setInvoiceType] = useState<'normal' | 'special'>('normal');
  const [title, setTitle] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompletedOrders();
  }, []);

  const loadCompletedOrders = async () => {
    setLoading(true);
    try {
      const result = await api.getBuyerOrders();
      const completed = result.filter((o: any) => o.status === 'completed');
      setOrders(completed);
    } catch (err) {
      console.error('加载订单失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedOrder) {
      alert('请选择订单');
      return;
    }
    if (!title.trim()) {
      alert('请输入发票抬头');
      return;
    }
    if (!taxNumber.trim()) {
      alert('请输入税号');
      return;
    }

    setSubmitting(true);
    try {
      await api.createInvoice({
        orderId: selectedOrder,
        invoiceType,
        title,
        taxNumber,
        remark
      });
      alert('发票申请提交成功');
      setSelectedOrder('');
      setTitle('');
      setTaxNumber('');
      setRemark('');
      loadCompletedOrders();
    } catch (err: any) {
      alert(err.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">加载中...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        申请开票
      </h3>

      {orders.length === 0 ? (
        <p className="text-gray-500 text-center py-4">没有可开票的订单</p>
      ) : (
        <div className="space-y-4">
          {/* 选择订单 */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">选择订单</label>
            <select
              value={selectedOrder}
              onChange={(e) => setSelectedOrder(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="">请选择订单</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} - {order.partNumber} - ¥{order.totalAmount}
                </option>
              ))}
            </select>
          </div>

          {/* 发票类型 */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">发票类型</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={invoiceType === 'normal'}
                  onChange={() => setInvoiceType('normal')}
                />
                普通发票
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={invoiceType === 'special'}
                  onChange={() => setInvoiceType('special')}
                />
                专用发票
              </label>
            </div>
          </div>

          {/* 发票抬头 */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">发票抬头</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入发票抬头"
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          {/* 税号 */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">税号</label>
            <input
              type="text"
              value={taxNumber}
              onChange={(e) => setTaxNumber(e.target.value)}
              placeholder="请输入纳税人识别号"
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">备注（选填）</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="其他需要说明的信息"
              rows={2}
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          {/* 提交按钮 */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {submitting ? '提交中...' : '提交申请'}
          </button>
        </div>
      )}
    </div>
  );
}

// 卖家处理发票
export function InvoiceProcess() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const result = await api.getSellerInvoices('pending');
      setInvoices(result.items);
    } catch (err) {
      console.error('加载发票失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id: string) => {
    if (!invoiceNo.trim()) {
      alert('请输入发票号码');
      return;
    }

    try {
      await api.processInvoice(id, invoiceNo);
      alert('发票开具成功');
      setProcessingId(null);
      setInvoiceNo('');
      loadInvoices();
    } catch (err: any) {
      alert(err.message || '处理失败');
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      alert('请输入拒绝原因');
      return;
    }

    try {
      await api.rejectInvoice(id, rejectReason);
      alert('已拒绝开票');
      setShowReject(false);
      setRejectReason('');
      loadInvoices();
    } catch (err: any) {
      alert(err.message || '处理失败');
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: '待处理' },
      processing: { color: 'bg-blue-100 text-blue-700', icon: AlertCircle, label: '处理中' },
      issued: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: '已开具' },
      rejected: { color: 'bg-red-100 text-red-700', icon: XCircle, label: '已拒绝' }
    };
    const { color, icon: Icon, label } = config[status] || config.pending;
    return (
      <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${color}`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    );
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">加载中...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">发票处理</h3>

      {invoices.length === 0 ? (
        <p className="text-gray-500 text-center py-4">暂无待处理发票</p>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-medium text-gray-900">
                    {invoice.buyer?.companyName}
                  </div>
                  <div className="text-sm text-gray-500">
                    金额: ¥{invoice.amount} |
                    类型: {invoice.invoiceType === 'normal' ? '普通发票' : '专用发票'}
                  </div>
                </div>
                {getStatusBadge(invoice.status)}
              </div>

              <div className="text-sm text-gray-600 mb-3">
                <div>抬头: {invoice.title}</div>
                <div>税号: {invoice.taxNumber}</div>
              </div>

              {processingId === invoice.id ? (
                <div className="space-y-3 mt-4 pt-4 border-t">
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    placeholder="输入发票号码"
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleProcess(invoice.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      确认开具
                    </button>
                    <button
                      onClick={() => setProcessingId(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : showReject === invoice.id ? (
                <div className="space-y-3 mt-4 pt-4 border-t">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="输入拒绝原因"
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReject(invoice.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      确认拒绝
                    </button>
                    <button
                      onClick={() => setShowReject(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <button
                    onClick={() => setProcessingId(invoice.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    开具发票
                  </button>
                  <button
                    onClick={() => setShowReject(invoice.id)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    拒绝
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 发票列表
export function InvoiceList({ role }: { role: 'buyer' | 'seller' }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    loadInvoices();
  }, [role, status]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const result = role === 'buyer'
        ? await api.getBuyerInvoices()
        : await api.getSellerInvoices(status || undefined);
      setInvoices(result.items);
    } catch (err) {
      console.error('加载发票失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (invoice: Invoice) => {
    const config: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-700', label: '待处理' },
      processing: { color: 'bg-blue-100 text-blue-700', label: '处理中' },
      issued: { color: 'bg-green-100 text-green-700', label: '已开具' },
      rejected: { color: 'bg-red-100 text-red-700', label: '已拒绝' }
    };
    const { color, label } = config[invoice.status] || config.pending;
    return <span className={`px-2 py-1 rounded text-xs ${color}`}>{label}</span>;
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">加载中...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">发票记录</h3>
        {role === 'seller' && (
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 text-sm"
          >
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="issued">已开具</option>
            <option value="rejected">已拒绝</option>
          </select>
        )}
      </div>

      {invoices.length === 0 ? (
        <p className="text-gray-500 text-center py-4">暂无发票记录</p>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium text-gray-900">{invoice.title}</div>
                  <div className="text-sm text-gray-500">税号: {invoice.taxNumber}</div>
                </div>
                {getStatusBadge(invoice)}
              </div>
              <div className="text-sm text-gray-600">
                金额: ¥{invoice.amount} |
                {invoice.invoiceNo && ` 发票号: ${invoice.invoiceNo}`}
                {invoice.rejectReason && ` 拒绝原因: ${invoice.rejectReason}`}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {new Date(invoice.createdAt).toLocaleString('zh-CN')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
