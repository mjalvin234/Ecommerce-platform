import React, { useState, useEffect } from 'react';
import { X, Star, Users, TrendingUp, TrendingDown, Heart, UserPlus, UserMinus, Award, Clock, ChevronRight } from 'lucide-react';
import { api } from '../api/client';

interface UserCenterProps {
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const UserCenter: React.FC<UserCenterProps> = ({ onClose, showToast }) => {
  const [activeTab, setActiveTab] = useState<'credit' | 'favorites' | 'following' | 'followers'>('credit');
  const [loading, setLoading] = useState(false);

  // 信用数据
  const [creditInfo, setCreditInfo] = useState<any>(null);
  const [creditHistory, setCreditHistory] = useState<any[]>([]);

  // 收藏数据
  const [favorites, setFavorites] = useState<any[]>([]);
  const [favoriteTotal, setFavoriteTotal] = useState(0);

  // 关注数据
  const [following, setFollowing] = useState<any[]>([]);
  const [followingTotal, setFollowingTotal] = useState(0);
  const [followers, setFollowers] = useState<any[]>([]);
  const [followerTotal, setFollowerTotal] = useState(0);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'credit') {
        const [info, history] = await Promise.all([
          api.getMyCreditInfo(),
          api.getCreditHistory(1, 20),
        ]);
        setCreditInfo(info);
        setCreditHistory(history.items);
      } else if (activeTab === 'favorites') {
        const result = await api.getFavorites(1, 20);
        setFavorites(result.items);
        setFavoriteTotal(result.total);
      } else if (activeTab === 'following') {
        const result = await api.getFollowing(1, 20);
        setFollowing(result.items);
        setFollowingTotal(result.total);
      } else if (activeTab === 'followers') {
        const result = await api.getFollowers(1, 20);
        setFollowers(result.items);
        setFollowerTotal(result.total);
      }
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfavorite = async (inventoryId: string, partNumber: string) => {
    try {
      await api.removeFavorite(inventoryId);
      showToast(`已取消收藏 ${partNumber}`);
      loadData();
    } catch (err) {
      showToast('取消收藏失败');
    }
  };

  const handleUnfollow = async (userId: string, companyName: string) => {
    try {
      await api.unfollowUser(userId);
      showToast(`已取消关注 ${companyName}`);
      loadData();
    } catch (err) {
      showToast('取消关注失败');
    }
  };

  const getCreditLevelColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'normal': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'poor': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'very_poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCreditLevelIcon = (level: string) => {
    switch (level) {
      case 'excellent': return '🏆';
      case 'good': return '⭐';
      case 'normal': return '✓';
      case 'poor': return '⚠️';
      case 'very_poor': return '❌';
      default: return '?';
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95">
        {/* 头部 */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            个人中心
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 标签栏 */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab('credit')}
            className={`flex-shrink-0 px-5 py-3 text-sm font-bold transition-colors border-b-2 ${
              activeTab === 'credit'
                ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <Award className="w-4 h-4 inline mr-2" />
            信用评分
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-shrink-0 px-5 py-3 text-sm font-bold transition-colors border-b-2 ${
              activeTab === 'favorites'
                ? 'text-red-600 border-red-600 bg-red-50/50'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <Heart className="w-4 h-4 inline mr-2" />
            我的收藏 {favoriteTotal > 0 && `(${favoriteTotal})`}
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-shrink-0 px-5 py-3 text-sm font-bold transition-colors border-b-2 ${
              activeTab === 'following'
                ? 'text-purple-600 border-purple-600 bg-purple-50/50'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            我的关注 {followingTotal > 0 && `(${followingTotal})`}
          </button>
          <button
            onClick={() => setActiveTab('followers')}
            className={`flex-shrink-0 px-5 py-3 text-sm font-bold transition-colors border-b-2 ${
              activeTab === 'followers'
                ? 'text-green-600 border-green-600 bg-green-50/50'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            我的粉丝 {followerTotal > 0 && `(${followerTotal})`}
          </button>
        </div>

        {/* 内容区 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* 信用评分 */}
              {activeTab === 'credit' && creditInfo && (
                <div className="space-y-6">
                  {/* 信用分数展示 */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">当前信用分</p>
                        <div className="flex items-baseline gap-3">
                          <span className="text-5xl font-bold text-blue-600">{creditInfo.score}</span>
                          <span className="text-sm text-gray-500">/ 100</span>
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-lg border ${getCreditLevelColor(creditInfo.level)}`}>
                        <span className="text-2xl mr-2">{getCreditLevelIcon(creditInfo.level)}</span>
                        <span className="font-bold">{creditInfo.levelLabel}</span>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">近30天变动</p>
                        <p className={`font-bold text-lg flex items-center justify-center gap-1 ${creditInfo.recentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {creditInfo.recentChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {creditInfo.recentChange >= 0 ? '+' : ''}{creditInfo.recentChange}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">加分次数</p>
                        <p className="font-bold text-lg text-green-600">{creditInfo.positiveCount}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">减分次数</p>
                        <p className="font-bold text-lg text-red-600">{creditInfo.negativeCount}</p>
                      </div>
                    </div>
                  </div>

                  {/* 历史记录 */}
                  <div>
                    <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      变动记录
                    </h4>
                    {creditHistory.length === 0 ? (
                      <p className="text-center text-gray-400 py-8">暂无信用变动记录</p>
                    ) : (
                      <div className="space-y-2">
                        {creditHistory.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div>
                              <p className="font-medium text-sm">{item.remark || item.changeType}</p>
                              <p className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${item.changeAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {item.changeAmount >= 0 ? '+' : ''}{item.changeAmount}
                              </p>
                              <p className="text-xs text-gray-400">{item.scoreBefore} → {item.scoreAfter}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 我的收藏 */}
              {activeTab === 'favorites' && (
                <div>
                  {favorites.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">暂无收藏</p>
                      <p className="text-sm text-gray-400 mt-1">搜索库存时可点击收藏喜欢的商品</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {favorites.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                          <div className="flex-1">
                            <div className="font-mono font-bold text-gray-900">{item.inventory?.partNumber}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              <span className="text-red-600 font-bold">¥{(item.inventory?.price || 0).toFixed(2)}</span>
                              <span className="mx-2">·</span>
                              库存: {(item.inventory?.availableQty || 0).toLocaleString()} 件
                              {item.inventory?.seller && (
                                <>
                                  <span className="mx-2">·</span>
                                  {item.inventory.seller.companyName}
                                </>
                              )}
                            </div>
                            {item.note && (
                              <p className="text-xs text-gray-400 mt-1">备注: {item.note}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleUnfavorite(item.inventory?.id, item.inventory?.partNumber)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="取消收藏"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 我的关注 */}
              {activeTab === 'following' && (
                <div>
                  {following.length === 0 ? (
                    <div className="text-center py-12">
                      <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">暂无关注</p>
                      <p className="text-sm text-gray-400 mt-1">可以关注供应商获取最新库存动态</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {following.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-purple-200 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                              {item.user?.companyName?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{item.user?.companyName}</div>
                              <div className="text-xs text-gray-500">
                                {item.user?.role === 'seller' ? '供应商' : '采购商'}
                                {item.user?.creditScore !== undefined && (
                                  <span className="ml-2 text-blue-600">信用分: {item.user.creditScore}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnfollow(item.user?.id, item.user?.companyName)}
                            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <UserMinus className="w-4 h-4" />
                            取消关注
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 我的粉丝 */}
              {activeTab === 'followers' && (
                <div>
                  {followers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">暂无粉丝</p>
                      <p className="text-sm text-gray-400 mt-1">发布优质库存可以吸引更多关注者</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {followers.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                            {item.user?.companyName?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{item.user?.companyName}</div>
                            <div className="text-xs text-gray-500">
                              {item.user?.role === 'buyer' ? '采购商' : '供应商'}
                              <span className="ml-2">关注于 {new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserCenter;
