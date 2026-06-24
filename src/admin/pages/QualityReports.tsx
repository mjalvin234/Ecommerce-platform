/**
 * 质检报告页面 - 现代化改造版
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileCheck,
  RefreshCw,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  X,
  FileText,
  Printer,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../api/client';
import { DataTable, Column, KPICard } from '../../components/admin-ui';

// ═══════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════

interface QualityReport {
  id: string;
  orderNo: string;
  partNumber: string;
  quantity: number;
  seller?: string;
  buyer?: string;
  status: string;
  createdAt: string;
  testResult?: {
    visual: string;
    electrical: string;
    packaging: string;
  };
  notes?: string;
}

interface QualityReportsProps {
  showToast: (msg: string) => void;
}

// ═══════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════

export const QualityReports: React.FC<QualityReportsProps> = ({ showToast }) => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<QualityReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<QualityReport | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = (await api.getQaOrders('passed')) as any;
      const qaOrders: any[] = result.orders || result.items || result || [];

      const reportsData = qaOrders.map((order: any) => ({
        id: order.id,
        orderNo: order.orderNo || order.id?.slice(0, 8),
        partNumber: order.partNumber || order.inventory?.partNumber,
        quantity: order.quantity,
        seller: order.seller?.companyName,
        buyer: order.buyer?.companyName,
        status: order.qaStatus || 'passed',
        createdAt: order.completedAt || order.createdAt,
        testResult: order.testResult || {
          visual: '通过',
          electrical: '通过',
          packaging: '通过',
        },
        notes: order.qaNotes || '',
      }));

      setReports(reportsData);
    } catch (err) {
      console.error('加载质检报告失败:', err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 下载报告
  const handleDownload = async (report: QualityReport) => {
    setDownloading(report.id);
    try {
      const reportContent = generateReportContent(report);
      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `质检报告-${report.orderNo}-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('报告已下载');
    } catch (err) {
      showToast('下载失败');
    } finally {
      setDownloading(null);
    }
  };

  // 打印报告
  const handlePrint = (report: QualityReport) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('请允许弹出窗口');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>质检报告 - ${report.orderNo}</title>
        <style>
          body { font-family: 'Microsoft YaHei', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; }
          .subtitle { color: #666; margin-top: 5px; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; font-size: 16px; border-left: 3px solid #2563EB; padding-left: 10px; margin-bottom: 10px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .item { padding: 8px 0; border-bottom: 1px solid #eee; }
          .label { color: #666; font-size: 12px; }
          .value { font-weight: 500; }
          .status-pass { color: #10B981; }
          .status-fail { color: #EF4444; }
          .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">电子元器件质检报告</div>
          <div class="subtitle">报告编号: ${report.orderNo}</div>
        </div>

        <div class="section">
          <div class="section-title">基本信息</div>
          <div class="grid">
            <div class="item"><span class="label">型号</span><br><span class="value">${report.partNumber}</span></div>
            <div class="item"><span class="label">数量</span><br><span class="value">${report.quantity}</span></div>
            <div class="item"><span class="label">供应商</span><br><span class="value">${report.seller || '-'}</span></div>
            <div class="item"><span class="label">采购商</span><br><span class="value">${report.buyer || '-'}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">检测结果</div>
          <div class="grid">
            <div class="item"><span class="label">外观检测</span><br><span class="value ${report.testResult?.visual === '通过' ? 'status-pass' : 'status-fail'}">${report.testResult?.visual || '通过'}</span></div>
            <div class="item"><span class="label">电性能检测</span><br><span class="value ${report.testResult?.electrical === '通过' ? 'status-pass' : 'status-fail'}">${report.testResult?.electrical || '通过'}</span></div>
            <div class="item"><span class="label">包装检测</span><br><span class="value ${report.testResult?.packaging === '通过' ? 'status-pass' : 'status-fail'}">${report.testResult?.packaging || '通过'}</span></div>
          </div>
        </div>

        <div class="footer">
          <p>报告生成时间: ${new Date().toLocaleString('zh-CN')}</p>
          <p>芯核交易中心 · 质检中心</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  // 统计
  const stats = {
    total: reports.length,
    passed: reports.filter((r) => r.status === 'passed').length,
    visualPass: reports.filter((r) => r.testResult?.visual === '通过').length,
    electricalPass: reports.filter((r) => r.testResult?.electrical === '通过').length,
  };

  // 表格列定义
  const columns: Column<QualityReport>[] = [
    {
      key: 'orderNo',
      title: '订单号',
      width: 140,
      render: (_, r) => <span className="font-mono text-sm">{r.orderNo}</span>,
    },
    {
      key: 'product',
      title: '商品',
      render: (_, r) => (
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{r.partNumber}</div>
          <div className="text-xs text-gray-500">x{r.quantity}</div>
        </div>
      ),
    },
    {
      key: 'seller',
      title: '供应商',
      hideOnMobile: true,
      render: (_, r) => <span className="text-sm text-gray-600 truncate block">{r.seller || '-'}</span>,
    },
    {
      key: 'result',
      title: '检测结果',
      width: 160,
      render: (_, r) => (
        <div className="flex items-center gap-2">
          {r.testResult?.visual === '通过' ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
          {r.testResult?.electrical === '通过' ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
          {r.testResult?.packaging === '通过' ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: 140,
      align: 'right',
      render: (_, r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedReport(r);
            }}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="查看详情"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrint(r);
            }}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="打印"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(r);
            }}
            disabled={downloading === r.id}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            title="下载"
          >
            {downloading === r.id ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
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
          <h1 className="text-2xl font-bold text-gray-900">质检报告</h1>
          <p className="text-gray-500 mt-1 text-sm">查看和下载质检报告</p>
        </div>
        <button onClick={loadData} disabled={loading} className="admin-btn admin-btn-secondary">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* KPI 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="报告总数"
          value={stats.total.toString()}
          icon={<FileCheck className="w-5 h-5" />}
          color="blue"
        />
        <KPICard
          title="通过报告"
          value={stats.passed.toString()}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
        <KPICard
          title="外观通过"
          value={stats.visualPass.toString()}
          icon={<CheckCircle className="w-5 h-5" />}
          color="purple"
        />
        <KPICard
          title="电性能通过"
          value={stats.electricalPass.toString()}
          icon={<CheckCircle className="w-5 h-5" />}
          color="orange"
        />
      </div>

      {/* 数据表格 */}
      <DataTable
        data={reports}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyText="暂无质检报告"
      />

      {/* 详情弹窗 */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedReport(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">质检报告详情</h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-1">订单号</div>
                  <div className="font-mono font-bold text-lg">{selectedReport.orderNo}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-500 mb-1">型号</div>
                    <div className="font-medium">{selectedReport.partNumber}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-500 mb-1">数量</div>
                    <div className="font-mono font-bold text-lg">{selectedReport.quantity}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-500 mb-1">供应商</div>
                    <div className="text-sm">{selectedReport.seller || '-'}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-500 mb-1">采购商</div>
                    <div className="text-sm">{selectedReport.buyer || '-'}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 mb-3">检测结果</div>
                  <div className="space-y-2">
                    {[
                      { label: '外观检测', value: selectedReport.testResult?.visual },
                      { label: '电性能检测', value: selectedReport.testResult?.electrical },
                      { label: '包装检测', value: selectedReport.testResult?.packaging },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">{item.label}</span>
                        <span
                          className={`text-sm font-medium ${
                            item.value === '通过' ? 'text-green-600' : 'text-red-500'
                          }`}
                        >
                          {item.value || '通过'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="admin-btn admin-btn-secondary flex-1"
                >
                  关闭
                </button>
                <button
                  onClick={() => handlePrint(selectedReport)}
                  className="admin-btn admin-btn-secondary flex-1"
                >
                  <Printer className="w-4 h-4" />
                  打印
                </button>
                <button
                  onClick={() => handleDownload(selectedReport)}
                  className="admin-btn admin-btn-primary flex-1"
                >
                  <Download className="w-4 h-4" />
                  下载
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 生成报告内容
// ═══════════════════════════════════════════════════════════════

function generateReportContent(report: QualityReport): string {
  return `
═══════════════════════════════════════
       电子元器件质检报告
═══════════════════════════════════════

报告编号: ${report.orderNo}
生成时间: ${new Date().toLocaleString('zh-CN')}

───────────────────────────────────────
基本信息
───────────────────────────────────────
型号: ${report.partNumber}
数量: ${report.quantity}
供应商: ${report.seller || '-'}
采购商: ${report.buyer || '-'}

───────────────────────────────────────
检测结果
───────────────────────────────────────
外观检测: ${report.testResult?.visual || '通过'}
电性能检测: ${report.testResult?.electrical || '通过'}
包装检测: ${report.testResult?.packaging || '通过'}

${report.notes ? `备注: ${report.notes}` : ''}

═══════════════════════════════════════
芯核交易中心 · 质检中心
═══════════════════════════════════════
`;
}

export default QualityReports;
