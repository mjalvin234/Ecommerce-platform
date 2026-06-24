import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { FileSpreadsheet, Upload, Download, CheckCircle, XCircle, Clock, Loader2, Search, AlertCircle } from 'lucide-react';

interface BomTask {
  id: string;
  fileName: string;
  totalCount: number;
  matchedCount: number;
  partialCount: number;
  notFoundCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  items?: BomItem[];
  createdAt: string;
  completedAt?: string;
}

interface BomItem {
  model: string;
  brand?: string;
  quantity: number;
  targetPrice?: number;
  remark?: string;
  matchedInventoryId?: string;
  matchedPrice?: number;
  matchStatus?: 'matched' | 'partial' | 'not_found';
}

export function BomImport() {
  const [tasks, setTasks] = useState<BomTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<BomTask | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualItems, setManualItems] = useState<BomItem[]>([
    { model: '', quantity: 1 }
  ]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const result = await api.getBomTasks();
      setTasks(result.items);
    } catch (err) {
      console.error('加载任务失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const task = await api.uploadBom(file);
      alert(`上传成功！正在处理 ${task.totalCount} 条数据...`);
      loadTasks();
      // 轮询任务状态
      pollTaskStatus(task.id);
    } catch (err: any) {
      alert(err.message || '上传失败');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleManualSubmit = async () => {
    const validItems = manualItems.filter(item => item.model.trim());
    if (validItems.length === 0) {
      alert('请至少填写一条有效数据');
      return;
    }

    setUploading(true);
    try {
      const task = await api.importBomJson(validItems);
      alert(`提交成功！正在处理 ${task.totalCount} 条数据...`);
      setShowManualInput(false);
      setManualItems([{ model: '', quantity: 1 }]);
      loadTasks();
      pollTaskStatus(task.id);
    } catch (err: any) {
      alert(err.message || '提交失败');
    } finally {
      setUploading(false);
    }
  };

  const pollTaskStatus = async (taskId: string) => {
    const interval = setInterval(async () => {
      try {
        const task = await api.getBomTask(taskId);
        if (task.status === 'completed' || task.status === 'failed') {
          clearInterval(interval);
          loadTasks();
          if (selectedTask?.id === taskId) {
            setSelectedTask(task);
          }
        }
      } catch (err) {
        clearInterval(interval);
      }
    }, 2000);
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await api.downloadBomTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bom-template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('下载模板失败');
    }
  };

  const handleDownloadResult = async (taskId: string) => {
    try {
      const blob = await api.downloadBomResult(taskId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bom-result-${taskId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('下载结果失败');
    }
  };

  const viewTaskDetail = async (taskId: string) => {
    try {
      const task = await api.getBomTask(taskId);
      setSelectedTask(task);
    } catch (err) {
      alert('获取详情失败');
    }
  };

  const addManualItem = () => {
    setManualItems([...manualItems, { model: '', quantity: 1 }]);
  };

  const removeManualItem = (index: number) => {
    setManualItems(manualItems.filter((_, i) => i !== index));
  };

  const updateManualItem = (index: number, field: keyof BomItem, value: any) => {
    setManualItems(manualItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" />完成</span>;
      case 'processing':
        return <span className="flex items-center gap-1 text-blue-600"><Loader2 className="w-4 h-4 animate-spin" />处理中</span>;
      case 'failed':
        return <span className="flex items-center gap-1 text-red-600"><XCircle className="w-4 h-4" />失败</span>;
      default:
        return <span className="flex items-center gap-1 text-gray-500"><Clock className="w-4 h-4" />等待中</span>;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <FileSpreadsheet className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">BOM批量导入</h2>
      </div>

      {/* 操作区域 */}
      <div className="flex gap-4 mb-6">
        <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
          <Upload className="w-4 h-4" />
          上传Excel
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
        <button
          onClick={() => setShowManualInput(!showManualInput)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          手动输入
        </button>
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          下载模板
        </button>
      </div>

      {/* 手动输入表单 */}
      {showManualInput && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-4">手动输入BOM数据</h3>
          <div className="space-y-2">
            {manualItems.map((item, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="型号"
                  value={item.model}
                  onChange={(e) => updateManualItem(index, 'model', e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm"
                />
                <input
                  type="text"
                  placeholder="品牌"
                  value={item.brand || ''}
                  onChange={(e) => updateManualItem(index, 'brand', e.target.value)}
                  className="w-24 border border-gray-300 rounded px-3 py-1.5 text-sm"
                />
                <input
                  type="number"
                  placeholder="数量"
                  value={item.quantity}
                  onChange={(e) => updateManualItem(index, 'quantity', parseInt(e.target.value) || 1)}
                  className="w-20 border border-gray-300 rounded px-3 py-1.5 text-sm"
                />
                <input
                  type="number"
                  placeholder="目标价"
                  value={item.targetPrice || ''}
                  onChange={(e) => updateManualItem(index, 'targetPrice', parseFloat(e.target.value) || undefined)}
                  className="w-24 border border-gray-300 rounded px-3 py-1.5 text-sm"
                />
                {manualItems.length > 1 && (
                  <button onClick={() => removeManualItem(index)} className="text-red-500 hover:text-red-700">
                    <XCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={addManualItem} className="text-blue-600 hover:text-blue-700 text-sm">
              + 添加一行
            </button>
            <button
              onClick={handleManualSubmit}
              disabled={uploading}
              className="ml-auto px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              {uploading ? '提交中...' : '提交'}
            </button>
          </div>
        </div>
      )}

      {/* 任务详情弹窗 */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">BOM匹配结果</h3>
              <button onClick={() => setSelectedTask(null)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{selectedTask.totalCount}</div>
                <div className="text-sm text-gray-500">总数量</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{selectedTask.matchedCount}</div>
                <div className="text-sm text-gray-500">已匹配</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{selectedTask.partialCount}</div>
                <div className="text-sm text-gray-500">部分匹配</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{selectedTask.notFoundCount}</div>
                <div className="text-sm text-gray-500">未找到</div>
              </div>
            </div>

            {selectedTask.items && selectedTask.items.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">型号</th>
                      <th className="px-4 py-2 text-left">品牌</th>
                      <th className="px-4 py-2 text-right">数量</th>
                      <th className="px-4 py-2 text-right">目标价</th>
                      <th className="px-4 py-2 text-right">匹配价格</th>
                      <th className="px-4 py-2 text-center">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTask.items.map((item, index) => (
                      <tr key={index} className="border-t border-gray-200">
                        <td className="px-4 py-2">{item.model}</td>
                        <td className="px-4 py-2">{item.brand || '-'}</td>
                        <td className="px-4 py-2 text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-right">{item.targetPrice ? `¥${item.targetPrice}` : '-'}</td>
                        <td className="px-4 py-2 text-right">{item.matchedPrice ? `¥${item.matchedPrice}` : '-'}</td>
                        <td className="px-4 py-2 text-center">
                          {item.matchStatus === 'matched' && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">已匹配</span>
                          )}
                          {item.matchStatus === 'partial' && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">部分匹配</span>
                          )}
                          {item.matchStatus === 'not_found' && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">未找到</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              {selectedTask.status === 'completed' && (
                <button
                  onClick={() => handleDownloadResult(selectedTask.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  下载结果
                </button>
              )}
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 任务列表 */}
      <h3 className="font-semibold text-gray-900 mb-3">导入历史</h3>
      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无导入记录</div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">{task.fileName}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(task.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  匹配: {task.matchedCount}/{task.totalCount}
                </div>
                {getStatusBadge(task.status)}
                <button
                  onClick={() => viewTaskDetail(task.id)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                >
                  查看
                </button>
                {task.status === 'completed' && (
                  <button
                    onClick={() => handleDownloadResult(task.id)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
