import React, { useState, useEffect } from 'react';
import {
  Users, Crown, Star, Award, Plus, Edit2, Trash2, X, Search, Filter, Package, DollarSign, Calendar
} from 'lucide-react';
import { api } from '../api/client';
import { VipBadge } from './VipBadge';

interface CustomerTagManagementProps {
  showToast: (msg: string) => void;
}

export const CustomerTagManagement: React.FC<CustomerTagManagementProps> = ({ showToast }) => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<'all' | 'vip' | 'old_customer' | 'preferred'>('all');

  // 标记客户弹窗
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagForm, setTagForm] = useState({
    buyerSearch: '',
    selectedBuyerId: '',
    tagType: 'old_customer' as 'vip' | 'old_customer' | 'preferred',
    discountRate: '',
    remark: '',
  });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // 编辑折扣弹窗
  const [editDiscountModal, setEditDiscountModal] = useState<any>(null);
  const [newDiscount, setNewDiscount] = useState('');

  // 删除确认
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);

  useEffect(() => {
    loadCustomers();
  }, [page, filterType]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const result = await api.getTaggedCustomers({
        tagType: filterType === 'all' ? undefined : filterType,
        page,
        pageSize: 20,
      });
      setCustomers(result.items);
      setTotal(result.total);
    } catch (err) {
      console.error('加载客户列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 搜索买家（从历史订单客户中搜索）
  const searchBuyers = async (keyword: string) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const orders = await api.getSellerOrders();
      const uniqueBuyers = new Map();
      orders.forEach((order: any) => {
        if (order.buyer && !uniqueBuyers.has(order.buyer.id)) {
          uniqueBuyers.set(order.buyer.id, order.buyer);
        }
      });
      const filtered = Array.from(uniqueBuyers.values()).filter((buyer: any) =>
        buyer.companyName?.toLowerCase().includes(keyword.toLowerCase())
      );
      setSearchResults(filtered);
    } catch (err) {
      console.error('搜索买家失败:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleTagCustomer = async () => {
    if (!tagForm.selectedBuyerId) {
      showToast('请选择要标记的客户');
      return;
    }
    try {
      await api.tagCustomer({
        buyerId: tagForm.selectedBuyerId,
        tagType: tagForm.tagType,
        discountRate: tagForm.discountRate ? Number(tagForm.discountRate) : undefined,
        remark: tagForm.remark || undefined,
      });
      showToast('客户标记成功');
      setShowTagModal(false);
      setTagForm({
        buyerSearch: '',
        selectedBuyerId: '',
        tagType: 'old_customer',
        discountRate: '',
        remark: '',
      });
      loadCustomers();
    } catch (err: any) {
      showToast(err.message || '标记失败');
    }
  };

  const handleUpdateDiscount = async () => {
    if (!editDiscountModal || !newDiscount) return;
    try {
      await api.updateCustomerDiscount(editDiscountModal.buyerId, Number(newDiscount));
      showToast('折扣率已更新');
      setEditDiscountModal(null);
      loadCustomers();
    } catch (err: any) {
      showToast(err.message || '更新失败');
    }
  };

  const handleUntagCustomer = async () => {
    if (!deleteConfirm) return;
    try {
      await api.untagCustomer(deleteConfirm.buyerId);
      showToast('已取消客户标记');
      setDeleteConfirm(null);
      loadCustomers();
    } catch (err: any) {
      showToast(err.message || '取消失败');
    }
  };

  const tagTypeLabels = {
    vip: { label: 'VIP客户', icon: Crown, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    old_customer: { label: '老客户', icon: Star, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    preferred: { label: '优选客户', icon: Award, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  };

  return (
    <div className="space-y-6">
      {/* 头部操作栏 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">老客户管理</h2>
          <p className="text-sm text-gray-400 mt-1">共 {total} 位标记客户</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="appearance-none bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 pr-10 text-sm font-medium"
            >
              <option value="all">全部类型</option>
              <option value="vip">VIP客户</option>
              <option value="old_customer">老客户</option>
              <option value="preferred">优选客户</option>
            </select>
            <Filter className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <button
            onClick={() => setShowTagModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-sm shadow-lg"
          >
            <Plus className="w-4 h-4" />
            标记客户
          </button>
        </div>
      </div>

      {/* 客户列表 */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">暂无标记客户</p>
            <p className="text-sm text-gray-500 mt-1">点击"标记客户"添加您的老客户</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {customers.map((customer) => {
              const config = tagTypeLabels[customer.tagType];
              const Icon = config.icon;
              return (
                <div key={customer.id} className="p-4 hover:bg-gray-700/30 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{customer.buyer?.companyName}</span>
                          <VipBadge tagType={customer.tagType} discountRate={customer.discountRate} size="small" />
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {customer.totalOrders} 笔订单
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ¥{customer.totalAmount?.toLocaleString() || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {customer.taggedAt ? new Date(customer.taggedAt).toLocaleDateString() : '-'}
                          </span>
                        </div>
                        {customer.remark && (
                          <p className="text-xs text-gray-500 mt-1">{customer.remark}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {customer.discountRate && (
                        <button
                          onClick={() => {
                            setEditDiscountModal(customer);
                            setNewDiscount(String(customer.discountRate));
                          }}
                          className="px-3 py-1.5 text-sm text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          修改折扣
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteConfirm(customer)}
                        className="px-3 py-1.5 text-sm text-red-400 hover:bg-red-900/30 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        取消标记
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 分页 */}
        {total > 20 && (
          <div className="flex justify-center items-center gap-2 p-4 border-t border-gray-700">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span className="text-sm text-gray-400">
              第 {page} 页 / 共 {Math.ceil(total / 20)} 页
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * 20 >= total}
              className="px-3 py-1.5 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        )}
      </div>

      {/* 标记客户弹窗 */}
      {showTagModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-700">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                标记老客户
              </h3>
              <button onClick={() => setShowTagModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* 搜索客户 */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
                  搜索客户（从历史订单客户中选择）
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="输入公司名称搜索..."
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={tagForm.buyerSearch}
                    onChange={(e) => {
                      setTagForm({ ...tagForm, buyerSearch: e.target.value });
                      searchBuyers(e.target.value);
                    }}
                  />
                </div>
                {searching && (
                  <p className="text-xs text-gray-500 mt-2">搜索中...</p>
                )}
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-gray-700 rounded-lg border border-gray-600 max-h-40 overflow-y-auto">
                    {searchResults.map((buyer: any) => (
                      <button
                        key={buyer.id}
                        onClick={() => {
                          setTagForm({
                            ...tagForm,
                            selectedBuyerId: buyer.id,
                            buyerSearch: buyer.companyName,
                          });
                          setSearchResults([]);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-600 transition-colors text-sm ${
                          tagForm.selectedBuyerId === buyer.id ? 'bg-blue-600/30 text-blue-300' : 'text-gray-300'
                        }`}
                      >
                        {buyer.companyName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 标签类型 */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
                  标签类型
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(tagTypeLabels).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => setTagForm({ ...tagForm, tagType: key as any })}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                          tagForm.tagType === key
                            ? 'border-blue-500 bg-blue-600/20 text-blue-400'
                            : 'border-gray-600 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-bold">{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 折扣率 */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
                  专属折扣率（可选）
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="9.9"
                    placeholder="例如：9.5 表示9.5折"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={tagForm.discountRate}
                    onChange={(e) => setTagForm({ ...tagForm, discountRate: e.target.value })}
                  />
                  <span className="absolute right-4 top-3 text-gray-500 text-sm">折</span>
                </div>
              </div>

              {/* 备注 */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
                  备注（可选）
                </label>
                <textarea
                  placeholder="添加备注信息..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows={2}
                  value={tagForm.remark}
                  onChange={(e) => setTagForm({ ...tagForm, remark: e.target.value })}
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => setShowTagModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-bold"
              >
                取消
              </button>
              <button
                onClick={handleTagCustomer}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold"
              >
                确认标记
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑折扣弹窗 */}
      {editDiscountModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-700">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="font-bold text-lg text-white">修改专属折扣</h3>
              <button onClick={() => setEditDiscountModal(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-400 mb-4">
                客户：{editDiscountModal.buyer?.companyName}
              </p>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="9.9"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newDiscount}
                  onChange={(e) => setNewDiscount(e.target.value)}
                />
                <span className="absolute right-4 top-3 text-gray-500 text-sm">折</span>
              </div>
            </div>
            <div className="p-4 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => setEditDiscountModal(null)}
                className="flex-1 px-4 py-2.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-bold"
              >
                取消
              </button>
              <button
                onClick={handleUpdateDiscount}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-700">
            <div className="p-6 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-900/50 flex items-center justify-center">
                <Trash2 className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">确认取消标记</h3>
              <p className="text-sm text-gray-400">
                您将取消对 <span className="text-white font-bold">{deleteConfirm.buyer?.companyName}</span> 的老客户标记。
                取消后该客户将不再享受专属折扣。
              </p>
            </div>
            <div className="p-4 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-bold"
              >
                取消
              </button>
              <button
                onClick={handleUntagCustomer}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold"
              >
                确认取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerTagManagement;
