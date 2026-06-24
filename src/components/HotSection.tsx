import { useState, useEffect } from 'react';
import { api, Inventory } from '../api/client';
import { TrendingUp, Star, Flame, Search, X } from 'lucide-react';

interface HotSectionProps {
  onSelectInventory?: (id: string) => void;
  onSearch?: (keyword: string) => void;
}

export function HotSection({ onSelectInventory, onSearch }: HotSectionProps) {
  const [hotInventories, setHotInventories] = useState<Inventory[]>([]);
  const [promotedInventories, setPromotedInventories] = useState<Inventory[]>([]);
  const [hotKeywords, setHotKeywords] = useState<{ keyword: string; count: number }[]>([]);
  const [searchHistory, setSearchHistory] = useState<{ id: string; keyword: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHotData();
    loadSearchHistory();
  }, []);

  const loadHotData = async () => {
    setLoading(true);
    try {
      const [hot, promoted, keywords] = await Promise.all([
        api.getHotInventories(8),
        api.getPromotedInventories(4),
        api.getHotKeywords(8),
      ]);
      setHotInventories(hot);
      setPromotedInventories(promoted);
      setHotKeywords(keywords);
    } catch (err) {
      console.error('加载热门数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSearchHistory = async () => {
    try {
      const history = await api.getSearchHistory(5);
      setSearchHistory(history.map(h => ({ id: h.id, keyword: h.keyword })));
    } catch {
      // 用户未登录时忽略错误
    }
  };

  const clearHistory = async () => {
    try {
      await api.clearSearchHistory();
      setSearchHistory([]);
    } catch (err) {
      console.error('清空搜索历史失败:', err);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 推广型号 */}
      {promotedInventories.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-gray-900">推荐型号</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {promotedInventories.map((inv) => (
              <div
                key={inv.id}
                onClick={() => onSelectInventory?.(inv.id)}
                className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
              >
                <div className="text-sm font-medium text-blue-600 truncate">{inv.partNumber}</div>
                <div className="text-xs text-gray-500 mt-1">库存: {inv.availableQty}</div>
                <div className="text-sm font-semibold text-gray-900 mt-1">¥{inv.price.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 热门型号 + 热门搜索 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 热门型号 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-900">热门型号</h3>
          </div>
          <div className="space-y-2">
            {hotInventories.slice(0, 6).map((inv, idx) => (
              <div
                key={inv.id}
                onClick={() => onSelectInventory?.(inv.id)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer group"
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx < 3 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
                    {inv.partNumber}
                  </div>
                  <div className="text-xs text-gray-500">库存 {inv.availableQty}</div>
                </div>
                <div className="text-sm font-semibold text-gray-900">¥{inv.price.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 热门搜索 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900">热门搜索</h3>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {hotKeywords.map((kw, idx) => (
              <button
                key={idx}
                onClick={() => onSearch?.(kw.keyword)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-blue-100 hover:text-blue-600 rounded-full text-sm text-gray-600 transition-colors"
              >
                {kw.keyword}
              </button>
            ))}
          </div>

          {/* 搜索历史 */}
          {searchHistory.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">搜索历史</span>
                </div>
                <button
                  onClick={clearHistory}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  清空
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => onSearch?.(h.keyword)}
                    className="px-3 py-1 bg-gray-50 hover:bg-gray-100 rounded-full text-sm text-gray-500 transition-colors flex items-center gap-1"
                  >
                    {h.keyword}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 相似型号推荐组件
interface SimilarModelsProps {
  partNumber: string;
  onSelectInventory?: (id: string) => void;
}

export function SimilarModels({ partNumber, onSelectInventory }: SimilarModelsProps) {
  const [similar, setSimilar] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSimilar();
  }, [partNumber]);

  const loadSimilar = async () => {
    setLoading(true);
    try {
      const result = await api.getSimilarInventories(partNumber, 6);
      setSimilar(result);
    } catch (err) {
      console.error('加载相似型号失败:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || similar.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-gray-900">相似型号推荐</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {similar.map((inv) => (
          <div
            key={inv.id}
            onClick={() => onSelectInventory?.(inv.id)}
            className="p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 cursor-pointer transition-all"
          >
            <div className="text-sm font-medium text-gray-900 truncate">{inv.partNumber}</div>
            <div className="text-xs text-gray-500 mt-1">库存: {inv.availableQty}</div>
            <div className="text-sm font-semibold text-blue-600 mt-1">¥{inv.price.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
