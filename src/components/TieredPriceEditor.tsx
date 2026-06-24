import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, TrendingDown } from 'lucide-react';
import { api } from '../api/client';

interface TieredPriceEditorProps {
  inventoryId: string;
  basePrice: number;
  onClose: () => void;
  showToast: (msg: string) => void;
}

interface Tier {
  id?: string;
  minQuantity: number;
  maxQuantity: number | null;
  unitPrice: number;
}

export const TieredPriceEditor: React.FC<TieredPriceEditorProps> = ({
  inventoryId,
  basePrice,
  onClose,
  showToast,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tiers, setTiers] = useState<Tier[]>([
    { minQuantity: 1, maxQuantity: null, unitPrice: basePrice },
  ]);

  useEffect(() => {
    loadTiers();
  }, [inventoryId]);

  const loadTiers = async () => {
    setLoading(true);
    try {
      const result = await api.getTieredPrices(inventoryId);
      if (result.length > 0) {
        setTiers(result.map(t => ({
          id: t.id,
          minQuantity: t.minQuantity,
          maxQuantity: t.maxQuantity,
          unitPrice: Number(t.unitPrice),
        })));
      }
    } catch (err) {
      console.error('加载阶梯价格失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newMin = lastTier.maxQuantity ? lastTier.maxQuantity + 1 : 1;
    setTiers([...tiers, { minQuantity: newMin, maxQuantity: null, unitPrice: basePrice * 0.9 }]);
  };

  const removeTier = (index: number) => {
    if (tiers.length <= 1) {
      showToast('至少保留一个价格区间');
      return;
    }
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: keyof Tier, value: any) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTiers(newTiers);
  };

  const saveTiers = async () => {
    // 验证
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      if (tier.minQuantity < 1) {
        showToast('最小数量必须大于0');
        return;
      }
      if (tier.unitPrice <= 0) {
        showToast('单价必须大于0');
        return;
      }
    }

    setSaving(true);
    try {
      await api.setTieredPrices(inventoryId, tiers.map(t => ({
        minQuantity: t.minQuantity,
        maxQuantity: t.maxQuantity,
        unitPrice: t.unitPrice,
      })));
      showToast('阶梯价格设置成功');
      onClose();
    } catch (err: any) {
      showToast(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const deleteAllTiers = async () => {
    try {
      await api.deleteTieredPrices(inventoryId);
      showToast('已关闭阶梯定价');
      onClose();
    } catch (err: any) {
      showToast(err.message || '删除失败');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-blue-500" />
            阶梯定价设置
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex items-start gap-2">
                <TrendingDown className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>设置不同数量区间的单价，鼓励买家批量采购。基础单价: ¥{basePrice.toFixed(2)}</span>
              </div>

              {/* 价格区间列表 */}
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-500 uppercase">
                  <div className="col-span-4">数量区间</div>
                  <div className="col-span-3">单价</div>
                  <div className="col-span-3">折扣</div>
                  <div className="col-span-2">操作</div>
                </div>

                {tiers.map((tier, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4 flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        value={tier.minQuantity}
                        onChange={(e) => updateTier(index, 'minQuantity', parseInt(e.target.value) || 1)}
                        className="w-20 border border-gray-300 rounded px-2 py-1.5 text-sm font-mono"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="number"
                        min={tier.minQuantity + 1}
                        value={tier.maxQuantity || ''}
                        onChange={(e) => updateTier(index, 'maxQuantity', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="无上限"
                        className="w-20 border border-gray-300 rounded px-2 py-1.5 text-sm font-mono"
                        disabled={index !== tiers.length - 1}
                      />
                      <span className="text-gray-500 text-xs">件</span>
                    </div>
                    <div className="col-span-3">
                      <div className="relative">
                        <span className="absolute left-2 top-2 text-gray-400 text-sm">¥</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={tier.unitPrice}
                          onChange={(e) => updateTier(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-300 rounded pl-6 pr-2 py-1.5 text-sm font-mono"
                        />
                      </div>
                    </div>
                    <div className="col-span-3">
                      <span className={`text-sm font-bold ${
                        tier.unitPrice < basePrice ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {tier.unitPrice < basePrice
                          ? `${Math.round((tier.unitPrice / basePrice) * 100)}%`
                          : '基准价'}
                      </span>
                    </div>
                    <div className="col-span-2 flex gap-1">
                      <button
                        onClick={() => removeTier(index)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        disabled={tiers.length <= 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addTier}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                添加价格区间
              </button>

              {/* 预览 */}
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <h4 className="font-bold text-sm text-gray-700 mb-3">买家视角预览</h4>
                <div className="space-y-2">
                  {tiers.map((tier, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {tier.minQuantity}-{tier.maxQuantity || '∞'} 件
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">¥{tier.unitPrice.toFixed(2)}/件</span>
                        {tier.unitPrice < basePrice && (
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                            省{Math.round((1 - tier.unitPrice / basePrice) * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-between gap-3">
          <button
            onClick={deleteAllTiers}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            关闭阶梯定价
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={saveTiers}
              disabled={saving}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              保存设置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TieredPriceEditor;
