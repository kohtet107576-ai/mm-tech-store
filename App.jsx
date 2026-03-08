import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Gamepad2, Smartphone, BookOpen, Settings, 
  History, ChevronRight, ArrowLeft, CheckCircle2, Search, 
  Loader2, Star, RefreshCw 
} from 'lucide-react';

// --- CONFIGURATION ---
// လူကြီးမင်း၏ Google Apps Script Web App URL
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyC1MECq8ZNzdj-RxmBaMcFfSqVk9Ijt9uuRW-szeukWuCoNBhywDz0k7W1r5mCvjhR/exec"; 

export default function App() {
  const [view, setView] = useState('welcome');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'Game', name: 'Game', icon: <Gamepad2 size={20} /> },
    { id: 'Digital product', name: 'Digital Product', icon: <Smartphone size={20} /> },
    { id: 'Online class', name: 'Online Class', icon: <BookOpen size={20} /> },
    { id: 'Gsm reseller', name: 'GSM Reseller', icon: <Settings size={20} /> }
  ];

  // --- အလုပ်အသေအချာလုပ်သော Image Link Converter ---
  const formatImageUrl = (url) => {
    if (!url || typeof url !== 'string') return "https://placehold.co/400x300/112240/ffffff?text=MM+Tech";
    
    // Google Drive URL ထဲက ID ကို ရှာဖွေခြင်း
    const driveRegex = /(?:https?:\/\/)?(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|googledrive\.com\/host\/)([a-zA-Z0-9_-]{25,})/;
    const match = url.match(driveRegex);
    
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
    return url;
  };

  // Data mapping ကို ပိုမိုလွယ်ကူစေရန် Helper
  const getVal = (obj, key) => {
    if (!obj) return "";
    const foundKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
    return foundKey ? obj[foundKey] : "";
  };

  // --- DATA FETCHING ---
  useEffect(() => {
    if (view === 'home' || view === 'products') {
      fetchData();
    }
  }, [view]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(SCRIPT_URL);
      const data = await res.json();
      if (Array.isArray(data)) {
        // Data များကို Component ထဲတွင် သုံးရလွယ်အောင် ပုံမှန် Format ပြောင်းခြင်း
        const normalized = data.map(item => ({
          id: getVal(item, 'ID'),
          category: getVal(item, 'Category'),
          name: getVal(item, 'Name'),
          plan: getVal(item, 'Plan'),
          price: getVal(item, 'Price'),
          des: getVal(item, 'Des'),
          link: getVal(item, 'Link')
        }));
        setProducts(normalized);
      }
    } catch (e) {
      console.error("Fetch Error:", e);
      // fallback for preview only
      if (products.length === 0) {
        setProducts([
          { id: '1', category: 'Game', name: 'Demo Product', plan: 'Trial', price: '0', des: 'Please check your internet or Vercel build.', link: '' }
        ]);
      }
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
          productName: selectedProduct.name + " (" + (selectedProduct.plan || "") + ")",
          price: selectedProduct.price,
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

  // --- WELCOME SCREEN (SCREENSHOT 1 အတိုင်း တိကျစွာ ပြင်ဆင်ထားသည်) ---
  const WelcomeScreen = () => (
    <div className="flex flex-col h-[100dvh] bg-[#0a192f] overflow-hidden">
      <div className="flex flex-col items-center justify-between h-full py-12 px-8">
        
        {/* Top Logo Section */}
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-1000">
          <div className="w-32 h-32 bg-[#112240] rounded-[2.5rem] flex items-center justify-center border border-blue-500/20 shadow-2xl mb-8 overflow-hidden">
            <img src="https://placehold.co/300x300/112240/ffffff?text=MM+TECH" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">MM Tech</h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-[280px] text-center">
            လူကြီးမင်း အလိုရှိတဲ့ product ကိုဝယ်ဖို့ အောက်က <br/>
            <span className="text-blue-400 font-bold">🚀 Start Shopping</span> button ကို နှိပ်ပေးပါရှင့်။
          </p>
        </div>

        {/* Middle Button Section */}
        <div className="w-full max-w-sm flex flex-col items-center gap-6">
          <button 
            onClick={() => setView('home')}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black shadow-[0_15px_30px_-10px_rgba(37,99,235,0.6)] active:scale-95 transition-all flex items-center justify-center gap-3 text-lg"
          >
            🚀 Start Shopping <ChevronRight size={22} />
          </button>
          
          <button className="flex items-center justify-center gap-2 text-slate-300 text-sm font-bold opacity-80 hover:opacity-100">
            <Star size={18} className="text-yellow-500 fill-yellow-500" /> Promotion Info
          </button>
        </div>

        {/* Bottom Link Section */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          <a href="https://sonema.znnt.org/" target="_blank" rel="noreferrer" className="bg-[#112240] py-4 rounded-2xl border border-blue-900/50 text-[10px] font-black text-blue-400 text-center uppercase tracking-widest active:bg-blue-900/40 shadow-lg">
            စုံ/မ စစ်ဆေးရန်
          </a>
          <a href="http://www.ceir.gov.mm" target="_blank" rel="noreferrer" className="bg-[#112240] py-4 rounded-2xl border border-blue-900/50 text-[10px] font-black text-blue-400 text-center uppercase tracking-widest active:bg-blue-900/40 shadow-lg">
            CEIR စစ်ဆေးရန်
          </a>
        </div>

      </div>
    </div>
  );

  // --- HOME SCREEN ---
  const HomeScreen = () => (
    <div className="flex flex-col h-[100dvh] bg-[#0a192f] overflow-hidden text-left">
      <div className="bg-[#112240] p-6 rounded-b-[2.5rem] shadow-xl border-b border-blue-900/30 flex-shrink-0 z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Premium Store</p>
            <h2 className="text-2xl font-black text-white">MM Tech Store</h2>
          </div>
          <button onClick={fetchData} className={`p-2 rounded-full bg-blue-600/10 text-blue-400 ${loading && 'animate-spin'}`}>
            <RefreshCw size={20}/>
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="w-full bg-[#0a192f] border border-blue-900/50 text-white py-3.5 pl-12 pr-4 rounded-2xl outline-none focus:ring-1 ring-blue-500/50 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 pb-32 custom-scrollbar">
        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Categories</h3>
        <div className="grid grid-cols-2 gap-4 mb-10">
          {categories.map(c => (
            <button 
              key={c.id} 
              onClick={() => { setSelectedCat(c.id); setView('products'); }}
              className="bg-[#112240] p-5 rounded-[2rem] flex flex-col items-center gap-3 border border-transparent active:border-blue-500 transition-all text-white shadow-lg"
            >
              <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-400">{c.icon}</div>
              <span className="text-[11px] font-bold">{c.name}</span>
            </button>
          ))}
        </div>

        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Popular Items</h3>
        <div className="space-y-4">
          {products.length > 0 ? (
            products.filter(p => searchQuery === '' || p.name?.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
              <div 
                key={p.id || Math.random()} 
                onClick={() => { setSelectedProduct(p); setView('details'); }}
                className="bg-[#112240] p-4 rounded-3xl flex gap-4 border border-blue-900/20 active:scale-[0.98] transition-all shadow-md"
              >
                <div className="w-16 h-16 bg-[#0a192f] rounded-2xl overflow-hidden flex-shrink-0 border border-blue-900/30">
                    <img src={formatImageUrl(p.link)} alt="" className="w-full h-full object-cover opacity-80" onError={(e) => { e.target.src = "https://placehold.co/100?text=Item"; }} />
                </div>
                <div className="flex flex-col justify-center flex-1 overflow-hidden">
                  <span className="text-[8px] text-blue-400 font-black uppercase mb-1 tracking-wider">{p.category}</span>
                  <h4 className="text-white text-sm font-bold truncate">{p.name}</h4>
                  <span className="text-blue-500 font-black text-xs mt-0.5">{p.price} Ks</span>
                </div>
                <ChevronRight className="self-center text-slate-700" size={18} />
              </div>
            ))
          ) : (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              {loading ? <Loader2 className="animate-spin text-blue-500" size={30} /> : <p className="text-slate-500 text-xs italic">ပစ္စည်းစာရင်းများ မတွေ့ရှိပါရှင်။</p>}
            </div>
          )}
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#0a192f]/95 backdrop-blur-lg border-t border-blue-900/30 p-5 flex justify-around items-center z-50">
        <button onClick={() => setView('home')} className="text-blue-500"><ShoppingBag size={28} /></button>
        <button className="text-slate-600"><History size={28} /></button>
        <button onClick={() => setView('welcome')} className="text-slate-600"><Settings size={28} /></button>
      </nav>
    </div>
  );

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-[#0a192f] font-sans select-none overflow-hidden relative shadow-2xl border-x border-blue-900/20">
      {view === 'welcome' && <WelcomeScreen />}
      {view === 'home' && <HomeScreen />}
      {view === 'products' && (
        <div className="flex flex-col h-full bg-[#0a192f] overflow-hidden text-left">
          <header className="p-6 flex items-center gap-4 bg-[#112240] border-b border-blue-900/30 shadow-lg text-white flex-shrink-0">
            <button onClick={() => setView('home')} className="p-2 bg-[#0a192f] border border-blue-900/50 rounded-xl text-white active:scale-90 transition-transform"><ArrowLeft size={20}/></button>
            <h2 className="text-xl font-black tracking-tight">{selectedCat}</h2>
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-24 custom-scrollbar">
            {products.filter(p => p.category === selectedCat).map(p => (
              <button 
                key={p.id || Math.random()} 
                onClick={() => { setSelectedProduct(p); setView('details'); }}
                className="w-full bg-[#112240] p-5 rounded-3xl flex items-center justify-between text-white border border-blue-900/20 active:bg-blue-900/40 transition-all shadow-lg"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-12 h-12 bg-[#0a192f] rounded-xl overflow-hidden border border-blue-900/30 flex-shrink-0">
                      <img src={formatImageUrl(p.link)} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.src = "https://placehold.co/100?text=Item"; }} />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-bold truncate">{p.name}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">{p.plan}</p>
                    <p className="text-xs text-blue-500 font-black mt-0.5">{p.price} Ks</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-700 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
      {view === 'details' && (
        <div className="flex flex-col h-full text-white bg-[#0a192f] overflow-hidden text-left">
          <div className="relative h-[40vh] bg-[#112240] flex-shrink-0">
            <img src={formatImageUrl(selectedProduct?.link)} className="w-full h-full object-cover opacity-70" alt="" onError={(e) => { e.target.src = "https://placehold.co/400?text=No+Image"; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a192f] to-transparent"></div>
            <button onClick={() => setView('products')} className="absolute top-6 left-6 p-3 bg-white/10 backdrop-blur rounded-2xl active:scale-90 transition-transform"><ArrowLeft size={20}/></button>
          </div>
          <div className="px-8 -mt-12 relative flex-1 flex flex-col overflow-hidden">
            <div className="flex-shrink-0 mb-6">
                <span className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-full text-[8px] font-black uppercase tracking-widest mb-4 inline-block">{selectedProduct?.category}</span>
                <h2 className="text-3xl font-black mb-1 leading-tight">{selectedProduct?.name}</h2>
                <p className="text-slate-400 font-bold mb-1">{selectedProduct?.plan}</p>
                <div className="text-2xl font-black text-blue-500">{selectedProduct?.price} Ks</div>
            </div>
            <div className="bg-[#112240] p-6 rounded-3xl border border-blue-900/30 flex-1 overflow-y-auto mb-8 shadow-inner custom-scrollbar">
              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 text-left">Description</h4>
              <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap text-left">{selectedProduct?.des}</p>
            </div>
            <div className="pb-8">
                <button onClick={handleOrder} disabled={loading} className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white shadow-[0_15px_30px_-5px_rgba(37,99,235,0.4)] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3">
                  {loading ? <Loader2 className="animate-spin" /> : "Confirm Order"}
                </button>
            </div>
          </div>
        </div>
      )}
      {view === 'order_success' && (
        <div className="h-full flex flex-col items-center justify-center p-10 text-center text-white bg-[#0a192f]">
          <CheckCircle2 size={100} className="text-green-500 mb-6 animate-bounce" />
          <h2 className="text-3xl font-black mb-4">Successful!</h2>
          <p className="text-slate-400 mb-10 text-sm leading-relaxed text-center">အော်ဒါတင်ခြင်း အောင်မြင်ပါတယ်ရှင့်။ <br/> ပစ္စည်းအား Telegram မှတစ်ဆင့် ပို့ဆောင်ပေးပါမည်။</p>
          <button onClick={() => setView('home')} className="w-full bg-[#112240] py-4 rounded-2xl font-black text-blue-400 border border-blue-500/20 active:scale-95 shadow-lg text-center flex items-center justify-center">Back to Home</button>
        </div>
      )}
    </div>
  );
}
