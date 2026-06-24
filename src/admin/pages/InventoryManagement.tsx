/**
 * 库存管理页面 - 现代化改造版
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Warehouse,
  RefreshCw,
  Search,
  Eye,
  Trash2,
  Plus,
  Edit,
  X,
  AlertTriangle,
  Building2,
  Package,
  Layers,
} from 'lucide-react';
import { api } from '../../api/client';
import { DataTable, Column, KPICard } from '../../components/admin-ui';

// ═══════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════

interface Inventory {
  id: string;
  partNumber: string;
  brand?: string;
  quantity: number;
  price: number;
  package?: string;
  year?: string;
  description?: string;
  sellerId?: string;
  seller?: { companyName?: string };
  sellerCompanyName?: string;
  createdAt: string;
}

interface InventoryManagementProps {
  showToast: (msg: string) => void;
}

// ═══════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════

export const InventoryManagement: React.FC<InventoryManagementProps> = ({ showToast }) => {
  const [loading, setLoading] = useState(true);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [modalType, setModalType] = useState<'detail' | 'edit' | 'create' | 'delete' | null>(null);
  const [editForm, setEditForm] = useState({
    partNumber: '',
    brand: '',
    quantity: 0,
    price: 0,
    package: '',
    year: '',
    description: '',
  });

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = (await api.searchInventory('', 1, 100)) as any;
      setInventories(result.items || result.inventories || []);
      setTotal(result.total || 0);
    } catch (err) {
      console.error('加载库存失败:', err);
      showToast('加载库存失败');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 格式化金额
  const formatMoney = useCallback((amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  // 打开弹窗
  const openModal = (type: 'detail' | 'edit' | 'create' | 'delete', item?: Inventory) => {
    if (item) setSelectedItem(item);
    else setSelectedItem(null);

    if (type === 'edit' && item) {
      setEditForm({
        partNumber: item.partNumber || '',
        brand: item.brand || '',
        quantity: item.quantity || 0,
        price: item.price || 0,
        package: item.package || '',
        year: item.year || '',
        description: item.description || '',
      });
    } else if (type === 'create') {
      setEditForm({
        partNumber: '',
        brand: '',
        quantity: 0,
        price: 0,
        package: '',
        year: '',
        description: '',
      });
    }
    setModalType(type);
  };

  // 关闭弹窗
  const closeModal = () => {
    setSelectedItem(null);
    setModalType(null);
  };

  // 保存
  const handleSave = async () => {
    if (!editForm.partNumber.trim()) {
      showToast('请填写型号');
      return;
    }
    if (editForm.quantity <= 0 || editForm.price <= 0) {
      showToast('数量和单价必须大于0');
      return;
    }

    try {
      if (selectedItem) {
        await api.updateInventory(selectedItem.id, {
          partNumber: editForm.partNumber,
          quantity: editForm.quantity,
          price: editForm.price,
          year: editForm.year,
        });
        showToast('库存已更新');
      } else {
        await api.createInventory({
          partNumber: editForm.partNumber,
          quantity: editForm.quantity,
          price: editForm.price,
          year: editForm.year,
        });
        showToast('库存已添加');
      }
      closeModal();
      loadData();
    } catch (err) {
      showToast('操作失败');
    }
  };

  // 删除
  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await api.deleteInventory(selectedItem.id);
      showToast('库存已删除');
      closeModal();
      loadData();
    } catch (err) {
      showToast('删除失败');
    }
  };

  // 筛选
  const filteredItems = search
    ? inventories.filter(
        (i) =>
          i.partNumber?.toLowerCase().includes(search.toLowerCase()) ||
          i.brand?.toLowerCase().includes(search.toLowerCase()) ||
          i.seller?.companyName?.toLowerCase().includes(search.toLowerCase())
      )
    : inventories;

  // 统计
  const stats = {
    total: total,
    sellers: new Set(inventories.map((i) => i.sellerId || i.seller?.id)).size,
    models: inventories.length,
    totalQuantity: inventories.reduce((sum, i) => sum + (i.quantity || 0), 0),
  };

  // 表格列定义
  const columns: Column<Inventory>[] = [
    {
      key: 'partNumber',
      title: '型号',
      render: (_, item) => (
        <span className="font-mono font-medium text-gray-900">{item.partNumber}</span>
      ),
    },
    {
      key: 'brand',
      title: '品牌',
      width: 100,
      hideOnMobile: true,
      render: (_, item) => <span className="text-sm text-gray-600">{item.brand || '-'}</span>,
    },
    {
      key: 'seller',
      title: '供应商',
      render: (_, item) => (
        <span className="text-sm text-gray-900 truncate block max-w-[150px]">
          {item.seller?.companyName || item.sellerCompanyName || '-'}
        </span>
      ),
    },
    {
      key: 'quantity',
      title: '数量',
      width: 80,
      align: 'center',
      render: (_, item) => (
        <span className={`font-mono ${item.quantity > 0 ? 'text-gray-900' : 'text-red-500'}`}>
          {item.quantity}
        </span>
      ),
    },
    {
      key: 'price',
      title: '单价',
      width: 100,
      align: 'right',
      render: (_, item) => (
        <span className="font-mono font-semibold text-gray-900">{formatMoney(item.price)}</span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: 120,
      align: 'right',
      render: (_, item) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openModal('detail', item);
            }}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="查看详情"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openModal('edit', item);
            }}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            title="编辑"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openModal('delete', item);
            }}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">库存管理</h1>
          <p className="text-gray-500 mt-1 text-sm">查看和管理平台所有库存信息</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} disabled={loading} className="admin-btn admin-btn-secondary">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
          <button onClick={() => openModal('create')} className="admin-btn admin-btn-primary">
            <Plus className="w-4 h-4" />
            添加库存
          </button>
        </div>
      </div>

      {/* KPI 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="库存条目"
          value={stats.total.toLocaleString()}
          icon={<Package className="w-5 h-5" />}
          color="blue"
        />
        <KPICard
          title="供应商数量"
          value={stats.sellers.toLocaleString()}
          icon={<Building2 className="w-5 h-5" />}
          color="purple"
        />
        <KPICard
          title="型号数量"
          value={stats.models.toLocaleString()}
          icon={<Layers className="w-5 h-5" />}
          color="green"
        />
        <KPICard
          title="总数量"
          value={stats.totalQuantity.toLocaleString()}
          icon={<Warehouse className="w-5 h-5" />}
          color="orange"
        />
      </div>

      {/* 搜索栏 */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索型号、品牌或供应商..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 数据表格 */}
      <DataTable
        data={filteredItems}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyText="暂无库存数据"
        pagination={{
          current: 1,
          pageSize: 100,
          total: filteredItems.length,
        }}
      />

      {/* 弹窗 */}
      <AnimatePresence>
        {modalType && (
          <InventoryModal
            type={modalType}
            selectedItem={selectedItem}
            editForm={editForm}
            setEditForm={setEditForm}
            formatMoney={formatMoney}
            onClose={closeModal}
            onSave={handleSave}
            onDelete={handleDelete}
            onEdit={() => {
              closeModal();
              setTimeout(() => openModal('edit', selectedItem!), 100);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 库存弹窗组件
// ═══════════════════════════════════════════════════════════════

interface InventoryModalProps {
  type: 'detail' | 'edit' | 'create' | 'delete';
  selectedItem: Inventory | null;
  editForm: {
    partNumber: string;
    brand: string;
    quantity: number;
    price: number;
    package: string;
    year: string;
    description: string;
  };
  setEditForm: React.Dispatch<
    React.SetStateAction<{
      partNumber: string;
      brand: string;
      quantity: number;
      price: number;
      package: string;
      year: string;
      description: string;
    }>
  >;
  formatMoney: (n: number) => string;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

const InventoryModal: React.FC<InventoryModalProps> = ({
  type,
  selectedItem,
  editForm,
  setEditForm,
  formatMoney,
  onClose,
  onSave,
  onDelete,
  onEdit,
}) => {
  const isForm = type === 'edit' || type === 'create';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className={`bg-white rounded-xl shadow-xl w-full ${isForm ? 'max-w-lg max-h-[90vh] overflow-y-auto' : 'max-w-md'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {type === 'detail' && '库存详情'}
            {type === 'edit' && '编辑库存'}
            {type === 'create' && '添加库存'}
            {type === 'delete' && (
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                确认删除
              </span>
            )}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          {type === 'detail' && selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-1">型号</div>
                  <div className="font-mono font-medium">{selectedItem.partNumber}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-1">品牌</div>
                  <div>{selectedItem.brand || '-'}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-1">数量</div>
                  <div className="font-mono font-bold text-lg">{selectedItem.quantity}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-1">单价</div>
                  <div className="font-mono font-bold text-lg">{formatMoney(selectedItem.price)}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-1">封装</div>
                  <div>{selectedItem.package || '-'}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-1">年份</div>
                  <div>{selectedItem.year || '-'}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-1">供应商</div>
                  <div>{selectedItem.seller?.companyName || selectedItem.sellerCompanyName || '-'}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-1">创建时间</div>
                  <div>{new Date(selectedItem.createdAt).toLocaleDateString('zh-CN')}</div>
                </div>
              </div>
              {selectedItem.description && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-1">描述</div>
                  <div className="text-sm">{selectedItem.description}</div>
                </div>
              )}
            </div>
          )}

          {isForm && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">型号 *</label>
                  <input
                    type="text"
                    value={editForm.partNumber}
                    onChange={(e) => setEditForm({ ...editForm, partNumber: e.target.value })}
                    className="admin-input"
                    placeholder="如: STM32F103C8T6"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">品牌</label>
                  <input
                    type="text"
                    value={editForm.brand}
                    onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                    className="admin-input"
                    placeholder="如: ST"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">数量 *</label>
                  <input
                    type="number"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })}
                    className="admin-input"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">单价 *</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                    className="admin-input"
                    min={0}
                    step={0.01}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">封装</label>
                  <input
                    type="text"
                    value={editForm.package}
                    onChange={(e) => setEditForm({ ...editForm, package: e.target.value })}
                    className="admin-input"
                    placeholder="如: LQFP48"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">年份</label>
                  <input
                    type="text"
                    value={editForm.year}
                    onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                    className="admin-input"
                    placeholder="如: 2023+"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="库存描述信息..."
                />
              </div>
            </div>
          )}

          {type === 'delete' && selectedItem && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-xl">
                <div className="font-mono font-medium">{selectedItem.partNumber}</div>
                <div className="text-sm text-gray-500 mt-1">
                  品牌: {selectedItem.brand || '-'} | 数量: {selectedItem.quantity} | 单价:{' '}
                  {formatMoney(selectedItem.price)}
                </div>
              </div>
              <p className="text-sm text-gray-600">删除后数据将无法恢复，确定要删除此库存记录吗？</p>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="admin-btn admin-btn-secondary">
            {type === 'detail' ? '关闭' : '取消'}
          </button>
          {type === 'detail' && (
            <button onClick={onEdit} className="admin-btn admin-btn-primary">
              编辑
            </button>
          )}
          {isForm && (
            <button onClick={onSave} className="admin-btn admin-btn-primary">
              {type === 'create' ? '添加' : '保存修改'}
            </button>
          )}
          {type === 'delete' && (
            <button onClick={onDelete} className="admin-btn bg-red-600 hover:bg-red-700 text-white">
              确认删除
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default InventoryManagement;
