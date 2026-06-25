import React, { useState } from 'react';
import { getApiUrl } from '../config/api';

interface InvoiceFormData {
  invoiceType: 'normal' | 'special';
  companyName: string;
  taxNumber: string;
  bankName: string;
  bankAccount: string;
  address: string;
  phone: string;
  contactPerson: string;
  contactPhone: string;
}

export const InvoiceForm: React.FC = () => {
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceType: 'normal',
    companyName: '',
    taxNumber: '',
    bankName: '',
    bankAccount: '',
    address: '',
    phone: '',
    contactPerson: '',
    contactPhone: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('invoices/info'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('保存失败');
      }

      setMessage({ type: 'success', text: '开票资料保存成功！' });
    } catch (error) {
      setMessage({ type: 'error', text: '保存失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-6 text-gray-800">开票资料设置</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 发票类型 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            发票类型
          </label>
          <select
            name="invoiceType"
            value={formData.invoiceType}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="normal">普通发票</option>
            <option value="special">增值税专用发票</option>
          </select>
        </div>

        {/* 企业信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              企业名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              placeholder="与营业执照一致"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              纳税人识别号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="taxNumber"
              value={formData.taxNumber}
              onChange={handleChange}
              required
              placeholder="18位税号"
              maxLength={18}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* 专票附加信息 */}
        {formData.invoiceType === 'special' && (
          <>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-700">
                ⚠️ 增值税专用发票需要提供完整的企业开票信息
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  开户银行 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  required={formData.invoiceType === 'special'}
                  placeholder="企业开户银行"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  银行账号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="bankAccount"
                  value={formData.bankAccount}
                  onChange={handleChange}
                  required={formData.invoiceType === 'special'}
                  placeholder="企业银行账号"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  注册地址 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required={formData.invoiceType === 'special'}
                  placeholder="营业执照注册地址"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  注册电话 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required={formData.invoiceType === 'special'}
                  placeholder="企业注册电话"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </>
        )}

        {/* 联系人信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              发票接收人
            </label>
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              placeholder="接收发票的联系人"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              联系电话
            </label>
            <input
              type="text"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              placeholder="用于发票寄送联系"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500">
            * 标记为必填项
          </p>
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? '保存中...' : '保存开票资料'}
          </button>
        </div>

        {/* 消息提示 */}
        {message && (
          <div
            className={`p-4 rounded-md ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
};

export default InvoiceForm;
