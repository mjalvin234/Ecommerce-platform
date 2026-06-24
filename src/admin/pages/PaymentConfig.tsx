/**
 * 支付配置页面 - 现代化改造版
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  TestTube,
  X,
  Settings,
} from 'lucide-react';
import { api } from '../../api/client';
import { KPICard } from '../../components/admin-ui';

// ═══════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════

interface PaymentConfig {
  channel: 'alipay' | 'wechat';
  channelName: string;
  enabled: boolean;
  configured: boolean;
  sandboxMode: boolean;
  alipayAppId?: string;
  alipayAppIdConfigured: boolean;
  alipayPrivateKeyConfigured: boolean;
  alipayPublicKeyConfigured: boolean;
  alipayNotifyUrl?: string;
  alipayReturnUrl?: string;
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

interface PaymentConfigProps {
  showToast: (msg: string) => void;
}

// ═══════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════

export const PaymentConfig: React.FC<PaymentConfigProps> = ({ showToast }) => {
  const [configs, setConfigs] = useState<PaymentConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [editingChannel, setEditingChannel] = useState<'alipay' | 'wechat' | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
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

  // 加载配置
  const loadConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getPaymentConfigs();
      setConfigs(result);
    } catch (err) {
      showToast('加载支付配置失败');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  // 测试配置
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

  // 编辑配置
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

  // 保存配置
  const handleSave = async () => {
    if (!editingChannel) return;
    setLoading(true);
    try {
      await api.updatePaymentConfig(editingChannel, formData);
      showToast('配置已保存');
      setEditingChannel(null);
      loadConfigs();
    } catch (err) {
      showToast('保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 统计
  const stats = {
    total: configs.length,
    enabled: configs.filter((c) => c.enabled).length,
    configured: configs.filter((c) => c.configured).length,
    sandbox: configs.filter((c) => c.sandboxMode).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">支付配置</h1>
          <p className="text-gray-500 mt-1 text-sm">配置支付宝和微信支付参数</p>
        </div>
        <button onClick={loadConfigs} disabled={loading} className="admin-btn admin-btn-secondary">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* KPI 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="支付渠道"
          value={stats.total.toString()}
          icon={<CreditCard className="w-5 h-5" />}
          color="blue"
        />
        <KPICard
          title="已启用"
          value={stats.enabled.toString()}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="green"
        />
        <KPICard
          title="已配置"
          value={stats.configured.toString()}
          icon={<Settings className="w-5 h-5" />}
          color="purple"
        />
        <KPICard
          title="沙箱模式"
          value={stats.sandbox.toString()}
          icon={<TestTube className="w-5 h-5" />}
          color="orange"
        />
      </div>

      {/* 配置列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {configs.map((config) => (
          <motion.div
            key={config.channel}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    config.channel === 'alipay' ? 'bg-blue-100' : 'bg-green-100'
                  }`}
                >
                  <CreditCard
                    className={`w-5 h-5 ${config.channel === 'alipay' ? 'text-blue-600' : 'text-green-600'}`}
                  />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{config.channelName}</div>
                  <div className="text-xs text-gray-500">{config.sandboxMode ? '沙箱模式' : '生产模式'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {config.enabled ? (
                  <span className="admin-badge admin-badge-success">已启用</span>
                ) : (
                  <span className="admin-badge admin-badge-neutral">已禁用</span>
                )}
              </div>
            </div>

            {/* 配置状态 */}
            <div className="p-4 space-y-3">
              {config.channel === 'alipay' && (
                <>
                  <ConfigStatus label="App ID" configured={config.alipayAppIdConfigured} />
                  <ConfigStatus label="私钥" configured={config.alipayPrivateKeyConfigured} />
                  <ConfigStatus label="公钥" configured={config.alipayPublicKeyConfigured} />
                </>
              )}
              {config.channel === 'wechat' && (
                <>
                  <ConfigStatus label="App ID" configured={config.wechatAppIdConfigured} />
                  <ConfigStatus label="商户号" configured={config.wechatMchIdConfigured} />
                  <ConfigStatus label="API密钥" configured={config.wechatApiKeyConfigured} />
                  <ConfigStatus label="APIv3密钥" configured={config.wechatApiV3KeyConfigured} />
                </>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 p-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => handleEdit(config)}
                className="admin-btn admin-btn-secondary flex-1"
              >
                <Settings className="w-4 h-4" />
                配置
              </button>
              <button
                onClick={() => handleTest(config.channel)}
                disabled={testing === config.channel || !config.configured}
                className="admin-btn admin-btn-primary flex-1"
              >
                {testing === config.channel ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4" />
                )}
                测试
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 编辑弹窗 */}
      <AnimatePresence>
        {editingChannel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setEditingChannel(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
                <h3 className="text-lg font-semibold text-gray-900">
                  配置 {editingChannel === 'alipay' ? '支付宝' : '微信支付'}
                </h3>
                <button
                  onClick={() => setEditingChannel(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* 开关 */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-700">启用此渠道</span>
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl">
                  <span className="font-medium text-gray-700">沙箱模式</span>
                  <input
                    type="checkbox"
                    checked={formData.sandboxMode}
                    onChange={(e) => setFormData({ ...formData, sandboxMode: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                {editingChannel === 'alipay' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">App ID</label>
                      <input
                        type="text"
                        value={formData.alipayAppId}
                        onChange={(e) => setFormData({ ...formData, alipayAppId: e.target.value })}
                        className="admin-input"
                        placeholder="支付宝应用ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">应用私钥</label>
                      <textarea
                        value={formData.alipayPrivateKey}
                        onChange={(e) => setFormData({ ...formData, alipayPrivateKey: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={3}
                        placeholder="应用私钥内容"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">支付宝公钥</label>
                      <textarea
                        value={formData.alipayPublicKey}
                        onChange={(e) => setFormData({ ...formData, alipayPublicKey: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={3}
                        placeholder="支付宝公钥内容"
                      />
                    </div>
                  </>
                )}

                {editingChannel === 'wechat' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">App ID</label>
                        <input
                          type="text"
                          value={formData.wechatAppId}
                          onChange={(e) => setFormData({ ...formData, wechatAppId: e.target.value })}
                          className="admin-input"
                          placeholder="微信AppID"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">商户号</label>
                        <input
                          type="text"
                          value={formData.wechatMchId}
                          onChange={(e) => setFormData({ ...formData, wechatMchId: e.target.value })}
                          className="admin-input"
                          placeholder="商户号"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">API密钥</label>
                      <input
                        type="password"
                        value={formData.wechatApiKey}
                        onChange={(e) => setFormData({ ...formData, wechatApiKey: e.target.value })}
                        className="admin-input"
                        placeholder="API密钥"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">APIv3密钥</label>
                      <input
                        type="password"
                        value={formData.wechatApiV3Key}
                        onChange={(e) => setFormData({ ...formData, wechatApiV3Key: e.target.value })}
                        className="admin-input"
                        placeholder="APIv3密钥"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                <button onClick={() => setEditingChannel(null)} className="admin-btn admin-btn-secondary">
                  取消
                </button>
                <button onClick={handleSave} disabled={loading} className="admin-btn admin-btn-primary">
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  保存配置
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 配置状态组件
// ═══════════════════════════════════════════════════════════════

const ConfigStatus: React.FC<{ label: string; configured: boolean }> = ({ label, configured }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-600">{label}</span>
    {configured ? (
      <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
        <CheckCircle2 className="w-4 h-4" />
        已配置
      </span>
    ) : (
      <span className="flex items-center gap-1 text-sm text-red-500 font-medium">
        <XCircle className="w-4 h-4" />
        未配置
      </span>
    )}
  </div>
);

export default PaymentConfig;
