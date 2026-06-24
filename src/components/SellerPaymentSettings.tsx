import React, { useState, useEffect } from 'react';
import { X, Save, Smartphone, CreditCard, Building2, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import type { UserProfile } from '../types/settlement';

interface SellerPaymentSettingsProps {
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const SellerPaymentSettings: React.FC<SellerPaymentSettingsProps> = ({ onClose, showToast }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [alipayAccount, setAlipayAccount] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const result = await api.getMyProfile();
      setProfile(result);
      setAlipayAccount(result.alipayAccount || '');
    } catch (err: any) {
      showToast(err.message || '加载用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!alipayAccount.trim()) {
      showToast('请输入支付宝账号');
      return;
    }

    setSaving(true);
    try {
      await api.updatePaymentAccount({ alipayAccount: alipayAccount.trim() });
      showToast('收款账号保存成功');
      await loadProfile();
    } catch (err: any) {
      showToast(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95">
        {/* 头部 */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            收款账号设置
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* 微信账号 - 暂未开通 */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 opacity-60">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-400 rounded-xl flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-1">微信账号</h4>
                <p className="text-sm text-gray-500 mb-3">功能开发中，敬请期待</p>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 text-gray-500">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-sm">微信登录功能暂未开通</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 支付宝账号 */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-1">支付宝账号</h4>
                <p className="text-sm text-gray-500 mb-3">用于支付宝企业付款收款</p>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-700 mb-1">
                    支付宝账号
                  </label>
                  <input
                    type="text"
                    placeholder="请输入支付宝账号（手机号或邮箱）"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={alipayAccount}
                    onChange={(e) => setAlipayAccount(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 银行账户 */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-1">银行账户</h4>
                <p className="text-sm text-gray-500 mb-3">从企业认证信息获取，用于银行转账结算</p>
                <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">开户银行</span>
                    <span className="font-medium text-gray-900">
                      {profile?.bankName || '未设置'}
                    </span>
                  </div>
                  <div className="border-t border-gray-100"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">银行账号</span>
                    <span className="font-mono font-medium text-gray-900">
                      {profile?.bankAccount || '未设置'}
                    </span>
                  </div>
                  <div className="border-t border-gray-100"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">账户名称</span>
                    <span className="font-medium text-gray-900">
                      {profile?.bankAccountName || '未设置'}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-2 text-xs text-gray-500">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>银行账户信息来自企业认证，如需修改请联系管理员</span>
                </div>
              </div>
            </div>
          </div>

          {/* 说明 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
            <h4 className="font-bold text-yellow-800 mb-2">收款说明</h4>
            <ul className="space-y-1 text-yellow-700 text-xs">
              <li>1. 买家确认收货后，系统会自动将货款结算至您的收款账户</li>
              <li>2. 支付宝账号可随时修改，建议填写常用账号</li>
              <li>3. 银行账户信息来自企业认证，如需修改请联系管理员</li>
              <li>4. 微信收款功能开发中，敬请期待</li>
            </ul>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存设置
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellerPaymentSettings;
