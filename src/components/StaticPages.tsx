import React from 'react';
import { X, ShieldCheck, Building2, Users, FileText, Phone, Mail, MapPin, Clock, ChevronRight } from 'lucide-react';
import { useSystemConfig } from '../hooks/useSystemConfig';

interface StaticPageProps {
  page: 'about' | 'rules' | 'contact' | 'privacy' | 'terms';
  onClose: () => void;
}

// 关于我们页面
const AboutUsPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { config } = useSystemConfig();

  return (
    <div className="fixed inset-0 z-[100] bg-exchange-surface overflow-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">关于我们</h1>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-exchange-dark to-gray-800 rounded-2xl p-8 text-white mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-exchange-accent rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">{config.siteName}</h2>
              <p className="text-gray-300 text-lg mt-1">Core Trading Center</p>
            </div>
          </div>
          <p className="text-xl text-gray-200 leading-relaxed">
            {config.siteDescription}
          </p>
        </div>

        {/* Core Values */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">核心价值</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">专注制造业</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                只服务真实生产需求，拒绝贸易商层层加价。我们严格审核供应商资质，确保每笔交易都来自真正的生产制造企业。
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">匿名交易</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                创新的双盲交易模式，保护供应商商业机密。系统自动分配随机代码，防止买家跳单追踪。
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">官方担保</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                平台担保交易，CNAS质检中心验货。所有货物经过专业检测后发货，确保原厂正品。
              </p>
            </div>
          </div>
        </div>

        {/* Platform Features */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">平台特色</h3>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
              <div className="p-6">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-exchange-accent text-white text-sm rounded-full flex items-center justify-center">1</span>
                  资金安全
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-exchange-accent mt-0.5 flex-shrink-0" />
                    <span>平台Escrow监管账户，资金安全有保障</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-exchange-accent mt-0.5 flex-shrink-0" />
                    <span>买家确认收货后，平台才向卖家结算货款</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-exchange-accent mt-0.5 flex-shrink-0" />
                    <span>支持对公账户交易，提供完整发票</span>
                  </li>
                </ul>
              </div>

              <div className="p-6">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-exchange-accent text-white text-sm rounded-full flex items-center justify-center">2</span>
                  质量保障
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-exchange-accent mt-0.5 flex-shrink-0" />
                    <span>CNAS认证质检实验室，专业设备检测</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-exchange-accent mt-0.5 flex-shrink-0" />
                    <span>原厂正品保证，假一赔十</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-exchange-accent mt-0.5 flex-shrink-0" />
                    <span>质检报告随货发出，品质可追溯</span>
                  </li>
                </ul>
              </div>

              <div className="p-6">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-exchange-accent text-white text-sm rounded-full flex items-center justify-center">3</span>
                  交易透明
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-exchange-accent mt-0.5 flex-shrink-0" />
                    <span>实时订单状态跟踪，物流信息透明</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-exchange-accent mt-0.5 flex-shrink-0" />
                    <span>议价机制公开，买卖双方直接沟通</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-exchange-accent mt-0.5 flex-shrink-0" />
                    <span>完整的交易记录，便于财务对账</span>
                  </li>
                </ul>
              </div>

              <div className="p-6">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-exchange-accent text-white text-sm rounded-full flex items-center justify-center">4</span>
                  服务专业
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-exchange-accent mt-0.5 flex-shrink-0" />
                    <span>专业客服团队，7×24小时在线服务</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-exchange-accent mt-0.5 flex-shrink-0" />
                    <span>API开放平台，支持系统对接</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-exchange-accent mt-0.5 flex-shrink-0" />
                    <span>BOM配单服务，一站式采购</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-4">公司信息</h3>
          <p className="text-gray-600 mb-6">
            芯核交易平台由{config.companyName}运营，是一家专注于电子元器件交易的科技企业。
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
            <div>
              <div className="font-bold text-gray-900">成立时间</div>
              <div>{config.foundedYear}年</div>
            </div>
            <div>
              <div className="font-bold text-gray-900">注册资本</div>
              <div>{config.registeredCapital}</div>
            </div>
            <div>
              <div className="font-bold text-gray-900">员工规模</div>
              <div>{config.employeeCount}</div>
            </div>
            <div>
              <div className="font-bold text-gray-900">服务客户</div>
              <div>{config.customerCount} 企业</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 平台规则页面
const PlatformRulesPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeSection, setActiveSection] = React.useState<string>('positioning');

  const sections = [
    { id: 'positioning', title: '平台定位' },
    { id: 'seller-rules', title: '供应商规则' },
    { id: 'buyer-rules', title: '购买方规则' },
    { id: 'guarantee', title: '平台担保' },
    { id: 'payment', title: '支付规则' },
    { id: 'dispute', title: '纠纷处理' },
  ];

  // 滚动到指定区域
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-exchange-surface overflow-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">平台规则</h1>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* 左侧导航 */}
          <div className="w-56 flex-shrink-0 hidden md:block">
            <div className="sticky top-24 bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">快速导航</div>
              <nav className="space-y-1">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? 'bg-exchange-accent text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* 右侧内容 */}
          <div className="flex-1">
            {/* 平台定位 */}
            <div id="positioning" className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-exchange-accent" />
                一、平台定位
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-600 leading-relaxed mb-4">
                  <strong>芯核交易中心</strong> 是专注于电子元器件的B2B交易平台，致力于为生产制造业提供安全、透明、高效的库存流转服务。
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-blue-800 font-bold mb-2">
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded uppercase">To B 为主</span>
                    专业电子元器件交易平台
                  </div>
                  <p className="text-sm text-blue-700">
                    平台主要面向企业用户，提供专业的电子元器件交易服务。
                  </p>
                </div>
              </div>
            </div>

            {/* 供应商规则 */}
            <div id="seller-rules" className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-exchange-accent" />
                二、供应商规则
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">准入资格</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 border-b">条件</th>
                          <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 border-b">说明</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">企业类型</td>
                          <td className="px-4 py-3 text-sm text-gray-600">仅限生产制造业企业</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">证明材料</td>
                          <td className="px-4 py-3 text-sm text-gray-600">营业执照、生产许可证</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">审核周期</td>
                          <td className="px-4 py-3 text-sm text-gray-600">1-3个工作日</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm font-medium flex items-center gap-2">
                      <span className="text-red-500">❌</span>
                      不接受：贸易商、经销商、个人卖家
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">匿名保护机制</h3>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="text-sm font-mono space-y-2">
                      <div className="flex items-center gap-4">
                        <span className="text-gray-500">原始公司名</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-gray-900 font-bold">匿名展示</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-600">XX电子有限公司</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-exchange-accent font-bold">SLR-A7K3</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-600">YY半导体科技</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-exchange-accent font-bold">SLR-B9M2</span>
                      </div>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-exchange-accent mt-0.5 flex-shrink-0" />
                      <span>系统自动分配随机代码</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-exchange-accent mt-0.5 flex-shrink-0" />
                      <span>每次交易后重新生成</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-exchange-accent mt-0.5 flex-shrink-0" />
                      <span>防止买家跳单追踪</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 购买方规则 */}
            <div id="buyer-rules" className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-exchange-accent" />
                三、购买方规则
              </h2>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">开放注册类型</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 border-b">类型</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 border-b">准入要求</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 border-b">说明</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">制造商</td>
                        <td className="px-4 py-3 text-sm text-gray-600">企业认证</td>
                        <td className="px-4 py-3 text-sm text-gray-600">可开具发票</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">贸易商</td>
                        <td className="px-4 py-3 text-sm text-gray-600">企业认证</td>
                        <td className="px-4 py-3 text-sm text-gray-600">可开具发票</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">个人</td>
                        <td className="px-4 py-3 text-sm text-gray-600">身份认证</td>
                        <td className="px-4 py-3 text-sm text-gray-600">不开票交易</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 平台担保 */}
            <div id="guarantee" className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-exchange-accent" />
                四、平台担保
              </h2>

              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-bold text-green-800 mb-2">资金安全</h3>
                  <p className="text-sm text-green-700">
                    买家付款后，资金暂存在平台监管账户。只有在买家确认收货后，资金才会划转给卖家。
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-blue-800 mb-2">质量保障</h3>
                  <p className="text-sm text-blue-700">
                    所有货物必须发往平台CNAS认证质检中心进行检验。只有通过质检的货物才会发往买家。
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-bold text-purple-800 mb-2">交易透明</h3>
                  <p className="text-sm text-purple-700">
                    全程订单跟踪，物流信息实时更新。买卖双方可随时查看交易状态。
                  </p>
                </div>
              </div>
            </div>

            {/* 支付规则 */}
            <div id="payment" className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">五、支付规则</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">个人用户</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-exchange-accent mt-0.5 flex-shrink-0" />
                      <span>支持支付宝、微信支付</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-exchange-accent mt-0.5 flex-shrink-0" />
                      <span>不开具发票</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">企业用户</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-exchange-accent mt-0.5 flex-shrink-0" />
                      <span>支持对公账户转账</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-exchange-accent mt-0.5 flex-shrink-0" />
                      <span>提供完整发票（增值税普通发票/专用发票）</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-exchange-accent mt-0.5 flex-shrink-0" />
                      <span>需提供企业开票资料</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 纠纷处理 */}
            <div id="dispute" className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">六、纠纷处理</h2>

              <div className="space-y-4 text-sm text-gray-600">
                <p>如发生交易纠纷，平台将按照以下流程处理：</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>买卖双方首先通过平台协商解决</li>
                  <li>协商不成的，可申请平台介入调解</li>
                  <li>平台将根据交易记录、质检报告等证据进行裁决</li>
                  <li>对平台裁决结果有异议的，可通过法律途径解决</li>
                </ol>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <p className="text-yellow-800">
                    <strong>注意：</strong>买卖双方承诺不私下联系进行场外交易（跳单行为）。一旦发现跳单行为，平台有权对相关账号进行处罚，包括但不限于信用扣分、账号封禁。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 联系我们页面
const ContactUsPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { config } = useSystemConfig();

  return (
    <div className="fixed inset-0 z-[100] bg-exchange-surface overflow-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">联系我们</h1>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* 联系信息 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">联系方式</h2>

            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">客服热线</h3>
                    <p className="text-2xl font-mono text-exchange-accent">{config.contactPhone}</p>
                    <p className="text-sm text-gray-500 mt-1">7×24小时服务</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">电子邮箱</h3>
                    <p className="text-lg text-gray-600">{config.contactEmail}</p>
                    {config.businessEmail && (
                      <p className="text-sm text-gray-500 mt-1">商务合作：{config.businessEmail}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">公司地址</h3>
                    <p className="text-gray-600">{config.address}</p>
                    {config.labInfo && (
                      <p className="text-sm text-gray-500 mt-1">{config.labInfo}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">工作时间</h3>
                    <p className="text-gray-600">周一至周五 9:00 - 18:00</p>
                    <p className="text-sm text-gray-500 mt-1">周末及节假日：仅接受在线留言</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 留言表单 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">在线留言</h2>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    公司名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-exchange-accent outline-none"
                    placeholder="请输入公司名称"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    联系人 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-exchange-accent outline-none"
                    placeholder="请输入联系人姓名"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    联系电话 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-exchange-accent outline-none"
                    placeholder="请输入联系电话"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    电子邮箱
                  </label>
                  <input
                    type="email"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-exchange-accent outline-none"
                    placeholder="请输入电子邮箱"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    咨询类型
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-exchange-accent outline-none bg-white">
                    <option value="">请选择咨询类型</option>
                    <option value="purchase">采购咨询</option>
                    <option value="supply">供应商入驻</option>
                    <option value="technical">技术支持</option>
                    <option value="complaint">投诉建议</option>
                    <option value="cooperation">商务合作</option>
                    <option value="other">其他</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    留言内容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-exchange-accent outline-none resize-none"
                    placeholder="请输入您的留言内容..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-exchange-dark text-white font-bold rounded-lg hover:bg-exchange-accent transition-colors"
                >
                  提交留言
                </button>

                <p className="text-xs text-gray-500 text-center">
                  提交后，我们将在1个工作日内与您联系
                </p>
              </form>
            </div>

            {/* 二维码区域 */}
            <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-4 text-center">关注我们</h3>
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-gray-400 text-xs">微信公众号</span>
                  </div>
                  <p className="text-xs text-gray-500">官方公众号</p>
                </div>
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-gray-400 text-xs">小程序</span>
                  </div>
                  <p className="text-xs text-gray-500">微信小程序</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 隐私政策页面
const PrivacyPolicyPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { config } = useSystemConfig();

  return (
    <div className="fixed inset-0 z-[100] bg-exchange-surface overflow-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">隐私政策</h1>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <div className="prose prose-gray max-w-none">
            <p className="text-sm text-gray-500 mb-6">更新日期：2026年6月13日 | 生效日期：2026年6月13日</p>

            <h2 className="text-xl font-bold text-gray-900 mb-4">引言</h2>
            <p className="text-gray-600 mb-6">
              欢迎您使用{config.siteName}！我们深知个人信息对您的重要性，我们将按照法律法规要求，采取相应安全保护措施，尽力保护您的个人信息安全可控。
              本隐私政策旨在向您说明我们如何收集、使用、存储、共享和保护您的个人信息，以及您享有的相关权利。
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-4">一、我们收集的信息</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-gray-900 mb-3">1. 账户注册信息</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm">
                <li>企业名称、统一社会信用代码</li>
                <li>联系人姓名、联系电话、电子邮箱</li>
                <li>营业执照、法人身份证信息（用于企业认证）</li>
                <li>银行账户信息（用于资金结算）</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-gray-900 mb-3">2. 交易信息</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm">
                <li>订单信息：商品型号、数量、价格、订单状态</li>
                <li>支付信息：支付方式、支付金额、支付时间</li>
                <li>物流信息：收货地址、物流单号、物流状态</li>
                <li>发票信息：发票抬头、税号、开票金额</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-gray-900 mb-3">3. 设备与日志信息</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm">
                <li>设备型号、操作系统、浏览器类型</li>
                <li>IP地址、访问时间、访问页面</li>
                <li>操作日志、搜索记录</li>
              </ul>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-4">二、我们如何使用您的信息</h2>
            <ul className="list-decimal list-inside text-gray-600 space-y-2 mb-6">
              <li><strong>提供交易服务</strong>：处理订单、支付结算、物流配送</li>
              <li><strong>身份认证</strong>：验证企业资质，确保交易安全</li>
              <li><strong>客户服务</strong>：处理咨询、投诉、售后问题</li>
              <li><strong>安全保障</strong>：防范欺诈、洗钱等违法行为</li>
              <li><strong>服务改进</strong>：分析用户需求，优化产品功能</li>
              <li><strong>法律合规</strong>：履行法律法规规定的义务</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mb-4">三、信息共享</h2>
            <p className="text-gray-600 mb-4">我们仅在以下情况下会共享您的个人信息：</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
              <li><strong>交易必要</strong>：向卖家/买家展示必要的交易信息（采用匿名Hash保护身份）</li>
              <li><strong>服务合作方</strong>：支付机构、物流公司、质检机构</li>
              <li><strong>法律要求</strong>：根据法律法规或政府部门的强制性要求</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mb-4">四、信息存储与保护</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
              <li>我们的服务器位于中国境内，数据存储于境内数据中心</li>
              <li>采用加密技术（HTTPS、数据加密存储）保护数据传输和存储安全</li>
              <li>建立严格的数据访问权限控制和审计机制</li>
              <li>定期进行安全测试和漏洞修复</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mb-4">五、您的权利</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <ul className="list-disc list-inside text-blue-800 space-y-2 text-sm">
                <li><strong>访问权</strong>：您可以在"个人中心"查看您的个人信息</li>
                <li><strong>更正权</strong>：您可以修改不准确的个人信息</li>
                <li><strong>删除权</strong>：您可以申请删除您的账户及相关信息</li>
                <li><strong>撤回同意权</strong>：您可以撤回之前给予的授权同意</li>
                <li><strong>注销账户</strong>：您可以申请注销账户，请联系客服处理</li>
              </ul>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-4">六、Cookie使用说明</h2>
            <p className="text-gray-600 mb-6">
              我们使用Cookie和类似技术来提供、保护和改进我们的服务。Cookie可以帮助您免于重复输入信息，
              实现自动登录等功能。您可以通过浏览器设置管理Cookie，但这可能影响您使用我们的部分功能。
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-4">七、未成年人保护</h2>
            <p className="text-gray-600 mb-6">
              我们的服务主要面向企业用户，不向未满18周岁的未成年人提供服务。如果您是未成年人，
              请在监护人的陪同下阅读本政策，并在获得监护人同意后使用我们的服务。
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-4">八、隐私政策的更新</h2>
            <p className="text-gray-600 mb-6">
              我们可能会不时更新本隐私政策。更新后的政策将在本页面发布，重大变更将通过站内信、
              邮件等方式通知您。建议您定期查阅本政策，以了解我们如何保护您的信息。
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-4">九、联系我们</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600 mb-2">如果您对本隐私政策有任何疑问或建议，请通过以下方式联系我们：</p>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>客服热线：{config.contactPhone}</li>
                <li>电子邮箱：{config.privacyEmail || config.contactEmail}</li>
                <li>公司地址：{config.address}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 用户协议页面
const UserTermsPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { config } = useSystemConfig();

  return (
    <div className="fixed inset-0 z-[100] bg-exchange-surface overflow-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">用户服务协议</h1>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <div className="prose prose-gray max-w-none">
            <p className="text-sm text-gray-500 mb-6">更新日期：2026年6月13日 | 生效日期：2026年6月13日</p>

            <h2 className="text-xl font-bold text-gray-900 mb-4">重要提示</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                <strong>请您在使用{config.siteName}服务前，仔细阅读并充分理解本协议。</strong>
                一旦您注册成为平台用户或使用平台服务，即表示您已阅读并同意接受本协议的约束。
                如您不同意本协议的任何条款，请勿注册或使用本平台服务。
              </p>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-4">一、协议范围</h2>
            <p className="text-gray-600 mb-4">1.1 本协议是您与{config.siteName}（以下简称"平台"）之间关于使用平台服务所订立的协议。</p>
            <p className="text-gray-600 mb-6">1.2 本协议内容包括协议正文及平台已经发布或将来可能发布的各类规则，所有规则为本协议不可分割的一部分。</p>

            <h2 className="text-xl font-bold text-gray-900 mb-4">二、账户注册与使用</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-gray-900 mb-3">2.1 注册资格</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm">
                <li>仅限依法成立的企业法人或其他组织注册使用</li>
                <li>需提供真实、准确、完整的企业信息</li>
                <li>同一企业只能注册一个账户</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-gray-900 mb-3">2.2 账户安全</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm">
                <li>您有责任妥善保管账户密码，因密码泄露造成的损失由您自行承担</li>
                <li>如发现账户被盗用，应立即通知平台</li>
                <li>不得将账户转让、出借给他人使用</li>
              </ul>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-4">三、服务内容</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
              <li>电子元器件库存发布与搜索</li>
              <li>在线询价、议价与订单管理</li>
              <li>担保交易与资金结算</li>
              <li>质量检测与物流跟踪</li>
              <li>发票管理与售后支持</li>
              <li>API开放平台接入</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mb-4">四、用户行为规范</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-red-800 mb-3">您承诺不得从事以下行为：</h3>
              <ul className="list-disc list-inside text-red-700 space-y-2 text-sm">
                <li>发布虚假、欺诈性商品信息</li>
                <li>销售假冒伪劣、侵权商品</li>
                <li>从事洗钱、非法集资等违法活动</li>
                <li>恶意竞争、诋毁其他用户声誉</li>
                <li>利用平台漏洞谋取不当利益</li>
                <li>违反国家法律法规的其他行为</li>
              </ul>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-4">五、交易规则</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-gray-900 mb-3">5.1 担保交易</h3>
              <p className="text-gray-600 text-sm mb-3">
                平台采用担保交易模式，买家付款后资金由平台托管，买家确认收货后平台向卖家结算。
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-gray-900 mb-3">5.2 质量保障</h3>
              <p className="text-gray-600 text-sm mb-3">
                所有交易商品均需通过平台质检中心检测。如质检不合格，订单将取消并退款给买家。
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-gray-900 mb-3">5.3 纠纷处理</h3>
              <p className="text-gray-600 text-sm mb-3">
                如发生交易纠纷，双方应友好协商解决。协商不成的，可申请平台介入调解。
                平台将根据交易记录、聊天记录等证据进行裁决。
              </p>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-4">六、知识产权</h2>
            <p className="text-gray-600 mb-6">
              平台的所有内容（包括但不限于文字、软件、图片、视频、数据、商标等）均为平台或其许可方所有。
              未经书面授权，您不得复制、修改、传播或用于商业目的。
            </p>

            <h2 className="text-xl font-bold text-gray-900 mb-4">七、免责条款</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
              <li>因不可抗力导致的服务中断，平台不承担责任</li>
              <li>因用户自身原因造成的损失，平台不承担责任</li>
              <li>因第三方原因（如支付机构、物流公司）造成的损失，平台将协助用户维权</li>
              <li>平台对服务的及时性、安全性不作绝对保证</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mb-4">八、协议变更与终止</h2>
            <p className="text-gray-600 mb-4">8.1 平台有权根据业务需要修改本协议，修改后的协议将在平台公布。</p>
            <p className="text-gray-600 mb-6">8.2 如您不同意修改后的协议，可选择停止使用平台服务。继续使用则视为您接受修改后的协议。</p>

            <h2 className="text-xl font-bold text-gray-900 mb-4">九、法律适用与争议解决</h2>
            <p className="text-gray-600 mb-4">9.1 本协议的签订、履行、解释均适用中华人民共和国法律。</p>
            <p className="text-gray-600 mb-6">9.2 因本协议产生的争议，双方应友好协商解决；协商不成的，应向平台所在地人民法院提起诉讼。</p>

            <h2 className="text-xl font-bold text-gray-900 mb-4">十、联系我们</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600 mb-2">如您对本协议有任何疑问，请通过以下方式联系我们：</p>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>客服热线：{config.contactPhone}</li>
                <li>电子邮箱：{config.legalEmail || config.contactEmail}</li>
                <li>公司地址：{config.address}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 主组件
export const StaticPages: React.FC<StaticPageProps> = ({ page, onClose }) => {
  switch (page) {
    case 'about':
      return <AboutUsPage onClose={onClose} />;
    case 'rules':
      return <PlatformRulesPage onClose={onClose} />;
    case 'contact':
      return <ContactUsPage onClose={onClose} />;
    case 'privacy':
      return <PrivacyPolicyPage onClose={onClose} />;
    case 'terms':
      return <UserTermsPage onClose={onClose} />;
    default:
      return null;
  }
};

export default StaticPages;
