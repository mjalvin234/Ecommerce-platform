import React, { useState, useEffect } from 'react';
import {
  Search, ShieldCheck, ChevronRight, User,
  PackageSearch, Activity, FileText, ArrowRightLeft,
  Bell, Building2, HardDrive, Cpu, X, CheckCircle2,
  Filter, SlidersHorizontal, CreditCard, Truck,
  Check, AlertTriangle, Clock, RefreshCcw, LogOut, Star, Smartphone,
  Package, Users, TrendingDown, DollarSign, Headphones
} from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useSystemConfig } from './hooks/useSystemConfig';
import { AuthPage } from './components/AuthPage';
import { MessageCenter, MessageBell } from './components/MessageCenter';
import { UserCenter } from './components/UserCenter';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLayout } from './admin';
import { NewsList, NewsDetail } from './components/NewsList';
import { HotSection, SimilarModels } from './components/HotSection';
import { CertificationPage } from './components/CertificationPage';
import { PaymentPage } from './components/PaymentPage';
import { PackageManagement } from './components/PackageManagement';
import { TieredPriceEditor } from './components/TieredPriceEditor';
import { TieredPriceDisplay } from './components/TieredPriceDisplay';
import { CustomerTagManagement } from './components/CustomerTagManagement';
import { StaticPages } from './components/StaticPages';
import { SellerPaymentSettings } from './components/SellerPaymentSettings';
import { SettlementList } from './components/SettlementList';
import { SettlementManagement } from './components/SettlementManagement';
import { TransactionFeed } from './components/TransactionFeed';
import { InventoryFilter } from './components/InventoryFilter';
import { NegotiationHistory } from './components/NegotiationHistory';
import { InvoiceForm } from './components/InvoiceForm';
import { LoginHistory } from './components/LoginHistory';
import { DeliveryEstimator } from './components/DeliveryEstimator';
import { UsageAdviceCard } from './components/UsageAdviceCard';
import { QaWorkbench } from './components/QaWorkbench';
import { api, User as ApiUser, Inventory, Order, Negotiation } from './api/client';

// --- TOAST COMPONENT ---
const Toast = ({ msg, onClose }: { msg: string, onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [msg, onClose]);

  if (!msg) return null;
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="bg-gray-900 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 font-medium text-sm">
        <CheckCircle2 className="w-5 h-5 text-green-400" />
        {msg}
      </div>
    </div>
  );
};

// --- COMPONENTS ---

const Navbar = ({ view, setView, user, onLogout, onLogin, onOpenMessages, unreadCount, onOpenUserCenter, onOpenAdmin, onOpenQa, onOpenStaticPage }: any) => (
  <nav className="sticky top-0 z-50 bg-exchange-dark text-white shadow-xl">
    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <div
          className="text-xl font-bold tracking-tighter flex items-center gap-2 cursor-pointer"
          onClick={() => setView('home')}
        >
          <Cpu className="w-6 h-6 text-sky-400" />
          <span>芯核<span className="text-sky-400">交易中心</span></span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
          <button onClick={() => onOpenStaticPage('about')} className="hover:text-white transition-colors">关于我们</button>
          <button onClick={() => onOpenStaticPage('rules')} className="hover:text-white transition-colors">平台规则</button>
          <button onClick={() => onOpenStaticPage('contact')} className="hover:text-white transition-colors">联系我们</button>
          <button
            onClick={() => setView('news')}
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <FileText className="w-4 h-4" />
            资讯中心
          </button>
          <span className="px-2 py-0.5 bg-exchange-blue text-xs rounded uppercase tracking-wider font-mono">B2B 专供</span>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
        {user && (
          <>
            <MessageBell onClick={onOpenMessages} unreadCount={unreadCount} />
            <button
              onClick={onOpenUserCenter}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="个人中心"
            >
              <User className="w-4 h-4" />
            </button>
            {user.role === 'admin' && (
              <button
                onClick={onOpenAdmin}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 rounded transition-colors text-white text-xs font-bold"
              >
                管理后台
              </button>
            )}
            {user.role === 'qa' && (
              <button
                onClick={onOpenQa}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded transition-colors text-white text-xs font-bold"
              >
                质检工作台
              </button>
            )}
            <span className="text-gray-400 text-xs hidden sm:inline">
              {user.companyName} ({user.role === 'buyer' ? '买家' : user.role === 'seller' ? '卖家' : user.role === 'qa' ? '质检员' : '管理员'})
            </span>
            {user.role === 'buyer' ? (
              <button onClick={() => setView('buyer-center')} className={`px-3 py-1.5 rounded transition-colors ${view === 'buyer-center' ? 'bg-blue-900/50 text-blue-300' : 'hover:text-white text-gray-400'}`}>
                买家控制台
              </button>
            ) : user.role === 'seller' ? (
              <button onClick={() => setView('seller-center')} className={`px-3 py-1.5 rounded transition-colors ${view === 'seller-center' ? 'bg-purple-900/50 text-purple-300' : 'hover:text-white text-gray-400'}`}>
                卖家工作台
              </button>
            ) : null}
            <div className="w-px h-5 bg-gray-700 hidden sm:block"></div>
          </>
        )}
        {user ? (
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-white px-2 py-2 rounded transition-colors"
            title="退出登录"
          >
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onLogin}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            登录
          </button>
        )}
      </div>
    </div>
  </nav>
);

const Footer = () => (
  <footer className="bg-gray-100 border-t border-exchange-border mt-8 py-8">
    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
      <div className="col-span-3 md:col-span-1">
        <div className="font-bold text-lg mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-exchange-accent" />
          100% 官方担保交易
        </div>
        <p className="text-gray-500 leading-relaxed max-w-md">采用创新的双盲交易模式，单向阻隔保护供应商和买家数据隐私。所有流转货品必须通过平台担保质检严格检测后发货，确保原厂正品。</p>
      </div>
      <div className="text-center md:text-left">
        <div className="font-bold text-lg mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-exchange-accent" />
          平台规则
        </div>
      </div>
      <div className="text-center md:text-left">
        <div className="font-bold text-lg mb-4 flex items-center gap-2">
          <Headphones className="w-5 h-5 text-exchange-accent" />
          商家支持
        </div>
      </div>
    </div>
  </footer>
);

// --- VIEWS ---

const HomeView = ({ setView, handleSearch }: any) => {
  const [query, setQuery] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(query.trim()) handleSearch(query);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="bg-exchange-dark text-white pt-20 pb-24 px-6 border-b-4 border-exchange-accent relative overflow-hidden">
        {/* BG Decoration */}
        <div className="absolute top-0 right-0 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <Cpu className="w-[500px] h-[500px]" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-tight">
            全链路双盲管控的 <br/><span className="text-sky-400 italic font-serif tracking-normal">电子元器件</span> 交易枢纽
          </h1>
          <p className="text-gray-400 mb-10 font-medium text-lg">资金平台Escrow监管 &bull; 匿名化撮合防跳单 &bull; 官方实验室深度质检</p>
          
          <form onSubmit={onSubmit} className="relative max-w-3xl mx-auto group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-gray-400 group-focus-within:text-exchange-accent transition-colors" />
            </div>
            <input 
              type="text" 
              className="w-full bg-white text-exchange-dark border-0 rounded-xl pl-12 pr-32 py-5 text-lg font-mono focus:ring-4 focus:ring-exchange-accent/50 outline-none transition-all shadow-2xl"
              placeholder="输入完整的 MPN (例如: STM32F103C8T6)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button 
              type="submit" 
              className="absolute right-2 top-2 bottom-2 bg-exchange-dark hover:bg-exchange-accent text-white font-bold px-8 rounded-lg transition-colors text-lg"
            >
              检索
            </button>
          </form>
          
          <div className="mt-6 flex items-center justify-center gap-3 text-sm">
            <span className="text-gray-500 uppercase tracking-widest text-xs font-bold">现货热搜:</span>
            {["STM32F103C8T6", "XC7Z020-2CLG400I", "ADUM1201ARZ"].map(tag => (
              <button key={tag} onClick={() => handleSearch(tag)} className="bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-full font-mono transition-colors">
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 热门推荐区域 */}
      <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-20">
        <HotSection
          onSearch={handleSearch}
          onSelectInventory={(id) => {
            // 跳转到搜索并选中该库存
            handleSearch('');
            setView('search');
          }}
        />
      </div>

      {/* 交易动态区域 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TransactionFeed />
          </div>
          <div>
            {/* 快捷入口 */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold text-gray-800 mb-4">快捷入口</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setView('search')}
                  className="w-full py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  搜索库存
                </button>
                <button
                  onClick={() => setView('buyer-center')}
                  className="w-full py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                >
                  买家中心
                </button>
                <button
                  onClick={() => setView('seller-center')}
                  className="w-full py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                >
                  卖家中心
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SearchView = ({ currentQuery, setView, showToast, inventory, packages, createOrder, createNegotiation }: any) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerQty, setOfferQty] = useState("");
  const [buyModalRow, setBuyModalRow] = useState<any>(null);
  const [buyQty, setBuyQty] = useState("");
  const [favoriteStatus, setFavoriteStatus] = useState<Record<string, boolean>>({});
  const [followStatus, setFollowStatus] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'inventory' | 'packages'>('inventory');
  const [packageDetail, setPackageDetail] = useState<any>(null);

  // 检查收藏状态
  useEffect(() => {
    if (inventory.length > 0) {
      const ids = inventory.map((item: any) => item.id);
      api.checkFavorites(ids).then(setFavoriteStatus).catch(console.error);
    }
  }, [inventory]);

  const toggleFavorite = async (inventoryId: string, partNumber: string) => {
    try {
      if (favoriteStatus[inventoryId]) {
        await api.removeFavorite(inventoryId);
        showToast(`已取消收藏 ${partNumber}`);
      } else {
        await api.addFavorite(inventoryId);
        showToast(`已收藏 ${partNumber}`);
      }
      setFavoriteStatus(prev => ({ ...prev, [inventoryId]: !prev[inventoryId] }));
    } catch (err) {
      showToast('操作失败');
    }
  };

  const toggleFollow = async (inventoryId: string, supplier: string) => {
    try {
      if (followStatus[inventoryId]) {
        showToast(`已取消关注 ${supplier}`);
        setFollowStatus(prev => ({ ...prev, [inventoryId]: false }));
      } else {
        await api.followByInventory(inventoryId);
        showToast(`已关注 ${supplier}`);
        setFollowStatus(prev => ({ ...prev, [inventoryId]: true }));
      }
    } catch (err: any) {
      showToast(err.message || '关注失败');
    }
  };

  const trimmedQuery = currentQuery?.trim().toLowerCase() || "";

  // 搜索结果（直接使用API返回的数据，服务端已过滤）
  const searchResults = inventory;

  const handleNegotiate = (row: any) => {
    setSelectedRow(row);
    setOfferPrice(row.price.toString());
    setOfferQty(row.availableQty?.toString() || row.qty?.toString() || "1");
    setShowModal(true);
  };

  const submitOffer = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(false);
    createNegotiation(selectedRow.id, Number(offerPrice), Number(offerQty));
    showToast("议价申请已发送！系统已流转至卖家中心。");
    setView('buyer-center');
  };

  const handleBuyNow = (row: any) => {
    setBuyModalRow(row);
    setBuyQty("1");
  };

  const submitBuyNow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyModalRow) return;
    const qty = Number(buyQty);
    if (qty <= 0 || qty > (buyModalRow.availableQty || buyModalRow.quantity || 0)) {
      showToast('请输入有效的采购数量');
      return;
    }
    setBuyModalRow(null);
    createOrder(buyModalRow.id, qty);
    showToast(`全额直购 ${qty} 件锁定成功！请前往买家中心付款。`);
    setView('buyer-center');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 animate-in slide-in-from-bottom-4 duration-500 relative">
      <div className="mb-6 cursor-pointer text-sm text-gray-500 hover:text-exchange-accent font-medium transition-colors" onClick={() => setView('home')}>
        &larr; 返回首页
      </div>

      {/* 筛选组件 */}
      <InventoryFilter onFilterChange={(filters) => console.log('Filters:', filters)} />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold font-mono text-white">{currentQuery || "平台现货大盘"}</h2>
          <p className="text-white/50 text-sm mt-1">
            匿名匹配引擎为您找到 <span className="font-bold text-exchange-accent">{searchResults.length}</span> 条符合要求的现货报价。
            {packages.length > 0 && (
              <span>，<span className="font-bold text-green-400">{packages.length}</span> 个打包优惠</span>
            )}
          </p>
        </div>

        {/* 标签切换 */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              activeTab === 'inventory'
                ? 'bg-exchange-accent text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <HardDrive className="w-4 h-4 inline-block mr-1" />
            现货库存 ({searchResults.length})
          </button>
          {packages.length > 0 && (
            <button
              onClick={() => setActiveTab('packages')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                activeTab === 'packages'
                  ? 'bg-green-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <Package className="w-4 h-4 inline-block mr-1" />
              打包优惠 ({packages.length})
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-6 items-start">
        {/* 左侧高级筛选 (UI示意) */}
        <div className="hidden lg:block w-64 bg-white border border-exchange-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 font-bold mb-4 border-b border-gray-100 pb-3">
            <Filter className="w-4 h-4" /> 高级筛选参数
          </div>
          <div className="space-y-5 text-sm">
            <div>
              <label className="font-bold text-gray-700 block mb-2">生产年份 (D/C)</label>
              <select className="w-full border-gray-300 rounded focus:ring-exchange-accent border px-3 py-2">
                <option>全部年份</option>
                <option>2024 - 2026</option>
                <option>2022 - 2023</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-2">合规审查</label>
              <label className="flex items-center gap-2 text-gray-600"><input type="checkbox" defaultChecked /> EAR99 免审批</label>
              <label className="flex items-center gap-2 text-gray-600 mt-1"><input type="checkbox" /> 涉军/敏感物料</label>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-2">发货时效</label>
              <label className="flex items-center gap-2 text-gray-600"><input type="checkbox" /> 现货当天发</label>
              <label className="flex items-center gap-2 text-gray-600 mt-1"><input type="checkbox" /> 一周内</label>
            </div>
          </div>
        </div>

        {/* 右侧数据列 */}
        <div className="flex-1">

          {/* 打包商品展示 */}
          {activeTab === 'packages' && packages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-green-400" />
                打包优惠商品
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {packages.map((pkg: any) => (
                  <div
                    key={pkg.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setPackageDetail(pkg)}
                  >
                    <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-lg">{pkg.name}</h4>
                          <p className="text-green-100 text-sm mt-1">{pkg.totalItems} 种型号</p>
                        </div>
                        <div className="bg-white/20 px-2 py-1 rounded text-sm font-bold">
                          {pkg.discountRate > 0 ? `- ${pkg.discountRate}%` : '特价'}
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <span className="text-xs text-gray-500">原价</span>
                          <span className="text-sm text-gray-400 line-through ml-1">
                            ¥ {pkg.totalValue.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-500">打包价</span>
                          <span className="text-xl font-bold text-red-600 ml-1">
                            ¥ {pkg.packagePrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {pkg.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{pkg.description}</p>
                      )}
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-xs text-gray-400">
                          发布于 {new Date(pkg.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // 购买打包商品
                            api.buyPackage(pkg.id).then((result: any) => {
                              showToast('打包商品购买成功！订单已创建。');
                              setView('buyer-center');
                            }).catch((err: Error) => {
                              showToast(err.message || '购买失败');
                            });
                          }}
                          className="px-4 py-1.5 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors"
                        >
                          立即购买
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 现货库存展示 */}
          {activeTab === 'inventory' && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
             {searchResults.length > 0 && (
<div className="hidden md:grid grid-cols-12 px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wider items-center text-center">
                   <div className="col-span-3 px-1 font-mono">型号名称 (MPN)</div>
                   <div className="col-span-1">可用库存</div>
                   <div className="col-span-1">批次</div>
                   <div className="col-span-1">时效</div>
                   <div className="col-span-1">ECCN</div>
                   <div className="col-span-2 md:text-right pr-4">含税单价</div>
                   <div className="col-span-1">供应商</div>
                  <div className="col-span-2 text-center">交易操作</div>
                </div>
             )}
          
            <div className="divide-y divide-exchange-border">
              {searchResults.length === 0 ? (
                <div className="p-12 text-center text-gray-500 bg-white">
                  <Search className="w-10 h-10 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-bold text-gray-800 mb-1">未找到完全匹配的型号</h3>
                  <p className="text-sm">系统当前库存池中暂无与 "{currentQuery}" 完全匹配的元件。已将缺货需求自动记录，您可以随时尝试变更查询条件或提交BOM单。</p>
                </div>
              ) : (
                searchResults.map((row: any) => (
                  <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 p-4 md:py-5 items-center hover:bg-slate-50 transition-colors gap-4 md:gap-0">
                    <div className="col-span-3 text-center font-mono font-bold text-gray-900 text-sm px-1">
                      <span className="truncate block" title={row.partNumber}>{row.partNumber}</span>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="font-mono font-bold text-gray-700 text-sm">{(row.availableQty || row.quantity || 0).toLocaleString()}</span>
                    </div>
                    <div className="col-span-1 text-center font-mono text-xs text-gray-700">{row.year || '-'}</div>
                    <div className="col-span-1 text-center text-xs text-gray-700 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" /> {row.leadTime || '现货'}
                    </div>
                    <div className="col-span-1 text-center font-mono text-[11px]">
                      <span className="bg-yellow-50 text-yellow-800 px-1.5 py-1 rounded border border-yellow-200">{row.eccn || 'EAR99'}</span>
                    </div>
                    <div className="col-span-2 text-left md:text-right md:pr-4">
                      <div className="font-mono font-bold text-xl text-red-600">¥ {(row.price || 0).toFixed(2)}</div>
                    </div>
                    <div className="col-span-1 text-center">
                      <div className="text-xs text-gray-600 font-mono">{row.supplier || '--'}</div>
                      <button
                        onClick={() => toggleFollow(row.id, row.supplier)}
                        className={`mt-1 text-[10px] px-2 py-0.5 rounded transition-colors ${
                          followStatus[row.id]
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
                        }`}
                      >
                        {followStatus[row.id] ? '已关注' : '+ 关注'}
                      </button>
                    </div>
                  <div className="col-span-2 flex flex-col gap-2 w-full mt-2 md:mt-0 px-2 lg:px-4">
                      <button
                        onClick={() => toggleFavorite(row.id, row.partNumber)}
                        className={`w-full px-3 py-2 text-sm font-bold rounded-lg transition-colors shadow-sm whitespace-nowrap flex items-center justify-center gap-2 ${
                          favoriteStatus[row.id]
                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                            : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-yellow-50 hover:text-yellow-600'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${favoriteStatus[row.id] ? 'fill-yellow-500' : ''}`} />
                        {favoriteStatus[row.id] ? '已收藏' : '收藏'}
                      </button>
                      <button
                        onClick={() => handleBuyNow(row)}
                        className="w-full px-3 py-2 bg-exchange-dark text-white text-sm font-bold rounded-lg hover:bg-exchange-accent transition-colors shadow-sm whitespace-nowrap"
                      >
                        购买
                      </button>
                      <button
                        onClick={() => handleNegotiate(row)}
                        className="w-full px-3 py-2 border border-gray-300 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap"
                      >
                        申请议价
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          )}

          {/* 打包商品详情弹窗 */}
          {packageDetail && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-green-50">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-green-900">
                    <Package className="w-5 h-5 text-green-600" /> 打包商品详情
                  </h3>
                  <button onClick={() => setPackageDetail(null)} className="text-gray-400 hover:text-gray-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6">
                  <div className="bg-green-50 rounded-lg p-4 mb-6">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{packageDetail.name}</h4>
                    {packageDetail.description && (
                      <p className="text-gray-600 text-sm">{packageDetail.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-sm text-gray-500">型号数量</div>
                      <div className="text-xl font-bold text-gray-900">{packageDetail.totalItems}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-sm text-gray-500">原价总额</div>
                      <div className="text-lg font-bold text-gray-500 line-through">
                        ¥ {packageDetail.totalValue.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <div className="text-sm text-red-600">打包特价</div>
                      <div className="text-xl font-bold text-red-600">
                        ¥ {packageDetail.packagePrice.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {packageDetail.discountRate > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 text-center">
                      <span className="text-green-800 font-bold">为您节省 ¥ {(packageDetail.totalValue - packageDetail.packagePrice).toLocaleString()}</span>
                      <span className="text-green-600 ml-2">({packageDetail.discountRate}% 折扣)</span>
                    </div>
                  )}

                  {packageDetail.items && packageDetail.items.length > 0 && (
                    <div className="mb-6">
                      <h5 className="font-bold text-gray-900 mb-3">包含型号</h5>
                      <div className="bg-gray-50 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium text-gray-600">型号</th>
                              <th className="px-4 py-2 text-right font-medium text-gray-600">数量</th>
                              <th className="px-4 py-2 text-right font-medium text-gray-600">单价</th>
                              <th className="px-4 py-2 text-right font-medium text-gray-600">小计</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {packageDetail.items.slice(0, 10).map((item: any, idx: number) => (
                              <tr key={idx}>
                                <td className="px-4 py-2 font-mono text-gray-900">{item.partNumber}</td>
                                <td className="px-4 py-2 text-right font-mono text-gray-600">{item.quantity}</td>
                                <td className="px-4 py-2 text-right font-mono text-gray-600">¥ {item.unitPrice.toFixed(2)}</td>
                                <td className="px-4 py-2 text-right font-mono text-gray-900">¥ {item.subtotal.toLocaleString()}</td>
                              </tr>
                            ))}
                            {packageDetail.items.length > 10 && (
                              <tr>
                                <td colSpan={4} className="px-4 py-2 text-center text-gray-500 text-xs">
                                  还有 {packageDetail.items.length - 10} 个型号...
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setPackageDetail(null)}
                      className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => {
                        api.buyPackage(packageDetail.id).then((result: any) => {
                          setPackageDetail(null);
                          showToast('打包商品购买成功！订单已创建。');
                          setView('buyer-center');
                        }).catch((err: Error) => {
                          showToast(err.message || '购买失败');
                        });
                      }}
                      className="flex-1 px-4 py-2.5 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors"
                    >
                      确认购买打包商品
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-4 text-sm text-blue-900 shadow-inner">
        <ShieldCheck className="w-6 h-6 flex-shrink-0 text-exchange-accent mt-0.5" />
        <div>
          <strong className="block mb-1 text-base">平台合规交易安全提醒：</strong>
          <p className="leading-relaxed">本平台严格执行双盲机制：至此阶段所有供应商均脱敏。您的资金将由 <b>平台对公监管账户</b> 暂存。只有当卖家将货物发至平台 <b>CNAS认证质检实验室</b> 并全检合格后，货物才会二次打包发出，并在您签收后给卖家结算货款。</p>
        </div>
      </div>

      {/* 议价弹窗 */}
      {showModal && selectedRow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-exchange-accent" /> 发起定向议价
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={submitOffer} className="p-6">
              <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 mb-6 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">目标型号:</span>
                  <span className="font-mono font-bold text-gray-900">{selectedRow.partNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">当前卖方挂牌价:</span>
                  <span className="font-mono font-bold text-red-600">¥ {(selectedRow.price || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-700 mb-1">您的目标采购数量 (件)</label>
                  <input type="number" required min="1" max={selectedRow.availableQty || selectedRow.quantity || 1}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 font-mono focus:ring-2 focus:ring-exchange-accent outline-none"
                    value={offerQty} onChange={e=>setOfferQty(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-700 mb-1">您的期望单价 (含税)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 font-mono text-gray-500">¥</span>
                    <input type="number" step="0.01" required 
                      className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 font-mono focus:ring-2 focus:ring-exchange-accent outline-none font-bold text-blue-800" 
                      value={offerPrice} onChange={e=>setOfferPrice(e.target.value)} />
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100 flex justify-between items-center bg-gray-50 p-2 rounded">
                  <span className="text-xs text-gray-500 font-bold uppercase">预估总额:</span>
                  <span className="font-mono text-lg font-bold">¥ {((Number(offerPrice) || 0) * (Number(offerQty) || 0)).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors">
                  取消
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-exchange-dark text-white text-sm font-bold rounded-lg hover:bg-exchange-accent transition-colors shadow">
                  提交法律约束协议
                </button>
              </div>
              <div className="mt-4 flex items-start gap-2 bg-yellow-50 text-yellow-800 p-2 text-[11px] rounded border border-yellow-200">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p><strong>硬性机制：</strong>议价申请一经卖家同意，系统将立即生成具有法律效力的待支付订单，违约不付款将扣除严重信用分或限制后续交易。</p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 购买数量选择弹窗 */}
      {buyModalRow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-exchange-accent" /> 购买
              </h3>
              <button onClick={() => setBuyModalRow(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitBuyNow} className="p-6">
              <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 mb-6 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">目标型号:</span>
                  <span className="font-mono font-bold text-gray-900">{buyModalRow.partNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">含税单价:</span>
                  <span className="font-mono font-bold text-red-600">¥ {(buyModalRow.price || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-700 mb-1">采购数量 (件)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={buyModalRow.availableQty || buyModalRow.quantity || 1}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 font-mono focus:ring-2 focus:ring-exchange-accent outline-none"
                    value={buyQty}
                    onChange={(e) => setBuyQty(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">最大可购 {(buyModalRow.availableQty || buyModalRow.quantity || 0).toLocaleString()} 件</p>
                </div>

                <div className="pt-2 border-t border-gray-100 flex justify-between items-center bg-gray-50 p-2 rounded">
                  <span className="text-xs text-gray-500 font-bold uppercase">订单总额:</span>
                  <span className="font-mono text-lg font-bold">¥ {((Number(buyQty) || 0) * (buyModalRow.price || 0)).toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setBuyModalRow(null)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors">
                  取消
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-exchange-dark text-white text-sm font-bold rounded-lg hover:bg-exchange-accent transition-colors shadow">
                  确认购买
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------
// BUYER CENTER
// ---------------------------------------------------------
const BuyerCenter = ({ orders, negotiations, markOrderPaid, completeOrder, cancelOrder, showToast, setView }: any) => {
  const [activeTab, setActiveTab] = useState('orders');
  const [paymentModalOrder, setPaymentModalOrder] = useState<any>(null);
  const [showOnlinePayment, setShowOnlinePayment] = useState(false);
  const [logisticsOrder, setLogisticsOrder] = useState<any>(null);
  const [logisticsTraces, setLogisticsTraces] = useState<any[]>([]);
  const [loadingTraces, setLoadingTraces] = useState(false);
  const [paymentChannels, setPaymentChannels] = useState<Array<{
    channel: 'alipay' | 'wechat';
    channelName: string;
    enabled: boolean;
    configured: boolean;
  }>>([]);

  // 加载支付渠道
  useEffect(() => {
    loadPaymentChannels();
  }, []);

  const loadPaymentChannels = async () => {
    try {
      const channels = await api.getPaymentChannels();
      setPaymentChannels(channels.filter(c => c.enabled && c.configured));
    } catch (err) {
      console.error('加载支付渠道失败:', err);
    }
  };

  // 查询物流轨迹
  const queryLogistics = async (trackingNumber: string) => {
    setLoadingTraces(true);
    try {
      const result = await api.queryLogistics(trackingNumber);
      setLogisticsTraces(result.traces || []);
    } catch (err: any) {
      showToast(err.message || '查询物流失败');
      setLogisticsTraces([]);
    } finally {
      setLoadingTraces(false);
    }
  };

  // 打开物流弹窗时自动查询
  useEffect(() => {
    if (logisticsOrder?.logistics?.trackingNumber) {
      queryLogistics(logisticsOrder.logistics.trackingNumber);
    }
  }, [logisticsOrder]);

  // 有可用的在线支付渠道
  const hasOnlinePayment = paymentChannels.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-8 animate-in fade-in duration-300">
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-gradient-to-br from-blue-900 to-exchange-dark rounded-xl shadow-lg border border-blue-800 p-6 mb-4 text-white">
          <h3 className="font-bold text-lg mb-1">采购专属控制台</h3>
          <p className="text-xs text-blue-200 mb-4 font-mono">ID: BYR-772A</p>
          <p className="text-sm font-medium mb-4">深圳市硬核创客智能技术有限公司</p>
          <div className="inline-flex items-center px-2 py-1 bg-green-500/20 text-green-300 border border-green-500/30 text-xs font-bold rounded uppercase tracking-wide">
            <CheckCircle2 className="w-3 h-3 mr-1" /> 企业实名认证完毕
          </div>
        </div>
        <nav className="space-y-1 bg-white p-2 border border-gray-200 rounded-xl shadow-sm">
          <button onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center px-4 py-3 rounded-lg font-bold transition-colors ${activeTab==='orders' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <PackageSearch className="w-4 h-4 mr-3" /> 我的采购买断订单
          </button>
          <button onClick={() => setActiveTab('negotiations')}
            className={`w-full flex items-center px-4 py-3 rounded-lg font-bold transition-colors ${activeTab==='negotiations' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <ArrowRightLeft className="w-4 h-4 mr-3" /> 议价与寻源申请 
            {negotiations.length > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{negotiations.length}</span>}
          </button>
        </nav>
      </div>

      <div className="flex-1 space-y-6">
        {activeTab === 'orders' && (
          <div className="animate-in fade-in">
            <h2 className="text-2xl font-bold font-serif mb-6 text-white border-b border-white/10 pb-2">采购买断订单管理</h2>
            
            {orders.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">暂无订单记录</div>
            ) : (
              <div className="space-y-6">
                {orders.map((ord: any) => (
                  <div key={ord.id} className="bg-white rounded-xl shadow-sm border border-exchange-border overflow-hidden transform transition-all hover:shadow-md">
                    <div className="bg-slate-50 p-3 border-b border-exchange-border flex flex-wrap justify-between items-center text-sm gap-2">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-gray-500 mr-2 text-xs font-bold">订单核准号:</span>
                          <span className="font-mono font-medium text-exchange-dark">{ord.orderNumber || ord.id}</span>
                        </div>
                        <div className="font-mono text-xs text-gray-400">{ord.createdAt ? new Date(ord.createdAt).toLocaleString() : ''}</div>
                      </div>

                      {ord.status === 'awaiting_payment' && <span className="flex items-center gap-1.5 text-red-600 font-bold bg-red-50 border border-red-200 px-3 py-1 rounded-full text-xs animate-pulse"><AlertTriangle className="w-3.5 h-3.5"/> 等待对公打款注资</span>}
                      {ord.status === 'paid_awaiting_shipment' && <span className="flex items-center gap-1.5 text-blue-600 font-bold bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-xs"><Clock className="w-3.5 h-3.5"/> 款已锁定，单盲通知卖家发货中</span>}
                      {ord.status === 'qa_in_transit' && <span className="flex items-center gap-1.5 text-orange-600 font-bold bg-orange-50 border border-orange-200 px-3 py-1 rounded-full text-xs"><ShieldCheck className="w-3.5 h-3.5"/> 卖家已发往平台，入仓质检中</span>}
                      {ord.status === 'completed' && <span className="flex items-center gap-1.5 text-green-600 font-bold bg-green-50 border border-green-200 px-3 py-1 rounded-full text-xs"><CheckCircle2 className="w-3.5 h-3.5"/> 交易完结</span>}
                    </div>

                    {/* 物流信息展示 */}
                    {ord.logistics && (
                      <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">物流:</span>
                            <span className="font-medium text-gray-900">{ord.logistics.carrier}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">运单号:</span>
                            <span className="font-mono font-medium text-blue-600 cursor-pointer hover:underline"
                              onClick={() => {
                                navigator.clipboard.writeText(ord.logistics.trackingNumber);
                                showToast('运单号已复制');
                              }}>
                              {ord.logistics.trackingNumber}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setLogisticsOrder(ord);
                            }}
                            className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors font-medium"
                          >
                            查看物流轨迹
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="font-mono text-xl font-bold mb-1 text-gray-900 border-l-4 border-exchange-accent pl-3">{ord.partNumber}</div>
                        <div className="text-sm text-gray-500 pl-4 mt-2 bg-gray-50 py-1.5 px-3 rounded inline-block">
                          锁定交割数: <span className="font-mono font-bold text-gray-900">{(ord.quantity || 0).toLocaleString()} 件</span>
                        </div>
                      </div>
                      <div className="text-left md:text-right border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                        <div className="text-xs text-gray-500 mb-1 uppercase font-bold">订单结算总金额 (含担保服务)</div>
                        <div className="font-mono text-3xl font-bold text-red-600">¥ {(ord.totalAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                      </div>
                    </div>

                    {ord.status === 'awaiting_payment' && (
                      <div className="bg-yellow-50/50 p-4 border-t border-exchange-border flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div className="text-xs text-yellow-800 flex items-center gap-2">
                          <CreditCard className="w-4 h-4"/> 请在24小时内完成支付
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                          <button
                            onClick={() => {
                              cancelOrder(ord.id);
                              showToast('已放弃采购，系统已取消该笔订单并退回库存锁定状态。');
                              setView('search');
                            }}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors font-medium">放弃采购</button>
                          <button
                            onClick={() => {
                              setPaymentModalOrder(ord);
                              setShowOnlinePayment(false);
                            }}
                            className="flex-1 sm:flex-none px-6 py-2.5 bg-exchange-dark text-white text-sm font-bold rounded-lg shadow-lg hover:bg-exchange-accent transition-colors flex items-center justify-center gap-2"
                          >
                            对公转账支付 <ChevronRight className="w-4 h-4"/>
                          </button>
                        </div>
                      </div>
                    )}

                    {ord.status === 'qa_in_transit' && (
                      <div className="bg-orange-50/50 p-4 border-t border-exchange-border">
                        <div className="text-xs text-orange-800 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4"/>
                          货物已发往平台质检中心，等待质检完成后发货给您。
                        </div>
                      </div>
                    )}

                    {ord.status === 'qa_received' && (
                      <div className="bg-blue-50/50 p-4 border-t border-exchange-border">
                        <div className="text-xs text-blue-800 flex items-center gap-2">
                          <Package className="w-4 h-4"/>
                          货物已入库，正在质检中，请耐心等待。
                        </div>
                      </div>
                    )}

                    {ord.status === 'shipped_to_buyer' && (
                      <div className="bg-green-50/50 p-4 border-t border-exchange-border flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div className="text-xs text-green-800 flex items-center gap-2">
                          <Truck className="w-4 h-4"/> 平台质检通过，货物已发往您处。
                        </div>
                        <button
                          onClick={() => {
                            completeOrder(ord.id);
                            showToast(`签收验货成功！交易流转完成，您的采购物料已入库，平台即将向卖家释放结算款。`);
                          }}
                          className="w-full sm:w-auto px-6 py-2.5 bg-green-600 text-white text-sm font-bold rounded-lg shadow-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                          确认收货 <Check className="w-4 h-4"/>
                        </button>
                      </div>
                    )}

                    {ord.status === 'qa_failed' && (
                      <div className="bg-red-50/50 p-4 border-t border-exchange-border">
                        <div className="text-xs text-red-800 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4"/>
                          质检未通过，货物已退回卖家，订单已取消，款项将原路退回。
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'negotiations' && (
          <div className="animate-in fade-in">
             <h2 className="text-2xl font-bold font-serif mb-6 text-white border-b border-white/10 pb-2">我的议价流转状态</h2>
             {negotiations.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">暂无发送的议价协议</div>
             ) : (
                <div className="space-y-4">
                  {negotiations.map((neg: any) => (
                    <div key={neg.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-lg font-mono">{neg.partNumber}</span>
                          {neg.status === 'pending' && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded border border-yellow-200 font-bold">等待卖家审批</span>}
                          {neg.status === 'accepted' && <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded border border-green-200 font-bold">卖家已接受</span>}
                          {neg.status === 'rejected' && <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded border border-red-200 font-bold">已被拒绝</span>}
                        </div>
                        <div className="text-sm border-l-2 border-gray-200 pl-3">
                          <p className="text-gray-500 mb-1">我方提出的意向单价: <span className="font-mono text-red-600 font-bold">¥ {(neg.offerPrice || 0).toFixed(2)}</span> <span className="text-xs ml-2 line-through text-gray-400">原挂牌价 ¥ {(neg.sellerPrice || 0).toFixed(2)}</span></p>
                          <p className="text-gray-500">协议采购件数: <span className="font-mono font-medium">{(neg.quantity || 0).toLocaleString()} 件</span></p>
                        </div>
                      </div>

                      {neg.status === 'pending' && (
                        <div className="text-right text-xs text-gray-400">
                          由平台单盲协议机流转中，等待卖家审批...
                        </div>
                      )}
                      {neg.status === 'accepted' && (
                        <button onClick={() => setActiveTab('orders')} className="px-5 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow flex items-center gap-2">
                          <Check className="w-4 h-4"/> 已转为订单，去支付
                        </button>
                      )}
                    </div>
                  ))}
                </div>
             )}
          </div>
        )}
      </div>
      
      {/* 在线支付 */}
      {paymentModalOrder && showOnlinePayment && (
        <PaymentPage
          orderId={paymentModalOrder.id}
          orderNumber={paymentModalOrder.orderNumber || paymentModalOrder.id}
          amount={paymentModalOrder.totalAmount || 0}
          onSuccess={() => {
            setPaymentModalOrder(null);
            setShowOnlinePayment(false);
            markOrderPaid(paymentModalOrder.id);
            showToast(`支付成功！货款已锁定在平台监管账户。`);
          }}
          onCancel={() => {
            setPaymentModalOrder(null);
            setShowOnlinePayment(false);
          }}
          showToast={showToast}
        />
      )}

      {/* 对公转账支付模态框 */}
      {paymentModalOrder && !showOnlinePayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-yellow-50/50">
              <h3 className="font-bold text-lg flex items-center gap-2 text-yellow-900">
                <CreditCard className="w-5 h-5 text-yellow-600" /> 对公转账 / 平台收银台
              </h3>
              <button onClick={() => { setPaymentModalOrder(null); setShowOnlinePayment(false); }} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const id = paymentModalOrder.id;
              const total = paymentModalOrder.totalAmount;
              setPaymentModalOrder(null);
              setShowOnlinePayment(false);
              markOrderPaid(id);
              showToast(`支付成功！货款 ¥${total?.toLocaleString() || 0} 已锁定在平台监管账户。`);
            }} className="p-6">

              <div className="text-center mb-6">
                <div className="text-sm text-gray-500 mb-1">交易单号: {paymentModalOrder.orderNumber || paymentModalOrder.id}</div>
                <div className="text-gray-500 text-sm">需支付全款 (含担保费、质检费)</div>
                <div className="text-4xl justify-center font-bold font-mono text-red-600 mt-2 flex items-baseline gap-1">
                  <span className="text-2xl">¥</span> {(paymentModalOrder.totalAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> {config.siteName}官方资金监管账户
                </h4>
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between border-b border-blue-100 pb-2">
                    <span className="text-gray-500 font-sans">开户名</span>
                    <span className="font-bold text-gray-900">{config.platformBankHolder || '芯核交易平台（深圳）资金暂存专户'}</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-100 pb-2">
                    <span className="text-gray-500 font-sans">开户行</span>
                    <span className="font-bold text-gray-900">{config.platformBankName || '招商银行深圳科苑支行'}</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-100 pb-2">
                    <span className="text-gray-500 font-sans">企业账号</span>
                    <span className="font-bold text-gray-900 text-lg">{config.platformBankAccount || '7559 8888 6666 888'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-blue-100/50 p-2 rounded -mx-2 px-2 mt-1 border border-blue-200 border-dashed">
                    <span className="text-blue-800 font-bold font-sans">网银转账必填附言码</span>
                    <span className="font-bold text-xl text-red-600 tracking-wider bg-white px-2 py-0.5 rounded shadow-sm">
                      {paymentModalOrder.orderNumber || paymentModalOrder.id}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-700 mb-1">贵司付款银行流水号 (回单校验码)</label>
                  <input type="text" required placeholder="例如：20260417001XXXXX (必填以便资金核销)" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-exchange-accent outline-none" />
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-100 flex gap-3">
                <button type="button" onClick={() => { setPaymentModalOrder(null); setShowOnlinePayment(false); }} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors">
                  稍后付款
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-exchange-dark text-white text-sm font-bold rounded-lg shadow-md hover:bg-exchange-accent transition-colors flex justify-center items-center gap-2">
                  我已汇款，提交平台核发流水单 <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 text-[11px] text-center text-gray-400">
                资金将暂存在官方监管账户。待您确认货物无误后，这笔资金才会经由平台指令划转给实际卖家。
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 物流轨迹查询弹窗 */}
      {logisticsOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" /> 物流轨迹
              </h3>
              <button onClick={() => setLogisticsOrder(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* 物流信息 */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-sm">承运商</span>
                  <span className="font-bold text-gray-900">{logisticsOrder.logistics?.carrier}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">运单号</span>
                  <span className="font-mono font-bold text-blue-600">{logisticsOrder.logistics?.trackingNumber}</span>
                </div>
              </div>

              {/* 物流轨迹 */}
              <div className="space-y-0">
                {loadingTraces ? (
                  <div className="text-center py-8 text-gray-400">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    正在查询物流信息...
                  </div>
                ) : logisticsTraces.length > 0 ? (
                  logisticsTraces.map((trace: any, index: number) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                        {index < logisticsTraces.length - 1 && <div className="w-0.5 h-12 bg-gray-200"></div>}
                      </div>
                      <div className="pb-6">
                        <div className="text-sm text-gray-900">{trace.context}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(trace.time).toLocaleString()}
                          {trace.location && ` · ${trace.location}`}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Truck className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    暂无物流轨迹信息
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  if (logisticsOrder.logistics?.trackingNumber) {
                    queryLogistics(logisticsOrder.logistics.trackingNumber);
                    showToast('正在刷新物流信息...');
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-blue-500 text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" /> 刷新轨迹
              </button>
              <button
                onClick={() => setLogisticsOrder(null)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------
// SELLER CENTER
// ---------------------------------------------------------
const SellerCenter = ({ inventory, orders, negotiations, acceptNegotiation, rejectNegotiation, shipOrder, addInventory, updateInventoryPrice, deleteInventory, showToast, onOpenCertification, onOpenPaymentSettings, onOpenSettlements }: any) => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [shipModalOrder, setShipModalOrder] = useState<any>(null);
  const [priceModalItem, setPriceModalItem] = useState<any>(null);
  const [newPrice, setNewPrice] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    partNumber: '',
    quantity: '',
    price: '',
    year: '',
    eccn: 'EAR99',
    leadTime: '现货',
  });
  const [detailItem, setDetailItem] = useState<any>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<any>(null);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-8 animate-in fade-in duration-300">
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-gray-900 text-white rounded-xl shadow-lg p-6 mb-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 text-white/5"><Building2 className="w-32 h-32 transform translate-x-4 -translate-y-4"/></div>
          <h3 className="font-bold text-lg mb-1 relative z-10">供应商发码中台</h3>
          <p className="font-mono text-[11px] text-gray-400 mb-4 relative z-10">系统匿名哈希: HASH-8C1D99X</p>
          <p className="font-medium text-sm mb-4 relative z-10 text-gray-300">华强北/代理渠道测试账户</p>
          <div className="inline-block px-2 py-1 bg-white/10 border border-white/20 text-white text-[10px] font-bold rounded uppercase tracking-wide relative z-10">
            原厂协议合规认证
          </div>
        </div>
        <nav className="space-y-1 bg-white p-2 border border-gray-200 rounded-xl shadow-sm">
          <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center px-4 py-3 rounded-lg font-bold transition-colors ${activeTab==='inventory' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}>
            <HardDrive className="w-4 h-4 mr-3" /> 我的云端物料库
          </button>
          <button onClick={() => setActiveTab('negotiations')} className={`w-full flex items-center px-4 py-3 rounded-lg font-bold transition-colors ${activeTab==='negotiations' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Bell className="w-4 h-4 mr-3" /> 采购方议价审批
            {negotiations.filter((n:any)=>n.status==='pending').length > 0 && <span className="ml-auto bg-exchange-accent text-white text-[10px] px-2 py-0.5 font-bold rounded-full">{negotiations.filter((n:any)=>n.status==='pending').length}</span>}
          </button>
          <button onClick={() => setActiveTab('sales')} className={`w-full flex items-center px-4 py-3 rounded-lg font-bold transition-colors ${activeTab==='sales' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Truck className="w-4 h-4 mr-3" /> 发货与交易履约
            {orders.filter((o:any)=>o.status==='paid_awaiting_shipment').length > 0 && <span className="ml-auto bg-orange-500 text-white text-[10px] px-2 py-0.5 font-bold rounded-full">需发货</span>}
          </button>
          <button onClick={() => setActiveTab('packages')} className={`w-full flex items-center px-4 py-3 rounded-lg font-bold transition-colors ${activeTab==='packages' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Package className="w-4 h-4 mr-3" /> 打包出售
          </button>
          <button onClick={() => setActiveTab('customers')} className={`w-full flex items-center px-4 py-3 rounded-lg font-bold transition-colors ${activeTab==='customers' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Users className="w-4 h-4 mr-3" /> 老客户管理
          </button>
          <div className="border-t border-gray-200 my-2"></div>
          <button
            onClick={onOpenPaymentSettings}
            className="w-full flex items-center px-4 py-3 rounded-lg font-bold transition-colors text-purple-600 hover:bg-purple-50"
          >
            <CreditCard className="w-4 h-4 mr-3" /> 收款账号设置
          </button>
          <button
            onClick={onOpenSettlements}
            className="w-full flex items-center px-4 py-3 rounded-lg font-bold transition-colors text-green-600 hover:bg-green-50"
          >
            <DollarSign className="w-4 h-4 mr-3" /> 结算记录
          </button>
          <div className="border-t border-gray-200 my-2"></div>
          <button
            onClick={onOpenCertification}
            className="w-full flex items-center px-4 py-3 rounded-lg font-bold transition-colors text-blue-600 hover:bg-blue-50"
          >
            <ShieldCheck className="w-4 h-4 mr-3" /> 企业资质认证
          </button>
        </nav>
      </div>

      <div className="flex-1 space-y-6">
        {activeTab === 'inventory' && (
          <div className="animate-in fade-in">
             <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold font-serif text-white">库存挂牌映射表</h2>
              <button
                onClick={() => {
                  setAddForm({ partNumber: '', quantity: '', price: '', year: '', eccn: 'EAR99', leadTime: '现货' });
                  setShowAddModal(true);
                }}
                className="px-4 py-2 bg-exchange-dark text-white text-sm font-bold rounded hover:bg-exchange-accent transition-colors shadow"
              >
                + 添加新产品
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-exchange-border overflow-hidden">
              <div className="hidden sm:grid grid-cols-12 px-4 py-3 border-b border-white/10 text-center border-exchange-border col-header text-gray-500">
                <div className="col-span-3">型号名称 (MPN)</div>
                <div className="col-span-2">冻结/可用库量</div>
                <div className="col-span-2">展示一口价</div>
                <div className="col-span-2">策略</div>
                <div className="col-span-3 text-right">状态</div>
              </div>
              <div className="divide-y divide-gray-100">
                {inventory.map((item: any) => (
                  <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 p-4 items-center hover:bg-white/5 transition-colors gap-2 text-sm">
                    <div className="col-span-3 font-mono font-bold text-gray-900">{item.partNumber}</div>
                    <div className="col-span-2 font-mono text-gray-700">{(item.availableQty || item.quantity || 0).toLocaleString()}</div>
                    <div className="col-span-2 font-mono text-red-600 font-medium">¥ {(item.price || 0).toFixed(2)}</div>
                    <div className="col-span-2 text-xs text-gray-500">接受议价</div>
                    <div className="col-span-3 text-left sm:text-right flex justify-start sm:justify-end gap-2 items-center">
                      <span className={`w-2 h-2 rounded-full ${item.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      <span className="text-xs text-gray-500 mr-2">{item.status === 'active' ? '上架正常' : '已下架'}</span>
                      <button
                        onClick={() => setDetailItem(item)}
                        className="text-xs text-blue-600 underline hover:text-blue-800"
                      >详情</button>
                      <button
                        onClick={() => {
                          setPriceModalItem(item);
                          setNewPrice((item.price || 0).toString());
                        }}
                        className="text-xs text-gray-600 underline hover:text-black"
                      >调价</button>
                      <button
                        onClick={() => setDeleteConfirmItem(item)}
                        className="text-xs text-red-500 underline hover:text-red-700"
                      >删除</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'negotiations' && (
          <div className="animate-in fade-in">
             <div className="flex justify-between items-center mb-6 border-b pb-2">
               <h2 className="text-2xl font-bold font-serif text-white">议价管理</h2>
               <div className="flex gap-2">
                 <button onClick={() => setActiveTab('negotiations-pending')} className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-colors ${activeTab === 'negotiations-pending' || activeTab === 'negotiations' ? 'bg-exchange-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                   待处理 {negotiations.filter((n:any)=>n.status==='pending').length > 0 && <span className="ml-1 bg-white text-exchange-accent text-xs px-1.5 py-0.5 rounded-full">{negotiations.filter((n:any)=>n.status==='pending').length}</span>}
                 </button>
                 <button onClick={() => setActiveTab('negotiations-history')} className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-colors ${activeTab === 'negotiations-history' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                   历史记录
                 </button>
               </div>
             </div>

             {/* 待处理议价 */}
             {(activeTab === 'negotiations' || activeTab === 'negotiations-pending') && (
               <>
                 {negotiations.filter((n:any)=>n.status==='pending').length === 0 ? (
                    <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">完全清空，目前没有待审批议价。</div>
                 ) : (
                    <div className="space-y-4">
                      {negotiations.filter((n:any)=>n.status==='pending').map((neg: any) => (
                    <div key={neg.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                           <div className="text-sm font-bold text-gray-400 mb-1">来自 匿名采购商 的一口价申请</div>
                           <div className="font-mono text-xl font-bold text-gray-900">{neg.partNumber}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">采购件数承诺</div>
                          <div className="font-mono text-lg font-bold">{(neg.quantity || 0).toLocaleString()} 件</div>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-center gap-6 bg-gray-50 p-4 rounded-lg mb-6">
                        <div className="flex-1 text-center md:text-left">
                          <div className="text-xs font-bold text-gray-500 mb-1">您挂牌单价</div>
                          <div className="font-mono text-xl line-through text-gray-400">¥ {(neg.sellerPrice || 0).toFixed(2)}</div>
                        </div>
                        <div className="text-gray-400"><ArrowRightLeft className="w-6 h-6"/></div>
                        <div className="flex-1 text-center md:text-right">
                          <div className="text-xs font-bold text-orange-600 mb-1">买方期望拿货价</div>
                          <div className="font-mono text-3xl font-bold text-red-600">¥ {(neg.offerPrice || 0).toFixed(2)}</div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                         <button
                           onClick={() => {
                             rejectNegotiation(neg.id);
                             showToast("已拒绝该议价申请。");
                           }}
                           className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-bold rounded hover:bg-gray-200">拒绝调价</button>
                         <button onClick={() => {
                            acceptNegotiation(neg.id);
                            showToast("已同意采购方报价！系统已自动生成待支付订单锁定此交易。");
                         }} className="flex-1 py-2.5 bg-exchange-dark text-white font-bold rounded shadow-lg hover:bg-exchange-accent">
                            接受此报价生成契约订单
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
             )}
               </>
             )}

               {/* 历史记录 */}
               {activeTab === 'negotiations-history' && (
                 <>
                   {negotiations.filter((n:any)=>n.status!=='pending').length === 0 ? (
                      <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">暂无历史议价记录</div>
                   ) : (
                      <div className="space-y-3">
                        {negotiations.filter((n:any)=>n.status!=='pending').map((neg: any) => (
                          <div key={neg.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <span className="font-bold font-mono">{neg.partNumber}</span>
                                {neg.status === 'accepted' && <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded border border-green-200 font-bold">已接受</span>}
                                {neg.status === 'rejected' && <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded border border-red-200 font-bold">已拒绝</span>}
                                {neg.status === 'expired' && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded border border-gray-200 font-bold">已过期</span>}
                              </div>
                              <div className="text-sm text-gray-500">
                                买方出价 <span className="font-mono font-bold text-red-600">¥ {(neg.offerPrice || 0).toFixed(2)}</span>
                                <span className="mx-2">·</span>
                                {(neg.quantity || 0).toLocaleString()} 件
                              </div>
                            </div>
                            <div className="text-xs text-gray-400 font-mono">
                              {neg.createdAt ? new Date(neg.createdAt).toLocaleDateString() : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                   )}
                 </>
               )}
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="animate-in fade-in">
             <h2 className="text-2xl font-bold font-serif mb-6 text-white border-b border-white/10 pb-2">销售与发货履约中心</h2>

             {orders.filter((o:any)=>o.status !== 'awaiting_payment').length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">所有货款尚未到达监管账户，无需发货动作。</div>
             ) : (
                <div className="space-y-4">
                  {orders.filter((o:any)=>o.status !== 'awaiting_payment').map((ord: any) => (
                    <div key={ord.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 p-3 border-b flex justify-between items-center text-sm">
                        <span className="font-mono text-gray-500 font-bold">关联单号: {ord.orderNumber || ord.id}</span>
                        {ord.status === 'paid_awaiting_shipment' && <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">请立刻安排发货至平台</span>}
                        {ord.status === 'qa_in_transit' && <span className="bg-green-100 text-green-800 px-2 py-0.5 border border-green-200 rounded text-xs font-bold">平台质检接收中，请静候拨款</span>}
                        {ord.status === 'completed' && <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded text-xs font-bold">交易完成/资金发放</span>}
                      </div>

                      <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <div className="font-mono text-lg font-bold">{ord.partNumber}</div>
                            <div className="text-sm text-gray-500 mt-1">要求履约：同批次, 供货 {(ord.quantity || 0).toLocaleString()} 件</div>
                          </div>
                          <div className="text-right">
                             <div className="text-xs text-gray-500 mb-1">冻结在平台监管户的总汇款</div>
                             <div className="font-mono text-2xl font-bold text-green-600">¥ {(ord.totalAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                          </div>
                        </div>

                        {ord.status === 'paid_awaiting_shipment' && (
                          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mt-2">
                             <h4 className="text-sm font-bold flex items-center gap-2 mb-2 text-blue-900"><Truck className="w-4 h-4"/> 官方质检仓中转发货点</h4>
                             <p className="text-xs text-gray-600 font-mono bg-white p-2 border border-gray-200 rounded mb-4">
                               收货人: 芯核质检实验室(工号099X)<br/>
                               地址: 广东省深圳市龙岗区平湖街道XX物流园3区 质检独立仓<br/>
                               电话: 400-888-8888 转 992
                             </p>
                             <button onClick={() => {
                                setShipModalOrder(ord);
                             }} className="w-full py-2 bg-blue-600 text-white text-sm font-bold rounded shadow hover:bg-blue-700 hover:scale-[1.01] transition-all">录入运单号发往质检仓</button>
                          </div>
                        )}

                        {ord.status === 'qa_in_transit' && (
                          <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600 font-bold flex flex-col items-center gap-2">
                            <RefreshCcw className="w-6 h-6 animate-spin text-gray-400" />
                            正在等待平台显微镜拆包验真阶段...
                            <span className="text-[11px] font-normal text-gray-400">(验证真伪后将采用顺丰特安件脱敏打乱后发往最终买家，买方签收后2H内打入您本行对公账户)</span>
                          </div>
                        )}
                        {ord.status === 'completed' && (
                          <div className="text-center p-4 bg-green-50 border border-green-200 text-green-700 rounded text-sm font-bold flex flex-col items-center gap-2">
                            <CheckCircle2 className="w-6 h-6" />
                            交易已闭环，全额货款已由平台 Escrow 释放并打入您的对公账户。
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
             )}
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="animate-in fade-in">
            <PackageManagement showToast={showToast} />
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="animate-in fade-in">
            <CustomerTagManagement showToast={showToast} />
          </div>
        )}
      </div>

      {/* 发货物流信息录入弹窗 */}
      {shipModalOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-blue-50/50">
              <h3 className="font-bold text-lg flex items-center gap-2 text-blue-900">
                <Truck className="w-5 h-5 text-blue-600" /> 填入物流运单
              </h3>
              <button onClick={() => setShipModalOrder(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              shipOrder(shipModalOrder.id);
              setShipModalOrder(null);
              showToast("物流信息录入成功！货物流转状态已更新为：平台质检接收中。");
            }} className="p-6">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-5 text-sm font-mono flex flex-col gap-1">
                <div className="text-gray-500">待发货物码: <span className="font-bold text-gray-900">{shipModalOrder.orderNumber || shipModalOrder.id}</span></div>
                <div className="text-gray-500">要求履约件数: <span className="font-bold text-exchange-accent">{(shipModalOrder.quantity || 0).toLocaleString()} 件</span></div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-700 mb-1">物流承运商</label>
                  <select required className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="">请选择合作承运商...</option>
                    <option value="SF">顺丰速运 (平台官方优先推荐)</option>
                    <option value="KY">跨越速运</option>
                    <option value="JD">京东大件 / 物流</option>
                    <option value="OTHER">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-700 mb-1">运单流水号 / 快递单号</label>
                  <input type="text" required placeholder="请准确录入条码以便系统追踪..." className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              
              <div className="mt-8 pt-4 border-t border-gray-100 flex gap-3">
                <button type="button" onClick={() => setShipModalOrder(null)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors">
                  取消发货
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors flex justify-center items-center gap-2">
                  确认发往质检仓 <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 bg-yellow-50 text-yellow-800 p-2 text-xs rounded border border-yellow-200 flex gap-1.5 items-start">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>为保证双盲规则的严密性，<strong>必须且只能</strong>将含有该识别码流水的包裹寄往平台 CNAS 验真收货点。</span>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 调价弹窗 */}
      {priceModalItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-exchange-accent" /> 调整挂牌价格
              </h3>
              <button onClick={() => setPriceModalItem(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              updateInventoryPrice(priceModalItem.id, Number(newPrice));
              setPriceModalItem(null);
              showToast(`价格已更新！${priceModalItem.partNumber} 新单价: ¥${Number(newPrice).toFixed(2)}`);
            }} className="p-6">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-5 text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">物料型号:</span>
                  <span className="font-mono font-bold text-gray-900">{priceModalItem.partNumber}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">库存数量:</span>
                  <span className="font-mono font-medium">{(priceModalItem.availableQty || priceModalItem.quantity || 0).toLocaleString()} 件</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">当前价格:</span>
                  <span className="font-mono font-bold text-red-600">¥ {(priceModalItem.price || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-700 mb-1">新挂牌单价 (含税)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 font-mono text-gray-500">¥</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 font-mono focus:ring-2 focus:ring-exchange-accent outline-none font-bold text-blue-800"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex justify-between items-center bg-gray-50 p-2 rounded">
                  <span className="text-xs text-gray-500 font-bold uppercase">预计库存总值:</span>
                  <span className="font-mono text-lg font-bold">¥ {((Number(newPrice) || 0) * (priceModalItem.availableQty || priceModalItem.quantity || 0)).toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setPriceModalItem(null)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors">
                  取消
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-exchange-dark text-white text-sm font-bold rounded-lg hover:bg-exchange-accent transition-colors shadow">
                  确认调价
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 新增产品弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-exchange-accent" /> 发布新物料库存
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const qty = Number(addForm.quantity);
              const price = Number(addForm.price);
              if (!addForm.partNumber.trim() || qty <= 0 || price <= 0) {
                showToast('请填写完整且有效的产品信息');
                return;
              }
              addInventory({
                partNumber: addForm.partNumber.trim(),
                quantity: qty,
                price,
                year: addForm.year || undefined,
                eccn: addForm.eccn || undefined,
                leadTime: addForm.leadTime || undefined,
              });
              setShowAddModal(false);
              showToast('新物料发布成功！已上架至平台现货池。');
            }} className="p-6">
              <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 mb-5 text-xs text-blue-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>发布后，该物料将以匿名供应商身份出现在平台现货池中，买家可直接购买或发起议价。</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-700 mb-1">型号名称 (MPN) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="例如: STM32F103C8T6"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 font-mono focus:ring-2 focus:ring-exchange-accent outline-none"
                    value={addForm.partNumber}
                    onChange={(e) => setAddForm({ ...addForm, partNumber: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-gray-700 mb-1">库存数量 (件) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="例如: 5000"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 font-mono focus:ring-2 focus:ring-exchange-accent outline-none"
                      value={addForm.quantity}
                      onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-gray-700 mb-1">含税单价 (元) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 font-mono text-gray-500">¥</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        min="0.01"
                        placeholder="0.00"
                        className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 font-mono focus:ring-2 focus:ring-exchange-accent outline-none font-bold text-red-600"
                        value={addForm.price}
                        onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-gray-700 mb-1">生产批次 (D/C)</label>
                    <input
                      type="text"
                      placeholder="例如: 2025+"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 font-mono focus:ring-2 focus:ring-exchange-accent outline-none"
                      value={addForm.year}
                      onChange={(e) => setAddForm({ ...addForm, year: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-gray-700 mb-1">出口管制分类 (ECCN)</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-exchange-accent outline-none bg-white"
                      value={addForm.eccn}
                      onChange={(e) => setAddForm({ ...addForm, eccn: e.target.value })}
                    >
                      <option value="EAR99">EAR99 (免审批)</option>
                      <option value="3A991.d">3A991.d</option>
                      <option value="3A001">3A001 (受控)</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-700 mb-1">发货时效</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-exchange-accent outline-none bg-white"
                    value={addForm.leadTime}
                    onChange={(e) => setAddForm({ ...addForm, leadTime: e.target.value })}
                  >
                    <option value="现货">现货直发</option>
                    <option value="3 天内发货">3 天内发货</option>
                    <option value="1 周发货">1 周发货</option>
                    <option value="订货 (2周)">订货 (2周)</option>
                  </select>
                </div>

                {Number(addForm.quantity) > 0 && Number(addForm.price) > 0 && (
                  <div className="pt-2 border-t border-gray-100 flex justify-between items-center bg-gray-50 p-2 rounded">
                    <span className="text-xs text-gray-500 font-bold uppercase">预计库存总市值:</span>
                    <span className="font-mono text-lg font-bold">¥ {((Number(addForm.quantity) || 0) * (Number(addForm.price) || 0)).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors">
                  取消
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-exchange-dark text-white text-sm font-bold rounded-lg hover:bg-exchange-accent transition-colors shadow">
                  确认发布上架
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 库存详情弹窗 */}
      {detailItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-exchange-accent" /> 物料库存详情
              </h3>
              <button onClick={() => setDetailItem(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="font-mono text-xl font-bold text-gray-900 mb-3 border-l-4 border-exchange-accent pl-3">{detailItem.partNumber}</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 block text-xs mb-0.5">库存总量</span>
                    <span className="font-mono font-bold text-gray-900">{(detailItem.quantity || 0).toLocaleString()} 件</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs mb-0.5">可用库存</span>
                    <span className="font-mono font-bold text-gray-900">{(detailItem.availableQty || 0).toLocaleString()} 件</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs mb-0.5">含税单价</span>
                    <span className="font-mono font-bold text-red-600">¥ {(detailItem.price || 0).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs mb-0.5">库存总市值</span>
                    <span className="font-mono font-bold text-gray-900">¥ {((detailItem.quantity || 0) * (detailItem.price || 0)).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">生产批次 (D/C)</span>
                  <span className="font-mono font-medium">{detailItem.year || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">出口管制 (ECCN)</span>
                  <span className="font-mono font-medium">{detailItem.eccn || 'EAR99'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">发货时效</span>
                  <span className="font-medium">{detailItem.leadTime || '现货'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">上架状态</span>
                  <span className={`font-bold ${detailItem.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                    {detailItem.status === 'active' ? '上架正常' : '已下架'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">创建时间</span>
                  <span className="text-xs font-mono text-gray-600">{detailItem.createdAt ? new Date(detailItem.createdAt).toLocaleString() : '-'}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setDetailItem(null)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors">
                关闭
              </button>
              <button onClick={() => {
                setPriceModalItem(detailItem);
                setNewPrice((detailItem.price || 0).toString());
                setDetailItem(null);
              }} className="flex-1 px-4 py-2.5 bg-exchange-dark text-white text-sm font-bold rounded-lg hover:bg-exchange-accent transition-colors shadow">
                调整价格
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95">
            <div className="p-6 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">确认删除物料</h3>
              <p className="text-sm text-gray-500 mb-1">您即将下架并删除以下物料库存：</p>
              <p className="font-mono font-bold text-lg text-gray-900 my-3">{deleteConfirmItem.partNumber}</p>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">库存数量</span>
                  <span className="font-mono font-medium">{(deleteConfirmItem.quantity || 0).toLocaleString()} 件</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">当前单价</span>
                  <span className="font-mono font-bold text-red-600">¥ {(deleteConfirmItem.price || 0).toFixed(2)}</span>
                </div>
              </div>
              <div className="bg-yellow-50 text-yellow-800 p-2 text-xs rounded border border-yellow-200 text-left flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>删除后该物料将从平台现货池移除，已有买家关注的议价将自动失效。此操作不可撤销。</span>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setDeleteConfirmItem(null)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors">
                取消
              </button>
              <button onClick={() => {
                deleteInventory(deleteConfirmItem.id);
                setDeleteConfirmItem(null);
                showToast(`物料 ${deleteConfirmItem.partNumber} 已删除下架。`);
              }} className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors shadow">
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const { user, isAuthenticated, loading, login, register, logout } = useAuth();
  const { config } = useSystemConfig();
  const [currentView, setCurrentView] = useState("home");
  const [previousView, setPreviousView] = useState("home");
  const [searchParams, setSearchParams] = useState("");
  const [toast, setToast] = useState("");

  // 数据状态
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // 消息中心状态
  const [showMessages, setShowMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 用户中心状态
  const [showUserCenter, setShowUserCenter] = useState(false);

  // 管理后台状态
  const [showAdmin, setShowAdmin] = useState(false);

  // QA质检工作台状态
  const [showQa, setShowQa] = useState(false);

  // 资质认证状态
  const [showCertification, setShowCertification] = useState(false);

  // 新闻状态
  const [newsId, setNewsId] = useState<string | null>(null);

  // 静态页面状态
  const [staticPage, setStaticPage] = useState<'about' | 'rules' | 'contact' | null>(null);

  // 打包商品状态
  const [packages, setPackages] = useState<Array<{
    id: string;
    name: string;
    description?: string;
    totalItems: number;
    totalValue: number;
    packagePrice: number;
    discountRate: number;
    status: string;
  }>>([]);

  // 结算相关状态
  const [showPaymentSettings, setShowPaymentSettings] = useState(false);
  const [showSettlements, setShowSettlements] = useState(false);
  const [showSettlementManagement, setShowSettlementManagement] = useState(false);

  // 加载数据
  useEffect(() => {
    if (isAuthenticated && user) {
      loadData();
      loadUnreadCount();
    }
  }, [isAuthenticated, user]);

  // 未登录时访问受保护页面，自动跳转登录页
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      if (currentView === 'buyer-center' || currentView === 'seller-center') {
        setToast('请先登录');
        setPreviousView(currentView);
        setCurrentView('auth');
      }
    }
  }, [currentView, isAuthenticated, loading]);

  // 返回上一级
  const goBack = () => {
    setCurrentView(previousView);
  };

  const loadData = async () => {
    setDataLoading(true);
    try {
      const [invRes, orderRes, negRes, pkgRes] = await Promise.all([
        api.searchInventory('', 1, 100),
        user?.role === 'buyer' ? api.getBuyerOrders() : api.getSellerOrders(),
        user?.role === 'buyer' ? api.getBuyerNegotiations() : api.getSellerNegotiations(),
        api.getActivePackages({ page: 1, pageSize: 20 }),
      ]);
      setInventory(invRes.items);
      setOrders(orderRes);
      setNegotiations(negRes);
      setPackages(pkgRes.items);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setDataLoading(false);
    }
  };

  // 加载未读消息数量
  const loadUnreadCount = async () => {
    try {
      const result = await api.getUnreadCount();
      setUnreadCount(result.total);
    } catch (err) {
      console.error('加载未读消息失败:', err);
    }
  };

  // 搜索库存
  const handleSearch = async (query: string) => {
    setSearchParams(query);
    setCurrentView('search');
    try {
      const result = await api.searchInventory(query, 1, 100);
      setInventory(result.items);
    } catch (err) {
      console.error('搜索失败:', err);
    }
  };

  // 创建订单（直接购买）
  const createOrder = async (inventoryId: string, quantity: number) => {
    if (!isAuthenticated) {
      setToast('请先登录');
      setPreviousView(currentView);
      setCurrentView('auth');
      return;
    }
    try {
      await api.createOrder({ inventoryId, quantity, type: 'direct' });
      await loadData();
    } catch (err: any) {
      setToast(err.message || '创建订单失败');
    }
  };

  // 创建议价
  const createNegotiation = async (inventoryId: string, offerPrice: number, quantity: number) => {
    if (!isAuthenticated) {
      setToast('请先登录');
      setPreviousView(currentView);
      setCurrentView('auth');
      return;
    }
    try {
      await api.createNegotiation({ inventoryId, offerPrice, quantity });
      await loadData();
    } catch (err: any) {
      setToast(err.message || '创建议价失败');
    }
  };

  // 接受议价
  const acceptNegotiation = async (id: string) => {
    try {
      await api.acceptNegotiation(id);
      await loadData();
    } catch (err: any) {
      setToast(err.message || '接受议价失败');
    }
  };

  // 拒绝议价
  const rejectNegotiation = async (id: string) => {
    try {
      await api.rejectNegotiation(id);
      await loadData();
    } catch (err: any) {
      setToast(err.message || '拒绝议价失败');
    }
  };

  // 支付订单
  const markOrderPaid = async (id: string) => {
    try {
      await api.payOrder(id);
      await loadData();
    } catch (err: any) {
      setToast(err.message || '支付失败');
    }
  };

  // 发货
  const shipOrder = async (id: string) => {
    try {
      await api.shipOrder(id, { carrier: 'SF', trackingNumber: 'SF' + Date.now() });
      await loadData();
    } catch (err: any) {
      setToast(err.message || '发货失败');
    }
  };

  // 完成订单
  const completeOrder = async (id: string) => {
    try {
      await api.completeOrder(id);
      await loadData();
    } catch (err: any) {
      setToast(err.message || '确认收货失败');
    }
  };

  // 取消订单
  const cancelOrder = async (id: string) => {
    try {
      await api.cancelOrder(id);
      await loadData();
    } catch (err: any) {
      setToast(err.message || '取消订单失败');
    }
  };

  // 添加库存
  const addInventory = async (data: { partNumber: string; quantity: number; price: number; year?: string; eccn?: string; leadTime?: string }) => {
    try {
      await api.createInventory(data);
      await loadData();
    } catch (err: any) {
      setToast(err.message || '添加库存失败');
    }
  };

  // 更新库存价格
  const updateInventoryPrice = async (id: string, price: number) => {
    try {
      await api.updateInventory(id, { price });
      await loadData();
    } catch (err: any) {
      setToast(err.message || '更新价格失败');
    }
  };

  const deleteInventory = async (id: string) => {
    try {
      await api.deleteInventory(id);
      await loadData();
    } catch (err: any) {
      setToast(err.message || '删除库存失败');
    }
  };

  const handleLogout = () => {
    logout();
    setInventory([]);
    setOrders([]);
    setNegotiations([]);
    setCurrentView('home');
    setToast('已退出登录');
  };

  // 显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-exchange-surface">
        <div className="text-center">
          <RefreshCcw className="w-8 h-8 animate-spin text-exchange-accent mx-auto mb-4" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  // 管理员用户显示独立后台界面
  if (user?.role === 'admin') {
    return (
      <>
        <AdminLayout
          user={user}
          onLogout={handleLogout}
          showToast={setToast}
        />
        <Toast msg={toast} onClose={() => setToast("")} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-exchange-surface font-sans text-exchange-dark selection:bg-exchange-accent selection:text-white">
      <Navbar
        view={currentView}
        setView={setCurrentView}
        user={user}
        onLogout={handleLogout}
        onLogin={() => {
          setPreviousView(currentView);
          setCurrentView('auth');
        }}
        onOpenMessages={() => setShowMessages(true)}
        unreadCount={unreadCount}
        onOpenUserCenter={() => setShowUserCenter(true)}
        onOpenAdmin={() => setShowAdmin(true)}
        onOpenQa={() => setShowQa(true)}
        onOpenStaticPage={(page: 'about' | 'rules' | 'contact') => setStaticPage(page)}
      />

      <main className="flex-grow">
        {dataLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCcw className="w-6 h-6 animate-spin text-exchange-accent" />
          </div>
        ) : (
          <>
            {currentView === 'home' && <HomeView setView={setCurrentView} handleSearch={handleSearch} />}
            {currentView === 'search' && <SearchView currentQuery={searchParams} setView={setCurrentView} showToast={setToast} inventory={inventory} packages={packages} createOrder={createOrder} createNegotiation={createNegotiation} />}
            {currentView === 'buyer-center' && (isAuthenticated ? (
              <BuyerCenter orders={orders} negotiations={negotiations} markOrderPaid={markOrderPaid} completeOrder={completeOrder} cancelOrder={cancelOrder} showToast={setToast} setView={setCurrentView} />
            ) : null)}
            {currentView === 'seller-center' && (isAuthenticated ? (
              <SellerCenter orders={orders} negotiations={negotiations} inventory={inventory} acceptNegotiation={acceptNegotiation} rejectNegotiation={rejectNegotiation} shipOrder={shipOrder} addInventory={addInventory} updateInventoryPrice={updateInventoryPrice} deleteInventory={deleteInventory} showToast={setToast} onOpenCertification={() => setShowCertification(true)} onOpenPaymentSettings={() => setShowPaymentSettings(true)} onOpenSettlements={() => setShowSettlements(true)} />
            ) : null)}
            {currentView === 'news' && (
              <div className="max-w-7xl mx-auto px-6 py-8">
                {newsId ? (
                  <NewsDetail newsId={newsId} onBack={() => setNewsId(null)} />
                ) : (
                  <NewsList onSelectNews={(id) => setNewsId(id)} />
                )}
              </div>
            )}
            {currentView === 'auth' && (
              <div className="flex flex-col items-center justify-start px-4 pt-6 pb-4 bg-exchange-dark">
                <div className="w-full max-w-md">
                  <button
                    onClick={goBack}
                    className="mb-3 text-gray-400 hover:text-white flex items-center gap-1 text-sm"
                  >
                    ← 返回
                  </button>
                  <AuthPage
                    onLogin={async (email, password) => {
                      await login(email, password);
                      setCurrentView('home');
                    }}
                    onRegister={async (data) => {
                      await register(data);
                      setCurrentView('home');
                    }}
                    showToast={setToast}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
      <Toast msg={toast} onClose={() => setToast("")} />

      {/* 消息中心 */}
      {showMessages && (
        <MessageCenter
          onClose={() => {
            setShowMessages(false);
            loadUnreadCount();
          }}
          showToast={setToast}
        />
      )}

      {/* 用户中心 */}
      {showUserCenter && (
        <UserCenter
          onClose={() => setShowUserCenter(false)}
          showToast={setToast}
        />
      )}

      {/* 管理后台 */}
      {showAdmin && (
        <AdminDashboard
          onClose={() => setShowAdmin(false)}
          showToast={setToast}
          onOpenSettlementManagement={() => {
            setShowAdmin(false);
            setShowSettlementManagement(true);
          }}
        />
      )}

      {/* QA质检工作台 */}
      {showQa && (
        <QaWorkbench
          onClose={() => setShowQa(false)}
          showToast={setToast}
        />
      )}

      {/* 资质认证页面 */}
      {showCertification && (
        <CertificationPage
          onClose={() => setShowCertification(false)}
          showToast={setToast}
        />
      )}

      {/* 静态页面 */}
      {staticPage && (
        <StaticPages
          page={staticPage}
          onClose={() => setStaticPage(null)}
        />
      )}

      {/* 卖家收款账号设置 */}
      {showPaymentSettings && (
        <SellerPaymentSettings
          onClose={() => setShowPaymentSettings(false)}
          showToast={setToast}
        />
      )}

      {/* 卖家结算记录 */}
      {showSettlements && (
        <SettlementList
          onClose={() => setShowSettlements(false)}
          showToast={setToast}
        />
      )}

      {/* 管理员结算审核 */}
      {showSettlementManagement && (
        <SettlementManagement
          onClose={() => setShowSettlementManagement(false)}
          showToast={setToast}
        />
      )}
    </div>
  );
}
