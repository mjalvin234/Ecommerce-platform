import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, QrCode, CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { api } from '../api/client';

interface PaymentPageProps {
  orderId: string;
  orderNumber: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

type PaymentChannel = 'alipay' | 'wechat';

export const PaymentPage: React.FC<PaymentPageProps> = ({
  orderId,
  orderNumber,
  amount,
  onSuccess,
  onCancel,
  showToast,
}) => {
  const [step, setStep] = useState<'select' | 'paying' | 'success' | 'failed'>('select');
  const [selectedChannel, setSelectedChannel] = useState<PaymentChannel | null>(null);
  const [paymentNo, setPaymentNo] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [payUrl, setPayUrl] = useState<string>('');
  const [channels, setChannels] = useState<Array<{
    channel: PaymentChannel;
    channelName: string;
    enabled: boolean;
    configured: boolean;
  }>>([]);
  const [loading, setLoading] = useState(false);

  // 加载可用支付方式
  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const result = await api.getPaymentChannels();
      setChannels(result.filter(c => c.enabled && c.configured));
    } catch (err) {
      console.error('加载支付方式失败:', err);
    }
  };

  // 选择支付方式并创建支付
  const handleSelectChannel = async (channel: PaymentChannel) => {
    setSelectedChannel(channel);
    setLoading(true);

    try {
      const result = await api.createPayment(orderId, channel);
      setPaymentNo(result.paymentNo);
      setQrCode(result.qrCode || '');
      setPayUrl(result.payUrl || '');
      setStep('paying');

      // 开始轮询支付状态
      startPolling(result.paymentNo);
    } catch (err: any) {
      showToast(err.message || '创建支付失败');
    } finally {
      setLoading(false);
    }
  };

  // 轮询支付状态
  const startPolling = (paymentNo: string) => {
    const poll = async () => {
      try {
        const result = await api.queryPaymentStatus(paymentNo);

        if (result.status === 'success') {
          setStep('success');
          showToast('支付成功！');
          setTimeout(onSuccess, 2000);
          return;
        }

        if (result.status === 'failed' || result.status === 'closed') {
          setStep('failed');
          return;
        }

        // 继续轮询
        setTimeout(poll, 2000);
      } catch (err) {
        console.error('查询支付状态失败:', err);
        setTimeout(poll, 2000);
      }
    };

    poll();
  };

  // 选择支付方式页面
  if (step === 'select') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
          <div className="flex justify-between items-center p-4 border-b border-gray-100">
            <h3 className="font-bold text-lg">选择支付方式</h3>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-700">
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <p className="text-gray-500 text-sm">订单号：{orderNumber}</p>
              <p className="text-3xl font-bold text-red-600 mt-2">¥ {amount.toFixed(2)}</p>
            </div>

            {channels.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无可用支付方式</p>
                <p className="text-xs mt-2">请联系管理员配置支付</p>
              </div>
            ) : (
              <div className="space-y-3">
                {channels.map((channel) => (
                  <button
                    key={channel.channel}
                    onClick={() => handleSelectChannel(channel.channel)}
                    disabled={loading}
                    className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all disabled:opacity-50"
                  >
                    {channel.channel === 'alipay' ? (
                      <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                        支付宝
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                        微信
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <div className="font-bold">{channel.channelName}</div>
                      <div className="text-xs text-gray-400">安全快捷支付</div>
                    </div>
                    {loading && selectedChannel === channel.channel && (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50 text-center text-xs text-gray-400">
            支付安全由平台保障
          </div>
        </div>
      </div>
    );
  }

  // 支付中页面
  if (step === 'paying') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
          <div className="flex items-center gap-2 p-4 border-b border-gray-100">
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-lg">
              {selectedChannel === 'alipay' ? '支付宝支付' : '微信支付'}
            </h3>
          </div>

          <div className="p-6 text-center">
            <p className="text-gray-500 text-sm mb-4">订单号：{orderNumber}</p>
            <p className="text-3xl font-bold text-red-600 mb-6">¥ {amount.toFixed(2)}</p>

            {qrCode && (
              <div className="mb-6">
                <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mt-3">请使用{selectedChannel === 'alipay' ? '支付宝' : '微信'}扫码支付</p>
              </div>
            )}

            {payUrl && (
              <a
                href={payUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mb-4"
              >
                <Smartphone className="w-5 h-5" />
                跳转支付
              </a>
            )}

            <div className="flex items-center justify-center gap-2 text-blue-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">等待支付中...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 支付成功页面
  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
          <div className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">支付成功</h3>
            <p className="text-gray-500">订单已支付，请等待卖家发货</p>
          </div>
        </div>
      </div>
    );
  }

  // 支付失败页面
  if (step === 'failed') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
          <div className="p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">支付失败</h3>
            <p className="text-gray-500 mb-6">支付遇到问题，请重试</p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => setStep('select')}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                重新支付
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
