import React, { useState, useRef } from 'react';
import { api } from '../api/client';
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, Loader2, History } from 'lucide-react';

interface UploadResult {
  id: string;
  fileName: string;
  totalCount: number;
  successCount: number;
  failCount: number;
  status: string;
  errors?: Array<{ row: number; field: string; message: string }>;
}

interface HistoryItem {
  id: string;
  fileName: string;
  totalCount: number;
  successCount: number;
  failCount: number;
  status: string;
  createdAt: string;
}

export function BatchUpload() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    try {
      const blob = await api.downloadBatchTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '库存导入模板.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('下载模板失败:', err);
      alert('下载模板失败');
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      alert('请上传Excel文件(.xlsx或.xls)');
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const res = await api.uploadBatchInventory(file);
      setResult(res);
      loadHistory();
    } catch (err: any) {
      alert(err.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await api.getBatchUploadHistory();
      setHistory(res.items);
    } catch (err) {
      console.error('加载历史失败:', err);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  useState(() => {
    loadHistory();
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">批量上传库存</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            下载模板
          </button>
          <button
            onClick={() => { setShowHistory(!showHistory); loadHistory(); }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <History className="w-4 h-4" />
            上传历史
          </button>
        </div>
      </div>

      {/* 上传区域 */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">正在上传处理中...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">拖拽文件到此处或点击上传</p>
            <p className="text-sm text-gray-400">支持 .xlsx, .xls 格式</p>
          </div>
        )}
      </div>

      {/* 上传结果 */}
      {result && (
        <div className="mt-6 p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">上传结果</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{result.totalCount}</div>
              <div className="text-sm text-gray-500">总记录数</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-600">
                <CheckCircle className="w-5 h-5" />
                {result.successCount}
              </div>
              <div className="text-sm text-gray-500">成功导入</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-red-600">
                <XCircle className="w-5 h-5" />
                {result.failCount}
              </div>
              <div className="text-sm text-gray-500">导入失败</div>
            </div>
          </div>

          {/* 错误详情 */}
          {result.errors && result.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">错误详情：</h4>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">行号</th>
                      <th className="px-3 py-2 text-left">字段</th>
                      <th className="px-3 py-2 text-left">错误信息</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((err, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2">{err.row}</td>
                        <td className="px-3 py-2">{err.field}</td>
                        <td className="px-3 py-2 text-red-600">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 上传历史 */}
      {showHistory && (
        <div className="mt-6 p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">上传历史</h3>
          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-4">暂无上传记录</p>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{item.fileName}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">
                      成功 <span className="text-green-600 font-medium">{item.successCount}</span>
                    </span>
                    <span className="text-sm">
                      失败 <span className="text-red-600 font-medium">{item.failCount}</span>
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.status === 'completed' ? '已完成' : '处理中'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
