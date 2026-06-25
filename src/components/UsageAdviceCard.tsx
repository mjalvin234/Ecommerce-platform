import React, { useState } from 'react';
import { getApiUrl } from '../config/api';

interface UsageAdvice {
  category: string;
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
}

interface ChipAdvice {
  overallStatus: 'excellent' | 'good' | 'fair' | 'caution';
  advice: UsageAdvice[];
  recommendations: string[];
}

export const UsageAdviceCard: React.FC<{
  brand: string;
  model: string;
  year: number;
  quantity: number;
}> = ({ brand, model, year, quantity }) => {
  const [advice, setAdvice] = useState<ChipAdvice | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAdvice = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        getApiUrl(`advice/usage/dummy?brand=${brand}&model=${model}&year=${year}&quantity=${quantity}`),
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAdvice(data);
      }
    } catch (error) {
      // 使用模拟数据
      const chipAge = new Date().getFullYear() - year;
      let overallStatus: 'excellent' | 'good' | 'fair' | 'caution';

      if (chipAge <= 2) {
        overallStatus = 'excellent';
      } else if (chipAge <= 5) {
        overallStatus = 'good';
      } else if (chipAge <= 10) {
        overallStatus = 'fair';
      } else {
        overallStatus = 'caution';
      }

      setAdvice({
        overallStatus,
        advice: [
          {
            category: 'storage',
            title: '存储条件建议',
            content: '温度: -40°C ~ 85°C，湿度: < 60%。建议使用干燥剂存储，避免阳光直射。',
            priority: 'high',
          },
          {
            category: 'usage',
            title: '使用建议',
            content: chipAge > 5
              ? '建议使用前进行抽样测试，焊接前检查引脚状态。'
              : '芯片状态良好，可正常使用。建议遵循标准焊接工艺。',
            priority: chipAge > 5 ? 'medium' : 'low',
          },
          ...(chipAge > 5 ? [{
            category: 'warning',
            title: '芯片年限提醒',
            content: `此批次芯片已生产 ${chipAge} 年。建议进行老化测试后再投入使用。`,
            priority: chipAge > 10 ? 'high' : 'medium' as const,
          }] : []),
        ],
        recommendations: [
          chipAge <= 3 ? '芯片状态优秀，可放心使用' :
          chipAge <= 7 ? '芯片状态良好，建议按规范使用' :
          '建议谨慎使用，优先用于非关键场景',
          '建议遵循标准焊接工艺',
          ...(chipAge > 5 ? ['建议进行100%功能测试'] : []),
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (brand && model && year) {
      fetchAdvice();
    }
  }, [brand, model, year, quantity]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-100';
      case 'good':
        return 'text-blue-600 bg-blue-100';
      case 'fair':
        return 'text-yellow-600 bg-yellow-100';
      case 'caution':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'excellent':
        return '优秀';
      case 'good':
        return '良好';
      case 'fair':
        return '一般';
      case 'caution':
        return '需注意';
      default:
        return '未知';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '⚠️';
      case 'low':
        return 'ℹ️';
      default:
        return '📌';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-500">加载使用建议...</p>
      </div>
    );
  }

  if (!advice) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <span>💡</span>
          使用建议
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
            advice.overallStatus
          )}`}
        >
          {getStatusText(advice.overallStatus)}
        </span>
      </div>

      {/* 芯片信息 */}
      <div className="text-sm text-gray-600 mb-4">
        {brand} {model} · {year}年 · {quantity}件
      </div>

      {/* 建议列表 */}
      <div className="space-y-3 mb-4">
        {advice.advice.map((item, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg ${
              item.priority === 'high'
                ? 'bg-red-50 border border-red-200'
                : item.priority === 'medium'
                ? 'bg-yellow-50 border border-yellow-200'
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            <div className="flex items-start gap-2">
              <span>{getPriorityIcon(item.priority)}</span>
              <div>
                <p className="font-medium text-gray-800">{item.title}</p>
                <p className="text-sm text-gray-600 mt-1">{item.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 推荐措施 */}
      <div className="border-t border-gray-200 pt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">推荐措施:</p>
        <ul className="space-y-1">
          {advice.recommendations.map((rec, index) => (
            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
              <span className="text-green-500">✓</span>
              {rec}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UsageAdviceCard;
