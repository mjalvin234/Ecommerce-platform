import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Download, FileSpreadsheet, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface ExportTask {
  id: string;
  type: string;
  status: string;
  fileName?: string;
  totalCount: number;
  processedCount: number;
  createdAt: string;
  completedAt?: string;
}

export function DataExport() {
  const [exportType, setExportType] = useState<'orders' | 'inventory' | 'transactions'>('orders');
  const [loading, setLoading] = useState(false);
  const [currentTask, setCurrentTask] = useState<ExportTask | null>(null);
  const [history, setHistory] = useState<ExportTask[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const result = await api.getExportHistory();
      setHistory(result.items);
    } catch (err) {
      console.error('加载历史失败:', err);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const task = await api.createExportTask(exportType);
      setCurrentTask(task);

      // 轮询任务状态
      const interval = setInterval(async () => {
        try {
          const updated = await api.getExportTask(task.id);
          setCurrentTask(updated);

          if (updated.status === 'completed' || updated.status === 'failed') {
            clearInterval(interval);
            loadHistory();
          }
        } catch (err) {
          clearInterval(interval);
        }
      }, 2000);
    } catch (err: any) {
      alert(err.message || '导出失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (taskId: string) => {
    window.open(`/api/export/download/${taskId}`, '_blank');
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      orders: '订单数据',
      inventory: '库存数据',
      transactions: '交易流水'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle className="w-4 h-4" />
            完成
          </span>
        );
      case 'processing':
        return (
          <span className="flex items-center gap-1 text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            处理中
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 text-red-600">
            <XCircle className="w-4 h-4" />
            失败
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-gray-500">
            <Clock className="w-4 h-4" />
            等待中
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <FileSpreadsheet className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">数据导出</h2>
      </div>

      {/* 导出选项 */}
      <div className="mb-6">
        <label className="block text-sm text-gray-600 mb-2">选择导出类型</label>
        <div className="flex gap-2">
          {(['orders', 'inventory', 'transactions'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setExportType(type)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                exportType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getTypeLabel(type)}
            </button>
          ))}
        </div>
      </div>

      {/* 当前任务进度 */}
      {currentTask && currentTask.status === 'processing' && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-700">正在导出...</span>
            <span className="text-sm text-blue-700">
              {currentTask.processedCount} / {currentTask.totalCount}
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 rounded-full h-2 transition-all"
              style={{ width: `${(currentTask.processedCount / currentTask.totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 导出按钮 */}
      <button
        onClick={handleExport}
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 mb-6"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            正在创建导出任务...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            开始导出
          </>
        )}
      </button>

      {/* 导出历史 */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">导出历史</h3>
        {history.length === 0 ? (
          <p className="text-gray-500 text-center py-4">暂无导出记录</p>
        ) : (
          <div className="space-y-2">
            {history.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{getTypeLabel(task.type)}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(task.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(task.status)}
                  {task.status === 'completed' && (
                    <button
                      onClick={() => handleDownload(task.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      <Download className="w-4 h-4" />
                      下载
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
