import React, { useState } from 'react';

interface DeliveryEstimate {
  totalDays: number;
  estimatedDate: string;
  stages: {
    sellerToQA: { days: number; date: string };
    qaInspection: { days: number; date: string };
    qaToBuyer: { days: number; date: string };
  };
  notes: string[];
}

export const DeliveryEstimator: React.FC = () => {
  const [formData, setFormData] = useState({
    sellerAddress: '',
    buyerAddress: '',
    carrier: '',
    inventoryBrand: '',
    inventoryYear: '',
    quantity: 1,
  });
  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? Number(value) : value,
    }));
  };

  const calculateEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/advice/delivery-estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setEstimate(data);
      }
    } catch (error) {
      // 使用模拟数据
      setEstimate({
        totalDays: 7,
        estimatedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        stages: {
          sellerToQA: { days: 2, date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
          qaInspection: { days: 2, date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString() },
          qaToBuyer: { days: 3, date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
        },
        notes: ['芯片状态良好，质检时间为标准时长'],
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>🚚</span>
        交期预估
      </h2>

      <form onSubmit={calculateEstimate} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">卖家地址</label>
            <input
              type="text"
              name="sellerAddress"
              value={formData.sellerAddress}
              onChange={handleChange}
              placeholder="例如：广东省深圳市"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">收货地址 *</label>
            <input
              type="text"
              name="buyerAddress"
              value={formData.buyerAddress}
              onChange={handleChange}
              required
              placeholder="例如：上海市浦东新区"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">快递公司</label>
            <select
              name="carrier"
              value={formData.carrier}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">自动选择</option>
              <option value="顺丰">顺丰速运</option>
              <option value="京东">京东物流</option>
              <option value="中通">中通快递</option>
              <option value="圆通">圆通快递</option>
              <option value="申通">申通快递</option>
              <option value="韵达">韵达快递</option>
              <option value="EMS">EMS</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">芯片品牌</label>
            <input
              type="text"
              name="inventoryBrand"
              value={formData.inventoryBrand}
              onChange={handleChange}
              placeholder="例如：TI、ST、ADI"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">芯片年份</label>
            <input
              type="number"
              name="inventoryYear"
              value={formData.inventoryYear}
              onChange={handleChange}
              placeholder="例如：2024"
              min="1990"
              max={new Date().getFullYear()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">数量</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !formData.buyerAddress}
          className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '计算中...' : '预估交期'}
        </button>
      </form>

      {/* 估算结果 */}
      {estimate && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">预计总交期</p>
            <p className="text-3xl font-bold text-blue-600">{estimate.totalDays} 天</p>
            <p className="text-sm text-gray-500">
              预计完成日期: {formatDate(estimate.estimatedDate)}
            </p>
          </div>

          {/* 流程图 */}
          <div className="flex items-center justify-between my-6">
            <div className="text-center flex-1">
              <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-xl">
                📦
              </div>
              <p className="text-xs mt-1 text-gray-600">卖家发货</p>
              <p className="text-sm font-bold text-blue-600">{estimate.stages.sellerToQA.days}天</p>
            </div>
            <div className="flex-1 h-0.5 bg-blue-300"></div>
            <div className="text-center flex-1">
              <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center text-xl">
                🔍
              </div>
              <p className="text-xs mt-1 text-gray-600">QA质检</p>
              <p className="text-sm font-bold text-green-600">{estimate.stages.qaInspection.days}天</p>
            </div>
            <div className="flex-1 h-0.5 bg-green-300"></div>
            <div className="text-center flex-1">
              <div className="w-12 h-12 mx-auto bg-purple-100 rounded-full flex items-center justify-center text-xl">
                🏠
              </div>
              <p className="text-xs mt-1 text-gray-600">送达买家</p>
              <p className="text-sm font-bold text-purple-600">{estimate.stages.qaToBuyer.days}天</p>
            </div>
          </div>

          {/* 备注 */}
          {estimate.notes.length > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              <p className="font-medium mb-1">备注:</p>
              <ul className="list-disc list-inside">
                {estimate.notes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryEstimator;
