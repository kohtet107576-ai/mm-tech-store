import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Gamepad2, Smartphone, BookOpen, Settings, 
  History, ChevronRight, ArrowLeft, CheckCircle2, Search, 
  Loader2, Star, RefreshCw 
} from 'lucide-react';

// --- CONFIGURATION ---
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyC1MECq8ZNzdj-RxmBaMcFfSqVk9Ijt9uuRW-szeukWuCoNBhywDz0k7W1r5mCvjhR/exec"; 

export default function App() {
  const [view, setView] = useState('welcome');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'Game', name: 'Game', icon: <Gamepad2 size={18} /> },
    { id: 'Digital product', name: 'Digital Product', icon: <Smartphone size={18} /> },
    { id: 'Online class', name: 'Online Class', icon: <BookOpen size={18} /> },
    { id: 'Gsm reseller', name: 'GSM Reseller', icon: <Settings size={18} /> }
  ];

  // --- NEW IMAGE HANDLING METHOD ---
  const formatImageUrl = (url) => {
    if (!url || typeof url !== 'string' || url.trim() === "") {
        return "https://placehold.co/400x400/112240/ffffff?text=MM+Tech";
    }
    
    // Google Drive ID Extraction Regex
    const driveMatch = url.match(/(?:id=|\/d\/|src=)([\w-]{25,})/);
    if (driveMatch && driveMatch[1]) {
      // Use direct link for Google Drive images
      return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
    }
    
    // If not a drive link, return original
    return url;
  };

  const getPProp = (p, key) => {
    if (!p) return "";
    return p[key] || p[key.toLowerCase()] || p[key.toUpperCase()] || "";
  };

  // --- DATA FETCHING ---
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
      console.error("Connection Error:", e);
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
          productName: getPProp(selectedProduct, 'Name') + " (" + (getPProp(selectedProduct, 'Plan') || "") + ")",
          price: getPProp(selectedProduct, 'Price'),
          fullName: "Web User"
        })
      });
      setView('order_success');
    } catch (e) {
      setView('order_success'); 
    } finally {
      setLoading(false);
    }
  };

  // --- WELCOME SCREEN (FIXED FOR SCREENSHOT 1 LOOK) ---
  const WelcomeScreen = () => (
    <div className="flex flex-col min-h-screen bg-[#0a192f] text-center border-x border-blue-900/20 max-w-md mx-auto relative overflow-hidden">
      {/* Top Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-blue-600/10 blur-[100px] pointer-events-none"></div>
      
      {/* Top Content */}
      <div className="flex flex-col items-center pt-16 px-8 z-10">
        <div className="w-32 h-32 bg-[#112240] rounded-[2.5rem] flex items-center justify-center border border-blue-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] mb-8 overflow-hidden">
          <img src="https://placehold.co/300x300/112240/ffffff?text=MM+TECH" alt="Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-4xl font-black text-white mb-3 tracking-tight">MM Tech မှ ကြိုဆိုပါတယ်ရှင့်</h1>
        <p className="text-slate-400 text-sm leading-relaxed max-w-[280px]">
          လူကြီးမင်း အလိုရှိတဲ့ product ကိုဝယ်ဖို့ အောက်က <br/>
          🚀 <span className="text-blue-400 font-bold">Start Shopping</span> button ကို နှိပ်ပေးပါရှင့်။
        </p>
      </div>

      {/* Middle Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-10 z-10">
        <button 
          onClick={() => setView('home')}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black shadow-[0_15px_35px_-5px_rgba(37,99,235,0.4)] active:scale-95 transition-all text-lg flex items-center justify-center gap-3"
        >
          🚀 Start Shopping <ChevronRight size={22} />
        </button>
        
        <button className="mt-6 flex items-center justify-center gap-2 text-slate-300 text-sm font-bold opacity-80 animate-pulse">
          <Star size={18} className="text-yellow-500 fill-yellow-500" /> MM Tech Grand Opening Promotion
        </button>
      </div>

      {/* Bottom Content (Fixed at very bottom) */}
      <div className="p-8 pb-12 z-10">
        <div className="grid grid-cols-2 gap-4 w-full">
          <a href="https://sonema.znnt.org/" target="_blank" rel="noreferrer" className="bg-[#112240] py-4 rounded-xl border border-blue-900/50 text-[10px] font-black text-blue-400 text-center uppercase tracking-widest active:bg-blue-900/40 shadow-lg transition-all">စုံ/မ စစ်ဆေးရန်</a>
          <a href="http://www.ceir.gov.mm" target="_blank" rel="noreferrer" className="bg-[#112240] py-4 rounded-xl border border-blue-900/50 text-[10px] font-black text-blue-400 text-center uppercase tracking-widest active:bg-blue-900/40 shadow-lg transition-all">CEIR စစ်ဆေးရန်</a>
        </div>
      </div>
    </div>
  );

  const HomeScreen = () => (
    <div className="flex flex-col min-h-screen bg-[#0a192f] max-w-md mx-auto">
      {/* Sticky Header */}
      <div className="bg-[#112240] p-6 rounded-b-[2.5rem] shadow-xl border-b border-blue-900/30 sticky top-0 z-20">
        <div className="flex justify-between items-center mb-6">
          <div className="text-left">
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

      <div className="p-4 pb-32">
        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4 text-left px-1">Categories</h3>
        <div className="grid grid-cols-2 gap-3 mb-10">
          {categories.map(c => (
            <button key={c.id} onClick={() => { setSelectedCat(c.id); setView('products'); }} className="bg-[#112240] p-4 rounded-3xl flex flex-col items-center gap-2 border border-transparent active:border-blue-500 transition-all text-white shadow-lg">
              <div className="p-2.5 bg-blue-600/10 rounded-2xl text-blue-400">{c.icon}</div>
              <span className="text-[11px] font-bold">{c.name}</span>
            </button>
          ))}
        </div>

        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4 text-left px-1">Popular Items</h3>
        
        {/* 3 Column Grid for Home Screen Items */}
        <div className="grid grid-cols-3 gap-2.5">
          {products.length > 0 ? (
            products.filter(p => searchQuery === '' || getPProp(p, 'Name')?.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
              <div key={getPProp(p, 'ID') || Math.random()} onClick={() => { setSelectedProduct(p); setView('details'); }} className="bg-[#112240] p-2 rounded-2xl border border-blue-900/20 active:scale-[0.97] transition-all text-center flex flex-col gap-2">
                <div className="aspect-square bg-[#0a192f] rounded-xl overflow-hidden border border-blue-900/30">
                    <img 
                      src={formatImageUrl(getPProp(p, 'Link'))} 
                      alt="" 
                      className="w-full h-full object-cover" 
                      loading="lazy"
                      onError={(e) => { e.target.src = "https://placehold.co/100x100/112240/ffffff?text=Image"; }} 
                    />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-white text-[10px] font-bold truncate leading-tight px-0.5">{getPProp(p, 'Name')}</h4>
                  <span className="text-blue-500 font-black text-[9px] block mt-1">{getPProp(p, 'Price')} Ks</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 py-10 text-center flex flex-col items-center gap-3">
              {loading ? <Loader2 className="animate-spin text-blue-500" /> : <p className="text-slate-500 text-xs italic">ပစ္စည်းစာရင်း မရှိသေးပါရှင်။</p>}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#0a192f]/90 backdrop-blur-xl border-t border-blue-900/30 p-5 flex justify-around items-center z-50">
        <button onClick={() => setView('home')} className="text-blue-500"><ShoppingBag size={28} /></button>
        <button className="text-slate-600"><History size={28} /></button>
        <button onClick={() => setView('welcome')} className="text-slate-600"><Settings size={28} /></button>
      </nav>
    </div>
  );

  return (
    <div className="bg-[#0a192f] min-h-screen">
      {view === 'welcome' && <WelcomeScreen />}
      {view === 'home' && <HomeScreen />}
      {view === 'products' && (
        <div className="flex flex-col min-h-screen bg-[#0a192f] max-w-md mx-auto">
          <header className="p-6 bg-[#112240] border-b border-blue-900/30 shadow-lg text-white sticky top-0 z-20 flex items-center gap-4">
            <button onClick={() => setView('home')} className="p-2 bg-[#0a192f] border border-blue-900/50 rounded-xl active:scale-90"><ArrowLeft size={20}/></button>
            <h2 className="text-xl font-black tracking-tight">{selectedCat}</h2>
          </header>
          
          <div className="p-4 pb-24 flex-1">
            {/* 3 Column Grid for Category Products */}
            <div className="grid grid-cols-3 gap-3">
              {products.filter(p => getPProp(p, 'Category') === selectedCat).map(p => (
                <button key={getPProp(p, 'ID') || Math.random()} onClick={() => { setSelectedProduct(p); setView('details'); }} className="flex flex-col bg-[#112240] p-2 rounded-2xl border border-blue-900/20 active:scale-95 transition-all text-center group">
                  <div className="aspect-square bg-[#0a192f] rounded-xl overflow-hidden border border-blue-900/30 mb-2">
                      <img src={formatImageUrl(getPProp(p, 'Link'))} alt="" className="w-full h-full object-cover group-active:scale-110 transition-transform" />
                  </div>
                  <h4 className="text-white text-[10px] font-bold truncate leading-tight px-0.5">{getPProp(p, 'Name')}</h4>
                  <p className="text-blue-500 font-black text-[9px] mt-1">{getPProp(p, 'Price')} Ks</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {view === 'details' && (
        <div className="flex flex-col min-h-screen bg-[#0a192f] max-w-md mx-auto text-white relative">
          <div className="relative h-[45vh] bg-[#112240] flex-shrink-0">
            <img 
              src={formatImageUrl(getPProp(selectedProduct, 'Link'))} 
              className="w-full h-full object-cover opacity-80" 
              alt="" 
              onError={(e) => { e.target.src = "https://placehold.co/400x400/112240/ffffff?text=No+Image"; }} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a192f] via-transparent to-transparent"></div>
            <button onClick={() => setView('products')} className="absolute top-6 left-6 p-3 bg-[#0a192f]/60 backdrop-blur rounded-2xl border border-white/10 active:scale-90"><ArrowLeft size={20}/></button>
          </div>
          
          <div className="px-8 -mt-16 relative z-10 flex-1 flex flex-col">
            <div className="mb-6 text-left">
                <span className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-full text-[8px] font-black uppercase tracking-widest mb-4 inline-block">{getPProp(selectedProduct, 'Category')}</span>
                <h2 className="text-3xl font-black mb-1 leading-tight">{getPProp(selectedProduct, 'Name')}</h2>
                <p className="text-slate-400 font-bold mb-2 text-lg">{getPProp(selectedProduct, 'Plan')}</p>
                <div className="text-3xl font-black text-blue-500">{getPProp(selectedProduct, 'Price')} Ks</div>
            </div>
            
            <div className="bg-[#112240] p-6 rounded-3xl border border-blue-900/30 flex-1 mb-8 shadow-inner text-left overflow-y-auto max-h-[30vh]">
              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Product Description</h4>
              <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">{getPProp(selectedProduct, 'Des')}</p>
            </div>

            <div className="pb-10">
                <button 
                  onClick={handleOrder} 
                  disabled={loading} 
                  className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white shadow-[0_15px_35px_-5px_rgba(37,99,235,0.5)] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3 text-lg"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Confirm & Order Now"}
                </button>
            </div>
          </div>
        </div>
      )}
      {view === 'order_success' && (
        <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center text-white bg-[#0a192f] max-w-md mx-auto">
          <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-8 border border-green-500/20">
            <CheckCircle2 size={60} className="text-green-500 animate-bounce" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4">Successful!</h2>
          <p className="text-slate-400 mb-10 text-sm leading-relaxed">
            လူကြီးမင်း၏ အော်ဒါတင်ခြင်း အောင်မြင်ပါတယ်ရှင့်။ <br/> 
            ပစ္စည်းအား Telegram မှတစ်ဆင့် ပို့ဆောင်ပေးပါမည်။
          </p>
          <button onClick={() => setView('home')} className="w-full bg-[#112240] py-4 rounded-2xl font-black text-blue-400 border border-blue-500/20 active:scale-95 shadow-lg">Back to Home</button>
        </div>
      )}
    </div>
  );
}
