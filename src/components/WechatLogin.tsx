import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { QrCode, Smartphone, CheckCircle, Loader2, Link2, Unlink } from 'lucide-react';

export function WechatLogin() {
  const [qrcode, setQrcode] = useState<{ scene: string; qrcodeUrl: string; expiresAt: string } | null>(null);
  const [status, setStatus] = useState<string>('pending');
  const [loading, setLoading] = useState(true);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadQrcode();
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  const loadQrcode = async () => {
    setLoading(true);
    try {
      const result = await api.getWechatQrcode();
      setQrcode(result);
      setStatus('pending');
      // 开始轮询检查登录状态
      startPolling(result.scene);
    } catch (err) {
      console.error('获取二维码失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (scene: string) => {
    if (pollInterval) clearInterval(pollInterval);

    const interval = setInterval(async () => {
      try {
        const result = await api.checkWechatLoginStatus(scene);
        setStatus(result.status);

        if (result.status === 'confirmed' && result.token) {
          clearInterval(interval);
          // 登录成功，保存token并跳转
          localStorage.setItem('token', result.token);
          window.location.reload();
        }

        if (result.status === 'expired') {
          clearInterval(interval);
          loadQrcode();
        }
      } catch (err) {
        console.error('检查状态失败:', err);
      }
    }, 2000);

    setPollInterval(interval);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <Smartphone className="w-12 h-12 text-green-600 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-gray-900">微信扫码登录</h3>
        <p className="text-sm text-gray-500 mt-2">使用微信扫描下方二维码</p>
      </div>

      {qrcode && (
        <div className="flex flex-col items-center">
          <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <QrCode className="w-48 h-48 text-gray-800" />
          </div>

          <div className="text-sm text-gray-500 mb-4">
            二维码有效期：5分钟
          </div>

          {/* 状态指示 */}
          <div className="flex items-center gap-2">
            {status === 'pending' && (
              <span className="text-gray-500">等待扫码...</span>
            )}
            {status === 'scanned' && (
              <span className="text-blue-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                已扫码，请在手机确认登录
              </span>
            )}
            {status === 'confirmed' && (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                登录成功，正在跳转...
              </span>
            )}
            {status === 'expired' && (
              <button
                onClick={loadQrcode}
                className="text-blue-600 underline"
              >
                二维码已过期，点击刷新
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
        <p>首次扫码将自动创建账号</p>
      </div>
    </div>
  );
}

// 账号绑定组件
export function WechatBinding() {
  const [binding, setBinding] = useState<{ openid: string; nickname?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBinding();
  }, []);

  const loadBinding = async () => {
    setLoading(true);
    try {
      const result = await api.getBinding();
      setBinding(result);
    } catch {
      // 未绑定
    } finally {
      setLoading(false);
    }
  };

  const handleBind = async () => {
    try {
      // 实际应跳转到微信授权页面
      const mockCode = 'mock_code_' + Date.now();
      await api.bindWechat(mockCode);
      loadBinding();
      alert('绑定成功');
    } catch (err: any) {
      alert(err.message || '绑定失败');
    }
  };

  const handleUnbind = async () => {
    if (!confirm('确定要解绑微信吗？解绑后将无法使用微信登录。')) return;

    try {
      await api.unbindWechat();
      setBinding(null);
      alert('解绑成功');
    } catch (err: any) {
      alert(err.message || '解绑失败');
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">微信账号</div>
            {binding ? (
              <div className="text-sm text-gray-500">已绑定</div>
            ) : (
              <div className="text-sm text-gray-400">未绑定</div>
            )}
          </div>
        </div>

        {binding ? (
          <button
            onClick={handleUnbind}
            className="flex items-center gap-1 text-red-600 hover:text-red-700"
          >
            <Unlink className="w-4 h-4" />
            解绑
          </button>
        ) : (
          <button
            onClick={handleBind}
            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Link2 className="w-4 h-4" />
            绑定微信
          </button>
        )}
      </div>
    </div>
  );
}
