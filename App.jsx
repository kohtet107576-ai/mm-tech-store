import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, Gamepad2, Smartphone, BookOpen, Settings, 
  History, ChevronRight, ArrowLeft, CheckCircle2, Search, 
  Loader2, Star, RefreshCw, Layers 
} from 'lucide-react';

// --- CONFIGURATION ---
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyC1MECq8ZNzdj-RxmBaMcFfSqVk9Ijt9uuRW-szeukWuCoNBhywDz0k7W1r5mCvjhR/exec"; 

export default function App() {
  const [view, setView] = useState('welcome');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null); // နာမည်တူစုထားသော ပစ္စည်းအုပ်စု
  const [selectedPlan, setSelectedPlan] = useState(null);   // ရွေးချယ်လိုက်သော Plan တိတိကျကျ
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'Game', name: 'Game', icon: <Gamepad2 size={20} /> },
    { id: 'Digital product', name: 'Digital Product', icon: <Smartphone size={20} /> },
    { id: 'Online class', name: 'Online Class', icon: <BookOpen size={20} /> },
    { id: 'Gsm reseller', name: 'GSM Reseller', icon: <Settings size={20} /> }
  ];

  // --- Utility Functions ---
  const getPProp = (p, key) => {
    if (!p) return "";
    return p[key] || p[key.toLowerCase()] || p[key.toUpperCase()] || "";
  };

  const formatImageUrl = (url) => {
    if (!url || typeof url !== 'string' || url.trim() === "") return "https://placehold.co/400x400/112240/ffffff?text=MM+Tech";
    const driveMatch = url.match(/(?:id=|\/d\/|src=)([\w-]{25,})/);
    if (driveMatch && driveMatch[1]) return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
    return url;
  };

  // --- Grouping Logic: ပစ္စည်းနာမည်တူတာတွေကို စုလိုက်ခြင်း ---
  const groupedData = useMemo(() => {
    const groups = {};
    products.forEach(p => {
      const name = getPProp(p, 'Name');
      if (!groups[name]) {
        groups[name] = {
          name: name,
          category: getPProp(p, 'Category'),
          image: getPProp(p, 'Link'),
          plans: []
        };
      }
      groups[name].plans.push(p);
    });
    return Object.values(groups);
  }, [products]);

  // --- Data Fetching ---
  useEffect(() => {
    if (view === 'home' || view === 'products') fetchData();
  }, [view]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(SCRIPT_URL);
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async () => {
    setLoading(true);
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          productName: getPProp(selectedPlan, 'Name') + " (" + (getPProp(selectedPlan, 'Plan') || "") + ")",
          price: getPProp(selectedPlan, 'Price'),
          fullName: "Web Customer"
        })
      });
      setView('order_success');
    } catch (e) {
      setView('order_success'); 
    } finally {
      setLoading(false);
    }
  };

  // --- VIEW: Welcome ---
  if (view === 'welcome') return (
    <div className="flex flex-col min-h-[100dvh] bg-[#0a192f] items-center justify-between py-12 px-8 w-full border-x border-blue-900/20 max-w-2xl mx-auto">
      <div className="flex flex-col items-center pt-10">
        <div className="w-32 h-32 bg-[#112240] rounded-[2.5rem] flex items-center justify-center border border-blue-500/20 shadow-2xl mb-8 overflow-hidden">
          <img src="https://placehold.co/300x300/112240/ffffff?text=MM+TECH" alt="Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2">MM Tech Store</h1>
        <p className="text-slate-400 text-sm leading-relaxed max-w-[280px] text-center">
          လူကြီးမင်း အလိုရှိတဲ့ Digital Products များကို <br/> စျေးနှုန်းချိုသာစွာဖြင့် ဝယ်ယူနိုင်ပါပြီ။
        </p>
      </div>

      <div className="w-full max-w-xs space-y-6">
        <button onClick={() => setView('home')} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
          🚀 Start Shopping <ChevronRight size={20} />
        </button>
        <div className="flex items-center justify-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
          <Star size={14} className="text-yellow-500" /> Grand Opening Promo
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        <a href="#" className="bg-[#112240] py-3 rounded-xl border border-blue-900/50 text-[10px] font-black text-blue-400 text-center uppercase tracking-widest">စုံ/မ စစ်ဆေးရန်</a>
        <a href="#" className="bg-[#112240] py-3 rounded-xl border border-blue-900/50 text-[10px] font-black text-blue-400 text-center uppercase tracking-widest">CEIR စစ်ဆေးရန်</a>
      </div>
    </div>
  );

  // --- VIEW: Home ---
  if (view === 'home') return (
    <div className="flex flex-col min-h-[100dvh] bg-[#0a192f] w-full max-w-2xl mx-auto pb-24">
      {/* Header with Search (BlueLamp Style) */}
      <div className="bg-[#0d1b33] p-6 rounded-b-[2rem] shadow-xl border-b border-blue-900/30 sticky top-0 z-30">
        <div className="flex justify-between items-center mb-6">
          <div className="text-left">
            <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mb-1">Premium Store</p>
            <h2 className="text-2xl font-black text-white">MM Tech Store</h2>
          </div>
          <button onClick={fetchData} className={`p-2.5 rounded-2xl bg-blue-600/10 text-blue-400 ${loading && 'animate-spin'}`}>
            <RefreshCw size={20}/>
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search for products..." 
            className="w-full bg-[#0a192f] border border-blue-900/50 text-white py-4 pl-12 pr-4 rounded-2xl outline-none focus:ring-2 ring-blue-500/30 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-5 py-8">
        {/* Categories Grid (Clean Square Icons) */}
        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-5 ml-2">Categories</h3>
        <div className="grid grid-cols-2 gap-4 mb-10">
          {categories.map(c => (
            <button 
              key={c.id} 
              onClick={() => { setSelectedCat(c.id); setView('products'); }}
              className="bg-[#112240] p-6 rounded-[2rem] flex flex-col items-center gap-3 border border-transparent active:border-blue-500 transition-all text-white shadow-lg"
            >
              <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-400">{c.icon}</div>
              <span className="text-xs font-bold text-slate-300">{c.name}</span>
            </button>
          ))}
        </div>

        {/* Grouped Popular Items (3-Column Grid) */}
        <div className="flex justify-between items-center mb-5 ml-2">
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Popular Products</h3>
            <span className="h-[2px] bg-blue-600/20 flex-1 ml-4 rounded-full"></span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {groupedData.length > 0 ? (
            groupedData
              .filter(g => searchQuery === '' || g.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(group => (
                <div 
                  key={group.name} 
                  onClick={() => { setSelectedGroup(group); setView('group_details'); }}
                  className="bg-[#112240] p-2.5 rounded-2xl border border-blue-900/20 active:scale-95 transition-all text-center flex flex-col group cursor-pointer"
                >
                  <div className="aspect-square bg-[#0a192f] rounded-xl overflow-hidden border border-blue-900/30 mb-2 relative">
                    <img 
                      src={formatImageUrl(group.image)} 
                      alt="" 
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                    <div className="absolute top-1 right-1 bg-blue-600 px-1.5 py-0.5 rounded-md text-[8px] font-black text-white shadow-lg">
                        {group.plans.length} Plans
                    </div>
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-white text-[10px] font-bold truncate leading-tight">{group.name}</h4>
                    <span className="text-slate-500 text-[9px] block mt-1 uppercase tracking-tighter">{group.category}</span>
                  </div>
                </div>
              ))
          ) : (
            <div className="col-span-3 py-10 text-center">
              <Loader2 className="animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-slate-600 text-[10px] italic">Updating store...</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0a192f]/80 backdrop-blur-xl border-t border-blue-900/20 p-5 flex justify-around items-center z-50 max-w-2xl mx-auto rounded-t-3xl">
        <button onClick={() => setView('home')} className="text-blue-500"><ShoppingBag size={28} /></button>
        <button className="text-slate-600"><History size={28} /></button>
        <button onClick={() => setView('welcome')} className="text-slate-600"><Settings size={28} /></button>
      </nav>
    </div>
  );

  return (
    <div className="bg-[#0a192f] min-h-[100dvh]">
      {/* Category View (Filtered Groups) */}
      {view === 'products' && (
        <div className="flex flex-col min-h-[100dvh] bg-[#0a192f] max-w-2xl mx-auto pb-24">
          <header className="p-6 bg-[#112240] border-b border-blue-900/30 flex items-center gap-4 sticky top-0 z-30 shadow-lg text-white">
            <button onClick={() => setView('home')} className="p-2 bg-[#0a192f] rounded-xl active:scale-90 transition-transform"><ArrowLeft size={20}/></button>
            <h2 className="text-xl font-black tracking-tight">{selectedCat}</h2>
          </header>
          <div className="p-5">
            <div className="grid grid-cols-3 gap-3">
              {groupedData.filter(g => g.category === selectedCat).map(group => (
                <div 
                  key={group.name} 
                  onClick={() => { setSelectedGroup(group); setView('group_details'); }}
                  className="bg-[#112240] p-2.5 rounded-2xl border border-blue-900/20 active:scale-95 transition-all text-center flex flex-col"
                >
                  <div className="aspect-square bg-[#0a192f] rounded-xl overflow-hidden border border-blue-900/30 mb-2">
                    <img src={formatImageUrl(group.image)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <h4 className="text-white text-[10px] font-bold truncate leading-tight">{group.name}</h4>
                  <p className="text-blue-400 text-[9px] mt-1 font-bold italic">{group.plans.length} items</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Group Details View: Here we show PLANS (Diamonds, etc) */}
      {view === 'group_details' && (
        <div className="flex flex-col min-h-[100dvh] bg-[#0a192f] max-w-2xl mx-auto text-white">
          <div className="relative h-[40vh] bg-[#112240]">
            <img src={formatImageUrl(selectedGroup?.image)} className="w-full h-full object-cover opacity-60" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a192f] via-transparent to-transparent"></div>
            <button onClick={() => setView('home')} className="absolute top-6 left-6 p-3 bg-black/30 backdrop-blur-lg rounded-2xl border border-white/10 active:scale-90"><ArrowLeft size={20}/></button>
          </div>
          
          <div className="px-8 -mt-16 relative z-10 flex-1 flex flex-col">
            <div className="mb-8 text-left">
                <span className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-full text-[8px] font-black uppercase tracking-widest mb-4 inline-block">{selectedGroup?.category}</span>
                <h2 className="text-4xl font-black mb-1 leading-tight tracking-tight">{selectedGroup?.name}</h2>
                <p className="text-slate-400 text-sm italic">Available Plans & Pricing</p>
            </div>
            
            {/* CLEAN PLAN LIST */}
            <div className="space-y-3 mb-10 flex-1 overflow-y-auto max-h-[40vh] pr-1">
              {selectedGroup?.plans.map((p, idx) => (
                <button 
                  key={idx} 
                  onClick={() => { setSelectedPlan(p); setView('details'); }}
                  className="w-full bg-[#112240] p-5 rounded-3xl border border-blue-900/30 flex items-center justify-between active:border-blue-500 transition-all text-left shadow-lg group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-400 group-active:bg-blue-600 group-active:text-white transition-colors">
                        <ShoppingBag size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-100">{getPProp(p, 'Plan')}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Instant Delivery</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-blue-500 font-black text-sm">{getPProp(p, 'Price')} Ks</span>
                    <ChevronRight size={16} className="text-slate-700" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Final Order Confirmation (Details) */}
      {view === 'details' && (
        <div className="flex flex-col min-h-[100dvh] bg-[#0a192f] max-w-2xl mx-auto text-white">
          <header className="p-6 flex items-center gap-4 bg-[#112240] border-b border-blue-900/30 shadow-lg text-white">
            <button onClick={() => setView('group_details')} className="p-2 bg-[#0a192f] rounded-xl active:scale-90"><ArrowLeft size={20}/></button>
            <h2 className="text-xl font-black">Confirm Order</h2>
          </header>
          
          <div className="p-8 flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="text-left">
                <div className="bg-[#112240] p-8 rounded-[3rem] border border-blue-900/30 mb-8 flex flex-col items-center text-center">
                    <div className="w-32 h-32 rounded-[2rem] overflow-hidden mb-6 border border-blue-500/20 shadow-xl">
                        <img src={formatImageUrl(getPProp(selectedPlan, 'Link'))} className="w-full h-full object-cover" alt="" />
                    </div>
                    <h3 className="text-2xl font-black mb-1">{getPProp(selectedPlan, 'Name')}</h3>
                    <p className="text-blue-400 font-bold mb-4">{getPProp(selectedPlan, 'Plan')}</p>
                    <div className="text-3xl font-black text-white">{getPProp(selectedPlan, 'Price')} Ks</div>
                </div>

                <div className="bg-[#112240]/50 p-6 rounded-3xl border border-blue-900/10 mb-8">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Description</h4>
                    <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">{getPProp(selectedPlan, 'Des')}</p>
                </div>
            </div>

            <button 
              onClick={handleOrder} 
              disabled={loading} 
              className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white shadow-xl active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3 text-lg mb-10"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Confirm Order Now"}
            </button>
          </div>
        </div>
      )}

      {/* Success View */}
      {view === 'order_success' && (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center p-10 text-center text-white bg-[#0a192f] max-w-2xl mx-auto">
          <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-8 animate-bounce border border-green-500/20">
            <CheckCircle2 size={60} className="text-green-500" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4">Success!</h2>
          <p className="text-slate-400 mb-12 text-sm leading-relaxed">
            လူကြီးမင်း၏ အော်ဒါတင်ခြင်း အောင်မြင်ပါတယ်ရှင့်။ <br/> 
            ပစ္စည်းအား Telegram မှတစ်ဆင့် ပို့ဆောင်ပေးပါမည်။
          </p>
          <button onClick={() => setView('home')} className="w-full bg-[#112240] py-4 rounded-2xl font-black text-blue-400 border border-blue-900/50 active:scale-95 shadow-lg">Back to Home</button>
        </div>
      )}
    </div>
  );
}
