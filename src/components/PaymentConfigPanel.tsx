import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, XCircle, AlertTriangle, Eye, EyeOff, RefreshCw, TestTube } from 'lucide-react';
import { api } from '../api/client';

interface PaymentConfigProps {
  showToast: (msg: string) => void;
}

interface PaymentConfig {
  channel: 'alipay' | 'wechat';
  channelName: string;
  enabled: boolean;
  configured: boolean;
  sandboxMode: boolean;
  // 支付宝配置
  alipayAppId?: string;
  alipayAppIdConfigured: boolean;
  alipayPrivateKeyConfigured: boolean;
  alipayPublicKeyConfigured: boolean;
  alipayNotifyUrl?: string;
  alipayReturnUrl?: string;
  // 微信配置
  wechatAppId?: string;
  wechatAppIdConfigured: boolean;
  wechatMchId?: string;
  wechatMchIdConfigured: boolean;
  wechatApiKeyConfigured: boolean;
  wechatApiV3KeyConfigured: boolean;
  wechatSerialNoConfigured: boolean;
  wechatPrivateKeyConfigured: boolean;
  wechatNotifyUrl?: string;
}

export const PaymentConfigPanel: React.FC<PaymentConfigProps> = ({ showToast }) => {
  const [configs, setConfigs] = useState<PaymentConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [editingChannel, setEditingChannel] = useState<'alipay' | 'wechat' | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // 编辑表单状态
  const [formData, setFormData] = useState<{
    enabled: boolean;
    sandboxMode: boolean;
    alipayAppId: string;
    alipayPrivateKey: string;
    alipayPublicKey: string;
    alipayNotifyUrl: string;
    alipayReturnUrl: string;
    wechatAppId: string;
    wechatMchId: string;
    wechatApiKey: string;
    wechatApiV3Key: string;
    wechatSerialNo: string;
    wechatPrivateKey: string;
    wechatNotifyUrl: string;
  }>({
    enabled: false,
    sandboxMode: true,
    alipayAppId: '',
    alipayPrivateKey: '',
    alipayPublicKey: '',
    alipayNotifyUrl: '',
    alipayReturnUrl: '',
    wechatAppId: '',
    wechatMchId: '',
    wechatApiKey: '',
    wechatApiV3Key: '',
    wechatSerialNo: '',
    wechatPrivateKey: '',
    wechatNotifyUrl: '',
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const result = await api.getPaymentConfigs();
      setConfigs(result);
    } catch (err) {
      showToast('加载支付配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async (channel: 'alipay' | 'wechat') => {
    setTesting(channel);
    try {
      const result = await api.testPaymentConfig(channel);
      showToast(result.message);
    } catch (err: any) {
      showToast(err.message || '测试失败');
    } finally {
      setTesting(null);
    }
  };

  const handleEdit = (config: PaymentConfig) => {
    setEditingChannel(config.channel);
    setFormData({
      enabled: config.enabled,
      sandboxMode: config.sandboxMode,
      alipayAppId: config.alipayAppId || '',
      alipayPrivateKey: '',
      alipayPublicKey: '',
      alipayNotifyUrl: config.alipayNotifyUrl || '',
      alipayReturnUrl: config.alipayReturnUrl || '',
      wechatAppId: config.wechatAppId || '',
      wechatMchId: config.wechatMchId || '',
      wechatApiKey: '',
      wechatApiV3Key: '',
      wechatSerialNo: '',
      wechatPrivateKey: '',
      wechatNotifyUrl: config.wechatNotifyUrl || '',
    });
  };

  const handleSave = async () => {
    if (!editingChannel) return;

    setLoading(true);
    try {
      // 只提交有值的字段
      const data: any = {
        enabled: formData.enabled,
        sandboxMode: formData.sandboxMode,
      };

      if (editingChannel === 'alipay') {
        if (formData.alipayAppId) data.alipayAppId = formData.alipayAppId;
        if (formData.alipayPrivateKey) data.alipayPrivateKey = formData.alipayPrivateKey;
        if (formData.alipayPublicKey) data.alipayPublicKey = formData.alipayPublicKey;
        if (formData.alipayNotifyUrl) data.alipayNotifyUrl = formData.alipayNotifyUrl;
        if (formData.alipayReturnUrl) data.alipayReturnUrl = formData.alipayReturnUrl;
      } else if (editingChannel === 'wechat') {
        if (formData.wechatAppId) data.wechatAppId = formData.wechatAppId;
        if (formData.wechatMchId) data.wechatMchId = formData.wechatMchId;
        if (formData.wechatApiKey) data.wechatApiKey = formData.wechatApiKey;
        if (formData.wechatApiV3Key) data.wechatApiV3Key = formData.wechatApiV3Key;
        if (formData.wechatSerialNo) data.wechatSerialNo = formData.wechatSerialNo;
        if (formData.wechatPrivateKey) data.wechatPrivateKey = formData.wechatPrivateKey;
        if (formData.wechatNotifyUrl) data.wechatNotifyUrl = formData.wechatNotifyUrl;
      }

      await api.updatePaymentConfig(editingChannel, data);
      showToast('配置保存成功');
      setEditingChannel(null);
      loadConfigs();
    } catch (err: any) {
      showToast(err.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const toggleSecret = (field: string) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const getConfigStatus = (config: PaymentConfig) => {
    if (!config.enabled) {
      return { label: '已禁用', color: 'text-gray-500', bg: 'bg-gray-100' };
    }
    if (!config.configured) {
      return { label: '未配置', color: 'text-orange-600', bg: 'bg-orange-50' };
    }
    if (config.sandboxMode) {
      return { label: '沙箱模式', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    }
    return { label: '已启用', color: 'text-green-600', bg: 'bg-green-50' };
  };

  if (loading && configs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 配置列表 */}
      {!editingChannel && (
        <div className="space-y-4">
          {configs.map(config => {
            const status = getConfigStatus(config);
            return (
              <div key={config.channel} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                      config.channel === 'alipay' ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      {config.channel === 'alipay' ? '支付宝' : '微信'}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{config.channelName}</div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTest(config.channel)}
                      disabled={testing === config.channel || !config.configured}
                      className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center gap-1"
                    >
                      {testing === config.channel ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <TestTube className="w-4 h-4" />
                      )}
                      测试连接
                    </button>
                    <button
                      onClick={() => handleEdit(config)}
                      className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      配置
                    </button>
                  </div>
                </div>

                {/* 配置状态详情 */}
                <div className="p-4 bg-gray-50 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {config.channel === 'alipay' ? (
                    <>
                      <div>
                        <span className="text-gray-500">App ID</span>
                        <div className="flex items-center gap-1">
                          {config.alipayAppIdConfigured ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-300" />
                          )}
                          <span className="font-mono">{config.alipayAppId || '未设置'}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">应用私钥</span>
                        <div className="flex items-center gap-1">
                          {config.alipayPrivateKeyConfigured ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-300" />
                          )}
                          <span>{config.alipayPrivateKeyConfigured ? '已配置' : '未设置'}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">支付宝公钥</span>
                        <div className="flex items-center gap-1">
                          {config.alipayPublicKeyConfigured ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-300" />
                          )}
                          <span>{config.alipayPublicKeyConfigured ? '已配置' : '未设置'}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">回调地址</span>
                        <span className="font-mono text-xs truncate block">{config.alipayNotifyUrl || '-'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-gray-500">App ID</span>
                        <div className="flex items-center gap-1">
                          {config.wechatAppIdConfigured ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-300" />
                          )}
                          <span className="font-mono">{config.wechatAppId || '未设置'}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">商户号</span>
                        <div className="flex items-center gap-1">
                          {config.wechatMchIdConfigured ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-300" />
                          )}
                          <span className="font-mono">{config.wechatMchId || '未设置'}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">API密钥</span>
                        <div className="flex items-center gap-1">
                          {config.wechatApiKeyConfigured ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-300" />
                          )}
                          <span>{config.wechatApiKeyConfigured ? '已配置' : '未设置'}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">证书序列号</span>
                        <div className="flex items-center gap-1">
                          {config.wechatSerialNoConfigured ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-300" />
                          )}
                          <span>{config.wechatSerialNoConfigured ? '已配置' : '未设置'}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 编辑表单 */}
      {editingChannel && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
            <h4 className="font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              配置 {editingChannel === 'alipay' ? '支付宝' : '微信支付'}
            </h4>
            <button
              onClick={() => setEditingChannel(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* 基础设置 */}
            <div className="space-y-4">
              <h5 className="font-bold text-gray-700 text-sm uppercase tracking-wide">基础设置</h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">启用状态</label>
                  <select
                    value={formData.enabled ? '1' : '0'}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.value === '1' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="0">禁用</option>
                    <option value="1">启用</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">运行模式</label>
                  <select
                    value={formData.sandboxMode ? 'sandbox' : 'production'}
                    onChange={(e) => setFormData({ ...formData, sandboxMode: e.target.value === 'sandbox' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="sandbox">沙箱模式（测试）</option>
                    <option value="production">生产模式</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 支付宝配置 */}
            {editingChannel === 'alipay' && (
              <div className="space-y-4">
                <h5 className="font-bold text-gray-700 text-sm uppercase tracking-wide">支付宝配置</h5>
                <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>请前往支付宝开放平台获取应用配置。私钥信息加密存储，留空表示不修改。</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">App ID</label>
                    <input
                      type="text"
                      value={formData.alipayAppId}
                      onChange={(e) => setFormData({ ...formData, alipayAppId: e.target.value })}
                      placeholder="支付宝应用AppID"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">应用私钥</label>
                    <div className="relative">
                      <input
                        type={showSecrets['alipayPrivateKey'] ? 'text' : 'password'}
                        value={formData.alipayPrivateKey}
                        onChange={(e) => setFormData({ ...formData, alipayPrivateKey: e.target.value })}
                        placeholder="留空不修改"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecret('alipayPrivateKey')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showSecrets['alipayPrivateKey'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">支付宝公钥</label>
                    <textarea
                      value={formData.alipayPublicKey}
                      onChange={(e) => setFormData({ ...formData, alipayPublicKey: e.target.value })}
                      placeholder="支付宝公钥内容"
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">回调地址</label>
                    <input
                      type="text"
                      value={formData.alipayNotifyUrl}
                      onChange={(e) => setFormData({ ...formData, alipayNotifyUrl: e.target.value })}
                      placeholder="/api/payments/alipay/notify"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">同步跳转地址</label>
                    <input
                      type="text"
                      value={formData.alipayReturnUrl}
                      onChange={(e) => setFormData({ ...formData, alipayReturnUrl: e.target.value })}
                      placeholder="/payment/result"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 微信支付配置 */}
            {editingChannel === 'wechat' && (
              <div className="space-y-4">
                <h5 className="font-bold text-gray-700 text-sm uppercase tracking-wide">微信支付配置</h5>
                <div className="bg-green-50 text-green-800 p-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>请前往微信支付商户平台获取配置。密钥信息加密存储，留空表示不修改。</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">App ID</label>
                    <input
                      type="text"
                      value={formData.wechatAppId}
                      onChange={(e) => setFormData({ ...formData, wechatAppId: e.target.value })}
                      placeholder="微信AppID"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">商户号</label>
                    <input
                      type="text"
                      value={formData.wechatMchId}
                      onChange={(e) => setFormData({ ...formData, wechatMchId: e.target.value })}
                      placeholder="微信支付商户号"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API密钥 (V2)</label>
                    <div className="relative">
                      <input
                        type={showSecrets['wechatApiKey'] ? 'text' : 'password'}
                        value={formData.wechatApiKey}
                        onChange={(e) => setFormData({ ...formData, wechatApiKey: e.target.value })}
                        placeholder="留空不修改"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecret('wechatApiKey')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showSecrets['wechatApiKey'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">APIv3密钥</label>
                    <div className="relative">
                      <input
                        type={showSecrets['wechatApiV3Key'] ? 'text' : 'password'}
                        value={formData.wechatApiV3Key}
                        onChange={(e) => setFormData({ ...formData, wechatApiV3Key: e.target.value })}
                        placeholder="留空不修改"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecret('wechatApiV3Key')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showSecrets['wechatApiV3Key'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">证书序列号</label>
                    <input
                      type="text"
                      value={formData.wechatSerialNo}
                      onChange={(e) => setFormData({ ...formData, wechatSerialNo: e.target.value })}
                      placeholder="商户API证书序列号"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">回调地址</label>
                    <input
                      type="text"
                      value={formData.wechatNotifyUrl}
                      onChange={(e) => setFormData({ ...formData, wechatNotifyUrl: e.target.value })}
                      placeholder="/api/payments/wechat/notify"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">商户私钥</label>
                    <textarea
                      value={formData.wechatPrivateKey}
                      onChange={(e) => setFormData({ ...formData, wechatPrivateKey: e.target.value })}
                      placeholder="商户API私钥内容（留空不修改）"
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => setEditingChannel(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                保存配置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 提示信息 */}
      <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg text-sm flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-bold mb-1">安全提示</p>
          <ul className="list-disc list-inside space-y-1 text-yellow-700">
            <li>所有密钥信息在服务器端加密存储</li>
            <li>生产环境请确保使用 HTTPS 协议</li>
            <li>建议定期轮换 API 密钥</li>
            <li>沙箱模式用于开发测试，不会产生真实交易</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfigPanel;
