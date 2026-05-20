import React, { useState, useEffect } from 'react';
import { 
  Search, ShieldCheck, ChevronRight, User, 
  PackageSearch, Activity, FileText, ArrowRightLeft, 
  Bell, Building2, HardDrive, Cpu, X, CheckCircle2,
  Filter, SlidersHorizontal, CreditCard, Truck,
  Check, AlertTriangle, Clock, RefreshCcw, LogOut
} from 'lucide-react';

// --- INITIAL STATE DATA ---
const INITIAL_INVENTORY = [
  { id: "inv_1", part: "STM32F103C8T6", qty: 10000, year: "2025+", price: 10.45, eccn: "EAR99", lead: "3 天内发货", status: "Active", supplier: "匿名机构 2A9F" },
  { id: "inv_2", part: "STM32F103C8T6", qty: 2500, year: "2024", price: 11.20, eccn: "EAR99", lead: "现货直发", status: "Active", supplier: "供货商 8C1D" },
  { id: "inv_3", part: "XC7Z020-2CLG400I", qty: 500, year: "2024", price: 850.00, eccn: "3A991.d", lead: "现货", status: "Active", supplier: "匿名机构 99X1" },
  { id: "inv_4", part: "ADUM1201ARZ", qty: 4500, price: 6.85, year: "2023", eccn: "EAR99", lead: "现货", status: "Active", supplier: "一级代理 1B44" },
  { id: "inv_5", part: "ATMEGA328P-AU", qty: 15000, price: 12.00, year: "2025", eccn: "EAR99", lead: "1 周发货", status: "Active", supplier: "授权渠道 5D" },
  { id: "inv_6", part: "NE555DR", qty: 50000, price: 0.25, year: "2024", eccn: "EAR99", lead: "现货直发", status: "Active", supplier: "原厂直供 A1" },
  { id: "inv_7", part: "ESP32-WROOM-32E", qty: 8000, price: 14.50, year: "2025+", eccn: "EAR99", lead: "3 天内发货", status: "Active", supplier: "匿名机构 2B88" },
  { id: "inv_8", part: "LM358DR", qty: 120000, price: 0.15, year: "2023", eccn: "EAR99", lead: "订货 (2周)", status: "Active", supplier: "供货商 8C1D" },
  { id: "inv_9", part: "STM32G474RET6", qty: 1200, price: 18.20, year: "2023", eccn: "EAR99", lead: "现货", status: "Active", supplier: "匿名机构 X992" },
];

const INITIAL_ORDERS = [
  { id: "ORD-998244", part: "XC7Z020-2CLG400I", qty: 250, total: 212500, status: 'AWAITING_PAYMENT', date: "2026-04-17 10:30", type: 'DIRECT' }
];

const INITIAL_NEGOTIATIONS = [
  { id: "NEG-4412", part: "STM32F103C8T6", sellerPrice: 10.45, offerPrice: 9.80, qty: 5000, status: 'PENDING', date: "2026-04-17 14:20" }
];

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

const Navbar = ({ view, setView, currentRole, setRole }: any) => (
  <nav className="sticky top-0 z-50 bg-exchange-dark text-white shadow-xl">
    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <div 
          className="text-xl font-bold tracking-tighter flex items-center gap-2 cursor-pointer"
          onClick={() => setView('home')}
        >
          <Cpu className="w-6 h-6 text-exchange-accent" />
          <span>芯核<span className="text-exchange-accent">交易中心</span></span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
          <button className="hover:text-white transition-colors">关于我们</button>
          <button className="hover:text-white transition-colors">平台担保规则</button>
          <span className="px-2 py-0.5 bg-exchange-blue text-xs rounded uppercase tracking-wider font-mono">B2B 专供</span>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
        <button onClick={() => {setRole('buyer'); setView('buyer-center')}} className={`px-3 py-1.5 rounded transition-colors ${currentRole === 'buyer' ? 'bg-blue-900/50 text-blue-300' : 'hover:text-white text-gray-400'}`}>
          买家控制台
        </button>
        <button onClick={() => {setRole('seller'); setView('seller-center')}} className={`px-3 py-1.5 rounded transition-colors ${currentRole === 'seller' ? 'bg-purple-900/50 text-purple-300' : 'hover:text-white text-gray-400'}`}>
          卖家工作台
        </button>
        <div className="w-px h-5 bg-gray-700 hidden sm:block"></div>
        <button className="flex items-center gap-2 text-gray-400 hover:text-white px-2 py-2 rounded transition-colors">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  </nav>
);

const Footer = () => (
  <footer className="bg-gray-100 border-t border-exchange-border mt-24 py-12">
    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
      <div className="col-span-2">
        <div className="font-bold text-lg mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-exchange-accent" />
          100% 官方担保交易
        </div>
        <p className="text-gray-500 leading-relaxed max-w-md">采用创新的双盲交易模式，单向阻隔保护供应商和买家数据隐私。所有流转货品必须通过平台级 CNAS 专业质检中心严格检测后发货，确保原厂正品。</p>
      </div>
      <div>
        <div className="font-bold text-gray-900 mb-4 uppercase tracking-wider text-xs">平台规则</div>
        <ul className="space-y-2 text-gray-500">
          <li><a href="#" className="hover:text-exchange-accent">匿名买卖与定向议价协议</a></li>
          <li><a href="#" className="hover:text-exchange-accent">实验室质检标准及免责条款</a></li>
          <li><a href="#" className="hover:text-exchange-accent">违约责任与交易纠纷处理</a></li>
        </ul>
      </div>
      <div>
        <div className="font-bold text-gray-900 mb-4 uppercase tracking-wider text-xs">商家支持</div>
        <ul className="space-y-2 text-gray-500">
          <li><a href="#" className="hover:text-exchange-accent">ECCN 出口管制要求合规清单</a></li>
          <li><a href="#" className="hover:text-exchange-accent">平台Escrow监管户打款指引</a></li>
          <li><a href="#" className="hover:text-exchange-accent">ERP SaaS / API 对接开发文档</a></li>
        </ul>
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
            全链路双盲管控的 <br/><span className="text-exchange-accent italic font-serif tracking-normal">电子元器件</span> 交易枢纽
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
    </div>
  );
};

const SearchView = ({ currentQuery, setView, showToast, inventory, createOrder, createNegotiation }: any) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerQty, setOfferQty] = useState("");

  const trimmedQuery = currentQuery?.trim().toLowerCase() || "";
  
  // Fuzzy matching simulation based on the MPN string
  const searchResults = trimmedQuery 
    ? inventory.filter((item: any) => 
        item.part.toLowerCase().includes(trimmedQuery) || 
        item.part.toLowerCase().replace(/-/g, '').includes(trimmedQuery.replace(/-/g, ''))
      )
    : inventory.slice(0, 5); // Default list when no query is typed

  const handleNegotiate = (row: any) => {
    setSelectedRow(row);
    setOfferPrice(row.price.toString());
    setOfferQty(row.qty.toString());
    setShowModal(true);
  };

  const submitOffer = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(false);
    createNegotiation(selectedRow.part, Number(offerPrice), Number(selectedRow.price), Number(offerQty));
    showToast("议价申请已发送！系统已流转至卖家中心。");
    setView('buyer-center');
  };

  const handleBuyNow = (row: any) => {
    createOrder(row.part, row.price, row.qty);
    showToast("全额直购锁定成功！请前往买家中心付款。");
    setView('buyer-center');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 animate-in slide-in-from-bottom-4 duration-500 relative">
      <div className="mb-6 cursor-pointer text-sm text-gray-500 hover:text-exchange-accent font-medium transition-colors" onClick={() => setView('home')}>
        &larr; 返回首页
      </div>
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold font-mono text-gray-900">{currentQuery || "平台现货大盘"}</h2>
          <p className="text-gray-500 text-sm mt-1">
            匿名匹配引擎为您找到 <span className="font-bold text-exchange-accent">{searchResults.length}</span> 条符合要求的现货报价。
          </p>
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
          
          <div className="bg-white shadow-sm border border-exchange-border rounded-xl overflow-hidden">
             {searchResults.length > 0 && (
                <div className="hidden md:grid grid-cols-12 p-3 bg-gray-50 border-b border-exchange-border text-xs font-bold text-gray-500 uppercase tracking-wider items-center">
                   <div className="col-span-2 px-1">匿名供应商</div>
                   <div className="col-span-2">现货库存 (件)</div>
                   <div className="col-span-1">批次 D/C</div>
                   <div className="col-span-2">发货时效</div>
                   <div className="col-span-1">管控</div>
                   <div className="col-span-2 md:text-right pr-4">含税单价</div>
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
                    <div className="col-span-2 font-mono text-sm max-w-full px-1">
                      <span className="bg-gray-100/80 px-2 py-1 rounded text-gray-700 border border-gray-200 truncate inline-block text-xs font-bold w-11/12">{row.supplier || "匿名机构 0X00"}</span>
                    </div>
                    <div className="col-span-2">
                      <div className="font-mono font-bold text-gray-900 text-lg">{row.qty.toLocaleString()}</div>
                    </div>
                    <div className="col-span-1 font-mono text-sm text-gray-600 font-medium">{row.year}</div>
                    <div className="col-span-2 text-sm text-gray-800 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-gray-400" /> {row.lead}
                    </div>
                    <div className="col-span-1 font-mono text-[10px]">
                      <span className="bg-yellow-50 text-yellow-800 px-1.5 py-1 rounded border border-yellow-200">{row.eccn}</span>
                    </div>
                    <div className="col-span-2 text-left md:text-right md:pr-4">
                      <div className="font-mono font-bold text-xl text-red-600">¥ {row.price.toFixed(2)}</div>
                    </div>
                    <div className="col-span-2 flex flex-col gap-2 w-full mt-2 md:mt-0 px-2 lg:px-4">
                      <button 
                        onClick={() => handleBuyNow(row)}
                        className="w-full px-3 py-2 bg-exchange-dark text-white text-sm font-bold rounded hover:bg-exchange-accent focus:ring-2 focus:ring-exchange-accent transition-colors shadow-sm whitespace-nowrap"
                      >
                        全额买断
                      </button>
                      <button 
                        onClick={() => handleNegotiate(row)}
                        className="w-full px-3 py-2 border border-exchange-border text-gray-700 text-sm font-bold rounded hover:border-gray-400 hover:bg-gray-50 focus:ring-2 outline-none transition-colors shadow-sm whitespace-nowrap"
                      >
                        申请议价
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
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
                  <span className="font-mono font-bold text-gray-900">{selectedRow.part}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">当前卖方挂牌价:</span>
                  <span className="font-mono font-bold text-red-600">¥ {selectedRow.price.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-700 mb-1">您的目标采购数量 (件)</label>
                  <input type="number" required min="1" max={selectedRow.qty} 
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
    </div>
  );
};

// ---------------------------------------------------------
// BUYER CENTER
// ---------------------------------------------------------
const BuyerCenter = ({ orders, negotiations, markOrderPaid, completeOrder, cancelOrder, setRole, showToast, setView }: any) => {
  const [activeTab, setActiveTab] = useState('orders');
  const [paymentModalOrder, setPaymentModalOrder] = useState<any>(null);

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
            <h2 className="text-2xl font-bold font-serif mb-6 text-gray-900 border-b pb-2">采购买断订单管理</h2>
            
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
                          <span className="font-mono font-medium text-exchange-dark">{ord.id}</span>
                        </div>
                        <div className="font-mono text-xs text-gray-400">{ord.date}</div>
                      </div>
                      
                      {ord.status === 'AWAITING_PAYMENT' && <span className="flex items-center gap-1.5 text-red-600 font-bold bg-red-50 border border-red-200 px-3 py-1 rounded-full text-xs animate-pulse"><AlertTriangle className="w-3.5 h-3.5"/> 等待对公打款注资</span>}
                      {ord.status === 'PAID_AWAITING_SHIPMENT' && <span className="flex items-center gap-1.5 text-blue-600 font-bold bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-xs"><Clock className="w-3.5 h-3.5"/> 款已锁定，单盲通知卖家发货中</span>}
                      {ord.status === 'QA_IN_TRANSIT' && <span className="flex items-center gap-1.5 text-orange-600 font-bold bg-orange-50 border border-orange-200 px-3 py-1 rounded-full text-xs"><ShieldCheck className="w-3.5 h-3.5"/> 卖家已发往平台，入仓质检中</span>}
                      {ord.status === 'COMPLETED' && <span className="flex items-center gap-1.5 text-green-600 font-bold bg-green-50 border border-green-200 px-3 py-1 rounded-full text-xs"><CheckCircle2 className="w-3.5 h-3.5"/> 交易完结</span>}
                    </div>
                    
                    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="font-mono text-xl font-bold mb-1 text-gray-900 border-l-4 border-exchange-accent pl-3">{ord.part}</div>
                        <div className="text-sm text-gray-500 pl-4 mt-2 bg-gray-50 py-1.5 px-3 rounded inline-block">
                          锁定交割数: <span className="font-mono font-bold text-gray-900">{ord.qty.toLocaleString()} 件</span>
                        </div>
                      </div>
                      <div className="text-left md:text-right border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                        <div className="text-xs text-gray-500 mb-1 uppercase font-bold">订单结算总金额 (含担保服务)</div>
                        <div className="font-mono text-3xl font-bold text-red-600">¥ {ord.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                      </div>
                    </div>
                    
                    {ord.status === 'AWAITING_PAYMENT' && (
                      <div className="bg-yellow-50/50 p-4 border-t border-exchange-border flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div className="text-xs text-yellow-800 flex items-center gap-2">
                          <CreditCard className="w-4 h-4"/> 请在24小时内向平台监管账户汇款完毕。
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
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
                            }}
                            className="flex-1 sm:flex-none px-6 py-2.5 bg-exchange-dark text-white text-sm font-bold rounded-lg shadow-lg hover:bg-exchange-accent transition-colors flex items-center justify-center gap-2"
                          >
                             模拟对公附言支付打款 <ChevronRight className="w-4 h-4"/>
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {ord.status === 'QA_IN_TRANSIT' && (
                      <div className="bg-orange-50/50 p-4 border-t border-exchange-border flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div className="text-xs text-orange-800 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4"/> 平台质检完成，已通过特安流转网络发往贵司。
                        </div>
                        <button 
                          onClick={() => {
                            completeOrder(ord.id);
                            showToast(`签收验货成功！交易流转完成，您的采购物料已入库，平台即将向卖家释放结算款。`);
                            setRole('seller');
                          }}
                          className="w-full sm:w-auto px-6 py-2.5 bg-green-600 text-white text-sm font-bold rounded-lg shadow-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                           模拟买家收货签收完结 <Check className="w-4 h-4"/>
                        </button>
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
             <h2 className="text-2xl font-bold font-serif mb-6 text-gray-900 border-b pb-2">我的议价流转状态</h2>
             {negotiations.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">暂无发送的议价协议</div>
             ) : (
                <div className="space-y-4">
                  {negotiations.map((neg: any) => (
                    <div key={neg.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-lg font-mono">{neg.part}</span>
                          {neg.status === 'PENDING' && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded border border-yellow-200 font-bold">等待卖家审批</span>}
                          {neg.status === 'ACCEPTED' && <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded border border-green-200 font-bold">卖家已接受</span>}
                        </div>
                        <div className="text-sm border-l-2 border-gray-200 pl-3">
                          <p className="text-gray-500 mb-1">我方提出的意向单价: <span className="font-mono text-red-600 font-bold">¥ {neg.offerPrice.toFixed(2)}</span> <span className="text-xs ml-2 line-through text-gray-400">原挂牌价 ¥ {neg.sellerPrice.toFixed(2)}</span></p>
                          <p className="text-gray-500">协议采购件数: <span className="font-mono font-medium">{neg.qty.toLocaleString()} 件</span></p>
                        </div>
                      </div>
                      
                      {neg.status === 'PENDING' && (
                        <div className="text-right text-xs text-gray-400">
                          由平台单盲协议机流转中...
                          <button onClick={()=>{setRole('seller'); showToast("已切换至卖家视角，请在左侧点击销售审批。")}} className="block mt-2 text-exchange-accent hover:underline text-sm font-bold">切换至卖家去审批(测试演示)</button>
                        </div>
                      )}
                      {neg.status === 'ACCEPTED' && (
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
      
      {/* 对公附言支付模态框 (Payment Modal) */}
      {paymentModalOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-yellow-50/50">
              <h3 className="font-bold text-lg flex items-center gap-2 text-yellow-900">
                <CreditCard className="w-5 h-5 text-yellow-600" /> 对公转账 / 平台收银台
              </h3>
              <button onClick={() => setPaymentModalOrder(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const id = paymentModalOrder.id;
              const total = paymentModalOrder.total;
              setPaymentModalOrder(null);
              markOrderPaid(id);
              showToast(`支付成功！货款 ¥${total.toLocaleString()} 已锁定在平台监管账户。已自动切至卖家视角，以便继续演示。`);
              setRole('seller');
            }} className="p-6">
              
              <div className="text-center mb-6">
                <div className="text-sm text-gray-500 mb-1">交易单号: {paymentModalOrder.id}</div>
                <div className="text-gray-500 text-sm">需支付全款 (含担保费、质检费)</div>
                <div className="text-4xl justify-center font-bold font-mono text-red-600 mt-2 flex items-baseline gap-1">
                  <span className="text-2xl">¥</span> {paymentModalOrder.total.toLocaleString(undefined, {minimumFractionDigits: 2})}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> 芯核交易中心官方资金监管账户
                </h4>
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between border-b border-blue-100 pb-2">
                    <span className="text-gray-500 font-sans">开户名</span>
                    <span className="font-bold text-gray-900">芯核交易平台（深圳）资金暂存专户</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-100 pb-2">
                    <span className="text-gray-500 font-sans">开户行</span>
                    <span className="font-bold text-gray-900">招商银行深圳科苑支行</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-100 pb-2">
                    <span className="text-gray-500 font-sans">企业账号</span>
                    <span className="font-bold text-gray-900 text-lg">7559 8888 6666 888</span>
                  </div>
                  <div className="flex justify-between items-center bg-blue-100/50 p-2 rounded -mx-2 px-2 mt-1 border border-blue-200 border-dashed">
                    <span className="text-blue-800 font-bold font-sans">网银转账必填附言码</span>
                    <span className="font-bold text-xl text-red-600 tracking-wider bg-white px-2 py-0.5 rounded shadow-sm">
                      {paymentModalOrder.id}
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
                <button type="button" onClick={() => setPaymentModalOrder(null)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors">
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
    </div>
  );
};

// ---------------------------------------------------------
// SELLER CENTER
// ---------------------------------------------------------
const SellerCenter = ({ inventory, orders, negotiations, acceptNegotiation, shipOrder, addInventory, updateInventoryPrice, showToast, setRole }: any) => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [shipModalOrder, setShipModalOrder] = useState<any>(null);
  const [priceModalItem, setPriceModalItem] = useState<any>(null);
  const [newPrice, setNewPrice] = useState("");

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
            {negotiations.filter((n:any)=>n.status==='PENDING').length > 0 && <span className="ml-auto bg-exchange-accent text-white text-[10px] px-2 py-0.5 font-bold rounded-full">{negotiations.filter((n:any)=>n.status==='PENDING').length}</span>}
          </button>
          <button onClick={() => setActiveTab('sales')} className={`w-full flex items-center px-4 py-3 rounded-lg font-bold transition-colors ${activeTab==='sales' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Truck className="w-4 h-4 mr-3" /> 发货与交易履约 
            {orders.filter((o:any)=>o.status==='PAID_AWAITING_SHIPMENT').length > 0 && <span className="ml-auto bg-orange-500 text-white text-[10px] px-2 py-0.5 font-bold rounded-full">需发货</span>}
          </button>
        </nav>
      </div>

      <div className="flex-1 space-y-6">
        {activeTab === 'inventory' && (
          <div className="animate-in fade-in">
             <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold font-serif text-gray-900">库存挂牌映射表</h2>
              <button 
                onClick={() => {
                  let newId = "inv_mock_" + Math.floor(Math.random() * 10000);
                  addInventory({ id: newId, part: "SIM-FPGA-99", qty: 2000, year: "2026", price: 155.00, eccn: "EAR99", lead: "现货", status: "Active", supplier: "当前卖家账户" });
                  showToast("模拟成功！系统已解析 Excel，为您增加了 1 条新挂牌型号(SIM-FPGA-99)。");
                }}
                className="px-4 py-2 bg-exchange-dark text-white text-sm font-bold rounded hover:bg-exchange-accent transition-colors shadow"
              >
                + 模拟 Excel 批量更新入库
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-exchange-border overflow-hidden">
              <div className="hidden sm:grid grid-cols-12 p-3 bg-gray-50 border-b border-exchange-border col-header text-gray-500">
                <div className="col-span-3">型号名称 (MPN)</div>
                <div className="col-span-2">冻结/可用库量</div>
                <div className="col-span-2">展示一口价</div>
                <div className="col-span-2">策略</div>
                <div className="col-span-3 text-right">状态</div>
              </div>
              <div className="divide-y divide-gray-100">
                {inventory.map((item: any) => (
                  <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 p-4 items-center hover:bg-slate-50 transition-colors gap-2 text-sm">
                    <div className="col-span-3 font-mono font-bold text-gray-900">{item.part}</div>
                    <div className="col-span-2 font-mono text-gray-700">{item.qty.toLocaleString()}</div>
                    <div className="col-span-2 font-mono text-red-600 font-medium">¥ {item.price.toFixed(2)}</div>
                    <div className="col-span-2 text-xs text-gray-500">接受议价</div>
                    <div className="col-span-3 text-left sm:text-right flex justify-start sm:justify-end gap-2 items-center">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      <span className="text-xs text-gray-500 mr-2">上架正常</span>
                      <button
                        onClick={() => {
                          setPriceModalItem(item);
                          setNewPrice(item.price.toString());
                        }}
                        className="text-xs text-gray-600 underline hover:text-black"
                      >调价</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'negotiations' && (
          <div className="animate-in fade-in">
             <h2 className="text-2xl font-bold font-serif mb-6 text-gray-900 border-b pb-2">正在询价的匿名协议</h2>
             {negotiations.filter((n:any)=>n.status==='PENDING').length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">完全清空，目前没有待审批议价。</div>
             ) : (
                <div className="space-y-4">
                  {negotiations.filter((n:any)=>n.status==='PENDING').map((neg: any) => (
                    <div key={neg.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                           <div className="text-sm font-bold text-gray-400 mb-1">来自 匿名采购商 的一口价申请</div>
                           <div className="font-mono text-xl font-bold text-gray-900">{neg.part}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">采购件数承诺</div>
                          <div className="font-mono text-lg font-bold">{neg.qty.toLocaleString()} 件</div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col md:flex-row items-center gap-6 bg-gray-50 p-4 rounded-lg mb-6">
                        <div className="flex-1 text-center md:text-left">
                          <div className="text-xs font-bold text-gray-500 mb-1">您挂牌单价</div>
                          <div className="font-mono text-xl line-through text-gray-400">¥ {neg.sellerPrice.toFixed(2)}</div>
                        </div>
                        <div className="text-gray-400"><ArrowRightLeft className="w-6 h-6"/></div>
                        <div className="flex-1 text-center md:text-right">
                          <div className="text-xs font-bold text-orange-600 mb-1">买方期望拿货价</div>
                          <div className="font-mono text-3xl font-bold text-red-600">¥ {neg.offerPrice.toFixed(2)}</div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                         <button className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-bold rounded hover:bg-gray-200">拒绝调价</button>
                         <button onClick={() => {
                            acceptNegotiation(neg.id);
                            showToast("已同意采购方报价！系统已自动生成待支付订单锁定此交易。");
                            setRole('buyer'); // Auto switch for prototype demo flow
                         }} className="flex-1 py-2.5 bg-exchange-dark text-white font-bold rounded shadow-lg hover:bg-exchange-accent">
                            接受此报价生成契约订单
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
             )}
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="animate-in fade-in">
             <h2 className="text-2xl font-bold font-serif mb-6 text-gray-900 border-b pb-2">销售与发货履约中心</h2>
             
             {orders.filter((o:any)=>o.status !== 'AWAITING_PAYMENT').length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">所有货款尚未到达监管账户，无需发货动作。</div>
             ) : (
                <div className="space-y-4">
                  {orders.filter((o:any)=>o.status !== 'AWAITING_PAYMENT').map((ord: any) => (
                    <div key={ord.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 p-3 border-b flex justify-between items-center text-sm">
                        <span className="font-mono text-gray-500 font-bold">关联单号: {ord.id}</span>
                        {ord.status === 'PAID_AWAITING_SHIPMENT' && <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">请立刻安排发货至平台</span>}
                        {ord.status === 'QA_IN_TRANSIT' && <span className="bg-green-100 text-green-800 px-2 py-0.5 border border-green-200 rounded text-xs font-bold">平台质检接收中，请静候拨款</span>}
                        {ord.status === 'COMPLETED' && <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded text-xs font-bold">交易完成/资金发放</span>}
                      </div>
                      
                      <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <div className="font-mono text-lg font-bold">{ord.part}</div>
                            <div className="text-sm text-gray-500 mt-1">要求履约：同批次, 供货 {ord.qty.toLocaleString()} 件</div>
                          </div>
                          <div className="text-right">
                             <div className="text-xs text-gray-500 mb-1">冻结在平台监管户的总汇款</div>
                             <div className="font-mono text-2xl font-bold text-green-600">¥ {ord.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                          </div>
                        </div>
                        
                        {ord.status === 'PAID_AWAITING_SHIPMENT' && (
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
                        
                        {ord.status === 'QA_IN_TRANSIT' && (
                          <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600 font-bold flex flex-col items-center gap-2">
                            <RefreshCcw className="w-6 h-6 animate-spin text-gray-400" />
                            正在等待平台显微镜拆包验真阶段... 
                            <span className="text-[11px] font-normal text-gray-400">(验证真伪后将采用顺丰特安件脱敏打乱后发往最终买家，买方签收后2H内打入您本行对公账户)</span>
                          </div>
                        )}
                        {ord.status === 'COMPLETED' && (
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
                <div className="text-gray-500">待发货物码: <span className="font-bold text-gray-900">{shipModalOrder.id}</span></div>
                <div className="text-gray-500">要求履约件数: <span className="font-bold text-exchange-accent">{shipModalOrder.qty.toLocaleString()} 件</span></div>
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
              showToast(`价格已更新！${priceModalItem.part} 新单价: ¥${Number(newPrice).toFixed(2)}`);
            }} className="p-6">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-5 text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">物料型号:</span>
                  <span className="font-mono font-bold text-gray-900">{priceModalItem.part}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">库存数量:</span>
                  <span className="font-mono font-medium">{priceModalItem.qty.toLocaleString()} 件</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">当前价格:</span>
                  <span className="font-mono font-bold text-red-600">¥ {priceModalItem.price.toFixed(2)}</span>
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
                  <span className="font-mono text-lg font-bold">¥ {((Number(newPrice) || 0) * priceModalItem.qty).toLocaleString()}</span>
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
    </div>
  );
};

export default function App() {
  const [currentView, setCurrentView] = useState("home");
  const [searchParams, setSearchParams] = useState("");
  const [toast, setToast] = useState("");
  const [role, setRole] = useState("buyer"); // buyer or seller for toggle logic
  
  // High-Level Global State simulating DB
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [negotiations, setNegotiations] = useState(INITIAL_NEGOTIATIONS);

  // DB Actions
  const handleSearch = (query: string) => {
    setSearchParams(query);
    setCurrentView('search');
  };

  const createOrder = (part: string, price: number, qty: number) => {
    const total = price * qty;
    const newOrder = {
      id: "ORD-" + Math.floor(Math.random() * 1000000),
      part, qty, total, status: 'AWAITING_PAYMENT',
      date: "刚刚 (2026-04-17)", type: 'DIRECT'
    };
    setOrders([newOrder, ...orders]);
  };

  const createNegotiation = (part: string, offerPrice: number, sellerPrice: number, qty: number) => {
    const newNeg = {
      id: "NEG-" + Math.floor(Math.random() * 10000),
      part, qty, offerPrice, sellerPrice, status: 'PENDING',
      date: "刚刚"
    };
    setNegotiations([newNeg, ...negotiations]);
  };

  const acceptNegotiation = (id: string) => {
    const neg = negotiations.find(n => n.id === id);
    if(neg) {
      // update neg
      setNegotiations(negotiations.map(n => n.id === id ? {...n, status: 'ACCEPTED'} : n));
      // spawn an order instantly because of the hard rule
      createOrder(neg.part, neg.offerPrice, neg.qty);
    }
  };

  const markOrderPaid = (id: string) => {
    setOrders(orders.map(o => o.id === id ? {...o, status: 'PAID_AWAITING_SHIPMENT'} : o));
  };
  
  const shipOrder = (id: string) => {
    setOrders(orders.map(o => o.id === id ? {...o, status: 'QA_IN_TRANSIT'} : o));
  };

  const completeOrder = (id: string) => {
    const ord = orders.find(o => o.id === id);
    if (ord) {
      setOrders(orders.map(o => o.id === id ? {...o, status: 'COMPLETED'} : o));
      // 减掉库存模拟真实出库
      setInventory(inventory.map(inv => inv.part === ord.part ? { ...inv, qty: Math.max(0, inv.qty - ord.qty) } : inv));
    }
  };

  const cancelOrder = (id: string) => {
    setOrders(orders.filter(o => o.id !== id));
  };

  const addInventory = (newItem: any) => {
    setInventory([newItem, ...inventory]);
  };

  const updateInventoryPrice = (id: string, newPrice: number) => {
    setInventory(inventory.map(item => item.id === id ? { ...item, price: newPrice } : item));
  };

  return (
    <div className="min-h-screen flex flex-col bg-exchange-surface font-sans text-exchange-dark selection:bg-exchange-accent selection:text-white">
      <Navbar view={currentView} setView={setCurrentView} currentRole={role} setRole={setRole} />
      
      <main className="flex-grow">
        {currentView === 'home' && <HomeView setView={setCurrentView} handleSearch={handleSearch} />}
        {currentView === 'search' && <SearchView currentQuery={searchParams} setView={setCurrentView} showToast={setToast} inventory={inventory} createOrder={createOrder} createNegotiation={createNegotiation} />}
        {currentView === 'buyer-center' && <BuyerCenter orders={orders} negotiations={negotiations} markOrderPaid={markOrderPaid} completeOrder={completeOrder} cancelOrder={cancelOrder} showToast={setToast} setRole={setRole} setView={setCurrentView} />}
        {currentView === 'seller-center' && <SellerCenter orders={orders} negotiations={negotiations} inventory={inventory} acceptNegotiation={acceptNegotiation} shipOrder={shipOrder} addInventory={addInventory} updateInventoryPrice={updateInventoryPrice} showToast={setToast} setRole={setRole} />}
      </main>

      <Footer />
      <Toast msg={toast} onClose={() => setToast("")} />
    </div>
  );
}
