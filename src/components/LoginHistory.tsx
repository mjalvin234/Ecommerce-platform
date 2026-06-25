import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';

interface LoginLog {
  id: string;
  loginTime: string;
  ipAddress: string;
  deviceType: string;
  os: string;
  browser: string;
  location?: string;
  loginStatus: 'success' | 'failed';
  failReason?: string;
}

interface LoginStats {
  totalLogins: number;
  successfulLogins: number;
  failedLogins: number;
  lastLoginTime: string | null;
  lastLoginIP: string | null;
}

export const LoginHistory: React.FC = () => {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [stats, setStats] = useState<LoginStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoginHistory();
    fetchLoginStats();
  }, []);

  const fetchLoginHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('email/login-history?limit=10'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('获取登录历史失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('email/login-stats'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('获取登录统计失败:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return '📱';
      case 'tablet':
        return '📱';
      default:
        return '💻';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span>🔐</span>
          登录安全中心
        </h2>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-gray-200">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-blue-600">{stats.totalLogins}</p>
            <p className="text-xs text-gray-500">总登录次数</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-green-600">{stats.successfulLogins}</p>
            <p className="text-xs text-gray-500">成功登录</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-red-600">{stats.failedLogins}</p>
            <p className="text-xs text-gray-500">失败登录</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-sm font-medium text-purple-600">
              {stats.lastLoginTime ? formatDate(stats.lastLoginTime) : '无记录'}
            </p>
            <p className="text-xs text-gray-500">上次登录</p>
          </div>
        </div>
      )}

      {/* 登录记录列表 */}
      <div className="p-4">
        <h3 className="font-medium text-gray-700 mb-3">最近登录记录</h3>

        {loading ? (
          <div className="text-center py-4 text-gray-500">加载中...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-4 text-gray-500">暂无登录记录</div>
        ) : (
          <div className="space-y-3">
            {logs.map((log, index) => (
              <div
                key={log.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getDeviceIcon(log.deviceType)}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {log.os} · {log.browser}
                      </span>
                      {log.loginStatus === 'success' ? (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                          成功
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                          失败
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      IP: {log.ipAddress}
                      {log.location && ` · ${log.location}`}
                    </p>
                    {log.failReason && (
                      <p className="text-xs text-red-500">{log.failReason}</p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-600">{formatDate(log.loginTime)}</p>
                  {index === 0 && log.loginStatus === 'success' && (
                    <p className="text-xs text-blue-600">当前登录</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 安全提示 */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            ⚠️ 安全提示：如发现异常登录，请立即修改密码并联系客服。
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginHistory;
