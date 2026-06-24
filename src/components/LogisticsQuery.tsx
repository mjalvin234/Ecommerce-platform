import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Truck, MapPin, Clock, CheckCircle, Package, Search, Loader2 } from 'lucide-react';

interface LogisticsTrace {
  time: string;
  context: string;
  location?: string;
}

interface LogisticsInfo {
  carrier: string;
  status: string;
  traces: LogisticsTrace[];
  estimatedDelivery?: string;
}

export function LogisticsQuery({ trackingNumber: propTrackingNumber }: { trackingNumber?: string }) {
  const [trackingNumber, setTrackingNumber] = useState(propTrackingNumber || '');
  const [logistics, setLogistics] = useState<LogisticsInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [detectedCarrier, setDetectedCarrier] = useState<{ carrier: string; carrierCode: string } | null>(null);

  useEffect(() => {
    if (propTrackingNumber) {
      queryLogistics(propTrackingNumber);
    }
  }, [propTrackingNumber]);

  const detectCarrier = async (number: string) => {
    if (number.length < 6) {
      setDetectedCarrier(null);
      return;
    }

    try {
      const result = await api.autoDetectCarrier(number);
      setDetectedCarrier(result);
    } catch {
      setDetectedCarrier(null);
    }
  };

  const queryLogistics = async (number?: string) => {
    const tn = number || trackingNumber;
    if (!tn) return;

    setLoading(true);
    try {
      const result = await api.queryLogistics(tn);
      setLogistics(result);
    } catch (err: any) {
      alert(err.message || '查询失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'delivering':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'in_transit':
        return <Package className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '待发货',
      shipped: '已发货',
      in_transit: '运输中',
      delivering: '派送中',
      delivered: '已签收',
      returned: '退回',
      exception: '异常'
    };
    return labels[status] || status;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* 查询输入 */}
      {!propTrackingNumber && (
        <div className="mb-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => { setTrackingNumber(e.target.value); detectCarrier(e.target.value); }}
                placeholder="输入快递单号"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10"
              />
              {detectedCarrier && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  {detectedCarrier.carrier}
                </div>
              )}
            </div>
            <button
              onClick={() => queryLogistics()}
              disabled={loading || !trackingNumber}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              查询
            </button>
          </div>
        </div>
      )}

      {/* 物流信息 */}
      {logistics && (
        <div>
          {/* 物流头部 */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-gray-600" />
              <span className="font-medium">{logistics.carrier}</span>
              <span className="text-gray-500">{trackingNumber}</span>
            </div>
            <div className="flex items-center gap-1">
              {getStatusIcon(logistics.status)}
              <span className="text-sm">{getStatusLabel(logistics.status)}</span>
            </div>
          </div>

          {/* 预计到达时间 */}
          {logistics.estimatedDelivery && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              预计到达：{new Date(logistics.estimatedDelivery).toLocaleString('zh-CN')}
            </div>
          )}

          {/* 物流轨迹 */}
          <div className="space-y-0">
            {logistics.traces.map((trace, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                  {index < logistics.traces.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 min-h-8" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="text-sm text-gray-900">{trace.context}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(trace.time).toLocaleString('zh-CN')}
                    {trace.location && ` · ${trace.location}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 发货录入组件
export function ShipOrderForm({ orderId, onShipped }: { orderId: string; onShipped?: () => void }) {
  const [carrierCode, setCarrierCode] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectedCarrier, setDetectedCarrier] = useState<{ carrier: string; carrierCode: string } | null>(null);

  const carriers = [
    { code: 'SF', name: '顺丰速运' },
    { code: 'YTO', name: '圆通速递' },
    { code: 'ZTO', name: '中通快递' },
    { code: 'STO', name: '申通快递' },
    { code: 'YD', name: '韵达快递' },
    { code: 'JD', name: '京东物流' },
    { code: 'EMS', name: 'EMS' },
  ];

  const detectCarrier = async (number: string) => {
    if (number.length < 6) {
      setDetectedCarrier(null);
      return;
    }

    try {
      const result = await api.autoDetectCarrier(number);
      setDetectedCarrier(result);
      if (result) {
        setCarrierCode(result.carrierCode);
      }
    } catch {
      setDetectedCarrier(null);
    }
  };

  const handleSubmit = async () => {
    if (!carrierCode || !trackingNumber) {
      alert('请填写完整信息');
      return;
    }

    setLoading(true);
    try {
      await api.submitLogistics(orderId, carrierCode, trackingNumber);
      alert('发货成功');
      onShipped?.();
    } catch (err: any) {
      alert(err.message || '发货失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-4">发货录入</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-2">快递公司</label>
          <select
            value={carrierCode}
            onChange={(e) => setCarrierCode(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2"
          >
            <option value="">请选择快递公司</option>
            {carriers.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2">快递单号</label>
          <div className="relative">
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => { setTrackingNumber(e.target.value); detectCarrier(e.target.value); }}
              placeholder="输入快递单号"
              className="w-full border border-gray-300 rounded-lg p-2"
            />
            {detectedCarrier && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-green-600">
                已识别: {detectedCarrier.carrier}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !carrierCode || !trackingNumber}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          确认发货
        </button>
      </div>
    </div>
  );
}
