import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Key, Plus, Trash2, RefreshCw, Eye, EyeOff, Copy, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

type ApiKeyPlan = 'free' | 'basic' | 'pro' | 'enterprise';

interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  plan: ApiKeyPlan;
  rateLimit: number;
  permissions: string[];
  status: string;
  lastUsedAt?: string;
  createdAt: string;
  secret?: string;
}

const PLAN_INFO: Record<ApiKeyPlan, { label: string; dailyLimit: number; color: string }> = {
  free: { label: '免费版', dailyLimit: 100, color: 'gray' },
  basic: { label: '基础版', dailyLimit: 1000, color: 'blue' },
  pro: { label: '专业版', dailyLimit: 10000, color: 'purple' },
  enterprise: { label: '企业版', dailyLimit: -1, color: 'gold' }
};

export function ApiManagement() {
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPlan, setNewKeyPlan] = useState<ApiKeyPlan>('free');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState<string | null>(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKeyItem | null>(null);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    setLoading(true);
    try {
      const keys = await api.getApiKeys();
      setApiKeys(keys);
    } catch (err) {
      console.error('加载API Keys失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newKeyName.trim()) {
      alert('请输入密钥名称');
      return;
    }

    try {
      const key = await api.createApiKey(newKeyName, newKeyPlan);
      setNewlyCreatedKey(key);
      setShowCreateModal(false);
      setNewKeyName('');
      setNewKeyPlan('free');
      loadApiKeys();
    } catch (err: any) {
      alert(err.message || '创建失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此API Key吗？删除后无法恢复。')) return;

    try {
      await api.deleteApiKey(id);
      loadApiKeys();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  const handleToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.toggleApiKey(id, newStatus);
      loadApiKeys();
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  const handleRegenerate = async (id: string) => {
    if (!confirm('重新生成Secret后，旧的Secret将立即失效。确定继续？')) return;

    try {
      const result = await api.regenerateApiSecret(id);
      alert(`新的Secret: ${result.secret}\n请妥善保管！`);
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" />活跃</span>;
      case 'suspended':
        return <span className="flex items-center gap-1 text-yellow-600"><XCircle className="w-4 h-4" />暂停</span>;
      case 'pending':
        return <span className="flex items-center gap-1 text-gray-500"><Clock className="w-4 h-4" />待审核</span>;
      default:
        return <span className="text-gray-400">{status}</span>;
    }
  };

  const getPlanBadge = (plan: ApiKeyPlan) => {
    const info = PLAN_INFO[plan];
    const colorMap: Record<string, string> = {
      gray: 'bg-gray-100 text-gray-700',
      blue: 'bg-blue-100 text-blue-700',
      purple: 'bg-purple-100 text-purple-700',
      gold: 'bg-yellow-100 text-yellow-700'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs ${colorMap[info.color]}`}>
        {info.label}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Key className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">API密钥管理</h2>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          创建密钥
        </button>
      </div>

      {/* 新创建的密钥提示 */}
      {newlyCreatedKey && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">🎉 API Key创建成功！</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">Key: </span>
              <code className="bg-green-100 px-2 py-1 rounded">{newlyCreatedKey.key}</code>
              <button onClick={() => copyToClipboard(newlyCreatedKey.key)} className="ml-2 text-green-600 hover:text-green-700">
                <Copy className="w-4 h-4 inline" />
              </button>
            </div>
            <div>
              <span className="text-gray-600">Secret: </span>
              <code className="bg-green-100 px-2 py-1 rounded">{newlyCreatedKey.secret}</code>
              <button onClick={() => copyToClipboard(newlyCreatedKey.secret!)} className="ml-2 text-green-600 hover:text-green-700">
                <Copy className="w-4 h-4 inline" />
              </button>
            </div>
            <p className="text-red-600">⚠️ 请立即保存Secret，它只会显示一次！</p>
          </div>
          <button onClick={() => setNewlyCreatedKey(null)} className="mt-2 text-sm text-gray-500 hover:text-gray-700">
            关闭
          </button>
        </div>
      )}

      {/* 密钥列表 */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : apiKeys.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          暂无API密钥，点击上方按钮创建
        </div>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <div key={key.id} className="border border-gray-200 rounded-lg">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedKey(expandedKey === key.id ? null : key.id)}
              >
                <div className="flex items-center gap-4">
                  <Key className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium">{key.name}</div>
                    <div className="text-sm text-gray-500">{key.key.substring(0, 16)}...</div>
                  </div>
                  {getPlanBadge(key.plan)}
                  {getStatusBadge(key.status)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    限流: {key.rateLimit}次/分钟
                  </span>
                  {expandedKey === key.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {expandedKey === key.id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">API Key</div>
                      <div className="flex items-center gap-2">
                        <code className="bg-white px-2 py-1 rounded border text-sm">{key.key}</code>
                        <button onClick={() => copyToClipboard(key.key)} className="text-gray-400 hover:text-gray-600">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Secret</div>
                      <div className="flex items-center gap-2">
                        <code className="bg-white px-2 py-1 rounded border text-sm">
                          {showSecret === key.id ? key.secret : '••••••••••••••••'}
                        </code>
                        <button onClick={() => setShowSecret(showSecret === key.id ? null : key.id)} className="text-gray-400 hover:text-gray-600">
                          {showSecret === key.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        {showSecret === key.id && (
                          <button onClick={() => copyToClipboard(key.secret || '')} className="text-gray-400 hover:text-gray-600">
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">权限</div>
                    <div className="flex flex-wrap gap-1">
                      {key.permissions.map((p) => (
                        <span key={p} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 mb-4">
                    最后使用: {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString('zh-CN') : '从未使用'}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggle(key.id, key.status)}
                      className={`px-3 py-1 rounded text-sm ${
                        key.status === 'active'
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {key.status === 'active' ? '暂停' : '激活'}
                    </button>
                    <button
                      onClick={() => handleRegenerate(key.id)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      重置Secret
                    </button>
                    <button
                      onClick={() => handleDelete(key.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      删除
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 创建密钥弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">创建API密钥</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">密钥名称</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="例如：生产环境、测试环境"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">套餐</label>
                <select
                  value={newKeyPlan}
                  onChange={(e) => setNewKeyPlan(e.target.value as ApiKeyPlan)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {Object.entries(PLAN_INFO).map(([plan, info]) => (
                    <option key={plan} value={plan}>
                      {info.label} ({info.dailyLimit === -1 ? '无限' : `${info.dailyLimit}次/天`})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
