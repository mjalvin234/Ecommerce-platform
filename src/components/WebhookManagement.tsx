import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Webhook, Plus, Trash2, RefreshCw, Play, Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

interface WebhookItem {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
  createdAt: string;
}

interface WebhookLog {
  id: string;
  eventType: string;
  responseStatus: number | null;
  success: boolean;
  duration: number | null;
  createdAt: string;
}

const WEBHOOK_EVENTS = [
  { value: 'order.created', label: '订单创建' },
  { value: 'order.paid', label: '订单支付' },
  { value: 'order.shipped', label: '订单发货' },
  { value: 'order.completed', label: '订单完成' },
  { value: 'order.cancelled', label: '订单取消' },
  { value: 'inventory.created', label: '库存发布' },
  { value: 'inventory.updated', label: '库存更新' },
  { value: 'inventory.low_stock', label: '库存预警' },
  { value: 'payment.received', label: '收款成功' },
  { value: 'payment.failed', label: '收款失败' },
];

export function WebhookManagement() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookItem | null>(null);
  const [formData, setFormData] = useState({ url: '', events: [] as string[] });
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    setLoading(true);
    try {
      const data = await api.getWebhooks();
      setWebhooks(data);
    } catch (err) {
      console.error('加载Webhooks失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (id: string) => {
    setLogsLoading(true);
    try {
      const result = await api.getWebhookLogs(id);
      setLogs(result.items);
    } catch (err) {
      console.error('加载日志失败:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.url) {
      alert('请输入回调URL');
      return;
    }
    if (formData.events.length === 0) {
      alert('请选择至少一个事件');
      return;
    }

    try {
      if (editingWebhook) {
        await api.updateWebhook(editingWebhook.id, formData);
      } else {
        const result = await api.createWebhook(formData.url, formData.events);
        alert(`Webhook创建成功！\nSecret: ${result.secret}\n请妥善保管！`);
      }
      setShowCreateModal(false);
      setEditingWebhook(null);
      setFormData({ url: '', events: [] });
      loadWebhooks();
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此Webhook吗？')) return;

    try {
      await api.deleteWebhook(id);
      loadWebhooks();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await api.updateWebhook(id, { active: !active });
      loadWebhooks();
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  const handleTest = async (id: string) => {
    try {
      const result = await api.testWebhook(id);
      if (result.success) {
        alert(`测试成功！\n响应: ${result.response}`);
      } else {
        alert(`测试失败！\n错误: ${result.error}`);
      }
    } catch (err: any) {
      alert(err.message || '测试失败');
    }
  };

  const handleRegenerateSecret = async (id: string) => {
    if (!confirm('重新生成Secret后，旧的Secret将立即失效。确定继续？')) return;

    try {
      const result = await api.regenerateWebhookSecret(id);
      alert(`新的Secret: ${result.secret}\n请妥善保管！`);
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  const toggleEvent = (event: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  const getEventLabel = (event: string) => {
    return WEBHOOK_EVENTS.find(e => e.value === event)?.label || event;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Webhook className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Webhook配置</h2>
        </div>
        <button
          onClick={() => {
            setEditingWebhook(null);
            setFormData({ url: '', events: [] });
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          添加Webhook
        </button>
      </div>

      {/* Webhook列表 */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : webhooks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          暂无Webhook，点击上方按钮添加
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${webhook.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="font-medium">{webhook.url}</span>
                  <a href={webhook.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTest(webhook.id)}
                    className="p-1 text-gray-400 hover:text-green-600"
                    title="测试"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRegenerateSecret(webhook.id)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="重置Secret"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggle(webhook.id, webhook.active)}
                    className={`px-2 py-1 rounded text-xs ${
                      webhook.active
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {webhook.active ? '禁用' : '启用'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingWebhook(webhook);
                      setFormData({ url: webhook.url, events: webhook.events });
                      setShowCreateModal(true);
                    }}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(webhook.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {webhook.events.map((event) => (
                  <span key={event} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                    {getEventLabel(event)}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>创建于: {new Date(webhook.createdAt).toLocaleString('zh-CN')}</span>
                <button
                  onClick={() => {
                    if (selectedWebhook === webhook.id) {
                      setSelectedWebhook(null);
                    } else {
                      setSelectedWebhook(webhook.id);
                      loadLogs(webhook.id);
                    }
                  }}
                  className="flex items-center gap-1 hover:text-gray-700"
                >
                  <Clock className="w-4 h-4" />
                  查看日志
                </button>
              </div>

              {/* 日志面板 */}
              {selectedWebhook === webhook.id && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-700 mb-2">调用日志</h4>
                  {logsLoading ? (
                    <div className="text-center py-4 text-gray-500">加载中...</div>
                  ) : logs.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">暂无调用记录</div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {logs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                          <div className="flex items-center gap-2">
                            {log.success ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span>{getEventLabel(log.eventType)}</span>
                          </div>
                          <div className="flex items-center gap-4 text-gray-500">
                            <span>HTTP {log.responseStatus || 'N/A'}</span>
                            <span>{log.duration}ms</span>
                            <span>{new Date(log.createdAt).toLocaleString('zh-CN')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 创建/编辑弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4">
              {editingWebhook ? '编辑Webhook' : '添加Webhook'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">回调URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://your-server.com/webhook"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">订阅事件</label>
                <div className="grid grid-cols-2 gap-2">
                  {WEBHOOK_EVENTS.map((event) => (
                    <label key={event.value} className="flex items-center gap-2 p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event.value)}
                        onChange={() => toggleEvent(event.value)}
                        className="rounded"
                      />
                      <span className="text-sm">{event.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingWebhook(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingWebhook ? '保存' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
