import React, { useState, useEffect } from 'react';
import { Bell, Package, ArrowRightLeft, Settings, Check, X, ChevronRight } from 'lucide-react';
import { api, Message, MessageCategory, MessageType } from '../api/client';

interface MessageCenterProps {
  onClose: () => void;
  showToast: (msg: string) => void;
}

// 消息类型图标映射
const getMessageIcon = (type: MessageType) => {
  if (type.startsWith('order_')) return <Package className="w-5 h-5 text-blue-500" />;
  if (type.startsWith('negotiation_')) return <ArrowRightLeft className="w-5 h-5 text-orange-500" />;
  return <Bell className="w-5 h-5 text-gray-500" />;
};

// 消息类型颜色映射
const getMessageColor = (type: MessageType) => {
  if (type.includes('completed') || type.includes('accepted')) return 'border-l-green-500';
  if (type.includes('cancelled') || type.includes('rejected')) return 'border-l-red-500';
  if (type.includes('shipped') || type.includes('paid')) return 'border-l-orange-500';
  return 'border-l-blue-500';
};

export const MessageCenter: React.FC<MessageCenterProps> = ({ onClose, showToast }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState({ total: 0, byCategory: { order: 0, negotiation: 0, system: 0 } });
  const [activeCategory, setActiveCategory] = useState<MessageCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // 加载消息
  const loadMessages = async () => {
    try {
      const result = await api.getMessages({
        category: activeCategory === 'all' ? undefined : activeCategory,
        pageSize: 50,
      });
      setMessages(result.items);
      setUnreadCount(result.unreadCount);
    } catch (err) {
      console.error('加载消息失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    // 每30秒刷新一次
    const interval = setInterval(loadMessages, 30000);
    return () => clearInterval(interval);
  }, [activeCategory]);

  // 标记单条已读
  const markAsRead = async (message: Message) => {
    if (message.read) return;
    try {
      await api.markMessageAsRead(message.id);
      setMessages(prev =>
        prev.map(m => (m.id === message.id ? { ...m, read: true } : m))
      );
      setUnreadCount(prev => ({
        total: Math.max(0, prev.total - 1),
        byCategory: {
          ...prev.byCategory,
          [getMessageCategory(message.type)]: Math.max(0, prev.byCategory[getMessageCategory(message.type)] - 1),
        },
      }));
    } catch (err) {
      console.error('标记已读失败:', err);
    }
  };

  // 全部标记已读
  const markAllAsRead = async () => {
    try {
      await api.markAllMessagesAsRead({
        category: activeCategory === 'all' ? undefined : activeCategory,
      });
      setMessages(prev => prev.map(m => ({ ...m, read: true })));
      setUnreadCount({ total: 0, byCategory: { order: 0, negotiation: 0, system: 0 } });
      showToast('已将所有消息标记为已读');
    } catch (err) {
      console.error('全部标记已读失败:', err);
    }
  };

  // 获取消息分类
  const getMessageCategory = (type: MessageType): MessageCategory => {
    if (type.startsWith('order_')) return 'order';
    if (type.startsWith('negotiation_')) return 'negotiation';
    return 'system';
  };

  // 分类标签
  const categories: Array<{ key: MessageCategory | 'all'; label: string; count: number }> = [
    { key: 'all', label: '全部', count: unreadCount.total },
    { key: 'order', label: '订单', count: unreadCount.byCategory.order },
    { key: 'negotiation', label: '议价', count: unreadCount.byCategory.negotiation },
    { key: 'system', label: '系统', count: unreadCount.byCategory.system },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-in zoom-in-95">
        {/* 头部 */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-exchange-accent" />
            <h3 className="font-bold text-lg">消息中心</h3>
            {unreadCount.total > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unreadCount.total} 条未读
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount.total > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Check className="w-4 h-4" /> 全部已读
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 分类标签 */}
        <div className="flex gap-2 p-4 border-b border-gray-100 bg-gray-50/50">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === cat.key
                  ? 'bg-exchange-dark text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.label}
              {cat.count > 0 && (
                <span className={`ml-1 text-xs ${activeCategory === cat.key ? 'text-white/80' : 'text-red-500'}`}>
                  ({cat.count})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 消息列表 */}
        <div className="overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              加载中...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Bell className="w-12 h-12 mb-3 text-gray-300" />
              <p>暂无消息</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => {
                    markAsRead(msg);
                    setSelectedMessage(msg);
                  }}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${
                    msg.read ? 'border-l-transparent' : getMessageColor(msg.type)
                  } ${!msg.read ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">{getMessageIcon(msg.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className={`font-medium ${!msg.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {msg.title}
                        </h4>
                        <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${!msg.read ? 'text-gray-700' : 'text-gray-500'}`}>
                        {msg.content}
                      </p>
                      {!msg.read && (
                        <span className="inline-block mt-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 消息详情弹窗 */}
        {selectedMessage && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
              <div className="flex justify-between items-center p-4 border-b border-gray-100">
                <h3 className="font-bold text-lg">{selectedMessage.title}</h3>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-gray-700">{selectedMessage.content}</p>
                <p className="text-xs text-gray-400 mt-4">
                  {new Date(selectedMessage.createdAt).toLocaleString()}
                </p>
                {selectedMessage.relatedData?.orderNumber && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">
                      订单号：<span className="font-mono font-medium">{selectedMessage.relatedData.orderNumber}</span>
                    </p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 消息图标组件（带未读徽章）
export const MessageBell: React.FC<{
  onClick: () => void;
  unreadCount: number;
}> = ({ onClick, unreadCount }) => (
  <button
    onClick={onClick}
    className="relative p-2 text-gray-400 hover:text-white transition-colors"
    title="消息中心"
  >
    <Bell className="w-5 h-5" />
    {unreadCount > 0 && (
      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    )}
  </button>
);
