import React, { useState, useEffect } from 'react';
import {
  Package, Plus, Trash2, Edit2, Eye, Clock, CheckCircle,
  X, AlertTriangle, TrendingDown, PackageOpen
} from 'lucide-react';
import { api } from '../api/client';

interface PackageManagementProps {
  showToast: (msg: string) => void;
}

export const PackageManagement: React.FC<PackageManagementProps> = ({ showToast }) => {
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // 弹窗状态
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<any>(null);
  const [showAddItemModal, setShowAddItemModal] = useState<any>(null);
  const [showPriceModal, setShowPriceModal] = useState<any>(null);

  // 表单
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [priceForm, setPriceForm] = useState({ packagePrice: '', expiresAt: '' });

  // 我的库存列表（用于添加到包）
  const [myInventory, setMyInventory] = useState<any[]>([]);
  const [addItemForm, setAddItemForm] = useState({ inventoryId: '', quantity: '' });

  useEffect(() => {
    loadPackages();
  }, [page]);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const result = await api.getPackages({ page, pageSize: 20 });
      setPackages(result.items);
      setTotal(result.total);
    } catch (err) {
      console.error('加载库存包失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMyInventory = async () => {
    try {
      const result = await api.getSellerInventory();
      setMyInventory(result);
    } catch (err) {
      console.error('加载库存失败:', err);
    }
  };

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      showToast('请输入包名称');
      return;
    }
    try {
      await api.createPackage(createForm);
      showToast('创建成功');
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '' });
      loadPackages();
    } catch (err: any) {
      showToast(err.message || '创建失败');
    }
  };

  const handleAddItem = async () => {
    if (!showAddItemModal || !addItemForm.inventoryId || !addItemForm.quantity) {
      showToast('请选择物料并输入数量');
      return;
    }
    try {
      await api.addPackageItem(showAddItemModal.id, {
        inventoryId: addItemForm.inventoryId,
        quantity: parseInt(addItemForm.quantity),
      });
      showToast('添加成功');
      setShowAddItemModal(null);
      setAddItemForm({ inventoryId: '', quantity: '' });
      loadPackages();
    } catch (err: any) {
      showToast(err.message || '添加失败');
    }
  };

  const handleRemoveItem = async (packageId: string, itemId: string) => {
    try {
      await api.removePackageItem(packageId, itemId);
      showToast('移除成功');
      loadPackages();
    } catch (err: any) {
      showToast(err.message || '移除失败');
    }
  };

  const handleUpdatePrice = async () => {
    if (!showPriceModal || !priceForm.packagePrice) {
      showToast('请输入打包价格');
      return;
    }
    try {
      await api.updatePackage(showPriceModal.id, {
        packagePrice: parseFloat(priceForm.packagePrice),
        expiresAt: priceForm.expiresAt || undefined,
      });
      showToast('价格设置成功');
      setShowPriceModal(null);
      loadPackages();
    } catch (err: any) {
      showToast(err.message || '设置失败');
    }
  };

  const handlePublish = async (pkg: any) => {
    if (!pkg.packagePrice || pkg.packagePrice <= 0) {
      showToast('请先设置打包价格');
      return;
    }
    try {
      await api.publishPackage(pkg.id);
      showToast('发布成功');
      loadPackages();
    } catch (err: any) {
      showToast(err.message || '发布失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个库存包吗？')) return;
    try {
      await api.deletePackage(id);
      showToast('删除成功');
      loadPackages();
    } catch (err: any) {
      showToast(err.message || '删除失败');
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; class: string; icon: any }> = {
      draft: { label: '草稿', class: 'bg-gray-100 text-gray-600', icon: Edit2 },
      active: { label: '已发布', class: 'bg-green-100 text-green-600', icon: CheckCircle },
      sold: { label: '已售出', class: 'bg-blue-100 text-blue-600', icon: Package },
      expired: { label: '已过期', class: 'bg-red-100 text-red-600', icon: Clock },
    };
    const c = config[status] || config.draft;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${c.class}`}>
        <Icon className="w-3 h-3" />
        {c.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">打包出售管理</h3>
          <p className="text-sm text-gray-400 mt-1">共 {total} 个库存包</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          创建库存包
        </button>
      </div>

      {/* 包列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
          <PackageOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">暂无库存包</p>
          <p className="text-sm text-gray-500 mt-1">点击"创建库存包"开始打包出售</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white">{pkg.name}</h4>
                    {pkg.description && (
                      <p className="text-sm text-gray-400 mt-1">{pkg.description}</p>
                    )}
                  </div>
                  {getStatusBadge(pkg.status)}
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-gray-500">物料数量</div>
                    <div className="font-mono font-bold text-white">{pkg.totalItems || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">原价总值</div>
                    <div className="font-mono font-bold text-gray-400 line-through">¥{(pkg.totalValue || 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">打包价</div>
                    <div className="font-mono font-bold text-green-400">¥{(pkg.packagePrice || 0).toLocaleString()}</div>
                  </div>
                </div>

                {pkg.packagePrice > 0 && pkg.totalValue > 0 && (
                  <div className="flex items-center justify-center gap-1 text-sm text-green-400 bg-green-900/20 py-1.5 rounded">
                    <TrendingDown className="w-4 h-4" />
                    <span>折扣 {Math.round((pkg.packagePrice / pkg.totalValue) * 100)}%</span>
                  </div>
                )}

                {/* 物料预览 */}
                {pkg.items && pkg.items.length > 0 && (
                  <div className="bg-gray-900/50 rounded-lg p-2">
                    <div className="text-xs text-gray-500 mb-2">包内物料：</div>
                    <div className="space-y-1">
                      {pkg.items.slice(0, 3).map((item: any) => (
                        <div key={item.id} className="flex justify-between text-xs">
                          <span className="font-mono text-gray-300">{item.partNumber}</span>
                          <span className="text-gray-500">×{item.quantity}</span>
                        </div>
                      ))}
                      {pkg.items.length > 3 && (
                        <div className="text-xs text-gray-500">+{pkg.items.length - 3} 更多</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-700 flex flex-wrap gap-2">
                <button
                  onClick={() => setShowDetailModal(pkg)}
                  className="flex-1 px-3 py-1.5 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 flex items-center justify-center gap-1"
                >
                  <Eye className="w-3 h-3" /> 详情
                </button>
                {pkg.status === 'draft' && (
                  <>
                    <button
                      onClick={() => {
                        loadMyInventory();
                        setShowAddItemModal(pkg);
                      }}
                      className="flex-1 px-3 py-1.5 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> 添加
                    </button>
                    <button
                      onClick={() => {
                        setPriceForm({ packagePrice: String(pkg.packagePrice || ''), expiresAt: '' });
                        setShowPriceModal(pkg);
                      }}
                      className="flex-1 px-3 py-1.5 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
                    >
                      定价
                    </button>
                    <button
                      onClick={() => handlePublish(pkg)}
                      className="flex-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      发布
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.id)}
                      className="px-3 py-1.5 text-sm text-red-400 hover:bg-red-900/30 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 创建包弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-bold text-lg">创建库存包</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">包名称 *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="例如：STM32系列打包优惠"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">描述</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="简要描述这个库存包"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
                取消
              </button>
              <button onClick={handleCreate} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 详情弹窗 */}
      {showDetailModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 sticky top-0 bg-white">
              <h3 className="font-bold text-lg">{showDetailModal.name}</h3>
              <button onClick={() => setShowDetailModal(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{showDetailModal.totalItems}</div>
                  <div className="text-xs text-gray-500">物料数量</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-400 line-through">¥{(showDetailModal.totalValue || 0).toLocaleString()}</div>
                  <div className="text-xs text-gray-500">原价总值</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">¥{(showDetailModal.packagePrice || 0).toLocaleString()}</div>
                  <div className="text-xs text-gray-500">打包价</div>
                </div>
              </div>

              <h4 className="font-bold text-gray-700 mb-3">包内物料</h4>
              <div className="space-y-2">
                {showDetailModal.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-mono font-bold text-gray-900">{item.partNumber}</span>
                      <span className="text-sm text-gray-500 ml-2">×{item.quantity}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-gray-700">¥{Number(item.unitPrice).toFixed(2)}/件</div>
                      <div className="text-xs text-gray-400">小计 ¥{Number(item.subtotal).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 添加物料弹窗 */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-bold text-lg">添加物料到包</h3>
              <button onClick={() => setShowAddItemModal(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">选择物料</label>
                <select
                  value={addItemForm.inventoryId}
                  onChange={(e) => setAddItemForm({ ...addItemForm, inventoryId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">请选择...</option>
                  {myInventory.map((inv: any) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.partNumber} (库存: {inv.availableQty})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">数量</label>
                <input
                  type="number"
                  min="1"
                  value={addItemForm.quantity}
                  onChange={(e) => setAddItemForm({ ...addItemForm, quantity: e.target.value })}
                  placeholder="输入数量"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowAddItemModal(null)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
                取消
              </button>
              <button onClick={handleAddItem} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 定价弹窗 */}
      {showPriceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-bold text-lg">设置打包价格</h3>
              <button onClick={() => setShowPriceModal(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">原价总值</span>
                  <span className="font-mono font-bold">¥{(showPriceModal.totalValue || 0).toLocaleString()}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">打包价 *</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">¥</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={priceForm.packagePrice}
                    onChange={(e) => setPriceForm({ ...priceForm, packagePrice: e.target.value })}
                    placeholder="输入打包价格"
                    className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">过期时间（可选）</label>
                <input
                  type="datetime-local"
                  value={priceForm.expiresAt}
                  onChange={(e) => setPriceForm({ ...priceForm, expiresAt: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowPriceModal(null)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
                取消
              </button>
              <button onClick={handleUpdatePrice} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageManagement;
