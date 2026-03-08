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
    { id: 'Game', name: 'Game', icon: <Gamepad2 size={20} /> },
    { id: 'Digital product', name: 'Digital Product', icon: <Smartphone size={20} /> },
    { id: 'Online class', name: 'Online Class', icon: <BookOpen size={20} /> },
    { id: 'Gsm reseller', name: 'GSM Reseller', icon: <Settings size={20} /> }
  ];

  // Google Drive Link ကို Image ပေါ်အောင် ပြောင်းပေးသည့် တိကျသော Function
  const formatImageUrl = (url) => {
    if (!url || typeof url !== 'string') return "https://placehold.co/400x300/112240/3b82f6?text=MM+Tech";
    if (url.includes('drive.google.com')) {
      let fileId = "";
      try {
        if (url.includes('id=')) {
          fileId = url.split('id=')[1].split('&')[0];
        } else if (url.includes('/d/')) {
          fileId = url.split('/d/')[1].split('/')[0];
        }
      } catch (e) {
        return url;
      }
      return fileId ? `https://drive.google.com/uc?export=view&id=${fileId}` : url;
    }
    return url;
  };

  // Sheet ထဲမှ Header နာမည်များကို Case-insensitive ဖတ်ရန်
  const getVal = (obj, key) => {
    if (!obj) return "";
    return obj[key] || obj[key.toLowerCase()] || obj[key.charAt(0).toUpperCase() + key.slice(1)] || "";
  };

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
      console.error("Fetch Error:", e);
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
          productName: getVal(selectedProduct, 'Name') + " (" + (getVal(selectedProduct, 'Plan') || "") + ")",
          price: getVal(selectedProduct, 'Price'),
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

  // --- WELCOME SCREEN ---
  const WelcomeScreen = () => (
    <div className="flex flex-col h-[100dvh] bg-[#0a192f] text-center overflow-hidden border-x border-blue-900/20">
      <div className="flex flex-col items-center justify-between h-full py-12 px-8">
        
        {/* Top: Logo & Text */}
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 bg-[#112240] rounded-[2.5rem] flex items-center justify-center border border-blue-500/20 shadow-2xl mb-8 overflow-hidden">
            <img src="https://placehold.co/300x300/112240/ffffff?text=MM+TECH" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">MM Tech မှ ကြိုဆိုပါတယ်ရှင့်</h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-[280px]">
            လူကြီးမင်း အလိုရှိတဲ့ product ကိုဝယ်ဖို့ အောက်က <br/>
            <span className="text-blue-400 font-bold">🚀 Start Shopping</span> button ကို နှိပ်ပေးပါရှင့်။
          </p>
        </div>

        {/* Middle: Main Action */}
        <div className="w-full max-w-sm space-y-6">
          <button 
            onClick={() => setView('home')}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black shadow-xl active:scale-95 transition-all text-lg"
          >
            🚀 Start Shopping
          </button>
          <div className="flex items-center justify-center gap-2 text-slate-300 text-sm font-bold opacity-80">
            <Star size={18} className="text-yellow-500 fill-yellow-500" /> MM Tech Grand Opening Promotion
          </div>
        </div>

        {/* Bottom: Links */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          <a href="https://sonema.znnt.org/" target="_blank" rel="noreferrer" className="bg-[#112240] py-4 rounded-xl border border-blue-900/50 text-[10px] font-black text-blue-400 text-center uppercase tracking-widest active:scale-95 block">စုံ/မ စစ်ဆေးရန်</a>
          <a href="http://www.ceir.gov.mm" target="_blank" rel="noreferrer" className="bg-[#112240] py-4 rounded-xl border border-blue-900/50 text-[10px] font-black text-blue-400 text-center uppercase tracking-widest active:scale-95 block">CEIR စစ်ဆေးရန်</a>
        </div>

      </div>
    </div>
  );

  const HomeScreen = () => (
    <div className="flex flex-col h-[100dvh] bg-[#0a192f] overflow-hidden text-white">
      <div className="bg-[#112240] p-6 rounded-b-[2.5rem] shadow-xl border-b border-blue-900/30 flex-shrink-0">
        <div className="flex justify-between items-center mb-6 text-left">
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
            className="w-full bg-[#0a192f] border border-blue-900/50 text-white py-3.5 pl-12 pr-4 rounded-2xl outline-none focus:ring-1 ring-blue-500/50 text-sm placeholder-slate-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 pb-32">
        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4 text-left">Categories</h3>
        <div className="grid grid-cols-2 gap-4 mb-10">
          {categories.map(c => (
            <button key={c.id} onClick={() => { setSelectedCat(c.id); setView('products'); }} className="bg-[#112240] p-5 rounded-[2rem] flex flex-col items-center gap-3 border border-transparent active:border-blue-500 transition-all text-white shadow-lg w-full">
              <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-400">{c.icon}</div>
              <span className="text-xs font-bold text-white">{c.name}</span>
            </button>
          ))}
        </div>

        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4 text-left">Popular Items</h3>
        <div className="space-y-4">
          {products.length > 0 ? (
            products.filter(p => searchQuery === '' || getVal(p, 'Name')?.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
              <div key={getVal(p, 'ID') || Math.random()} onClick={() => { setSelectedProduct(p); setView('details'); }} className="bg-[#112240] p-4 rounded-3xl flex gap-4 border border-blue-900/20 active:scale-95 transition-all text-left shadow-md cursor-pointer w-full">
                <div className="w-16 h-16 bg-[#0a192f] rounded-2xl overflow-hidden flex-shrink-0 border border-blue-900/30">
                    <img src={formatImageUrl(getVal(p, 'Link'))} alt="" className="w-full h-full object-cover opacity-80" onError={(e) => { e.target.src = "https://placehold.co/100x100/112240/ffffff?text=Img"; }} />
                </div>
                <div className="flex flex-col justify-center flex-1 overflow-hidden text-left">
                  <span className="text-[8px] text-blue-400 font-black uppercase mb-1 tracking-wider block">{getVal(p, 'Category')}</span>
                  <h4 className="text-white text-sm font-bold truncate block w-full">{getVal(p, 'Name')}</h4>
                  <span className="text-blue-500 font-black text-xs mt-0.5 block">{getVal(p, 'Price')} Ks</span>
                </div>
                <div className="flex items-center">
                  <ChevronRight className="text-slate-500" size={18} />
                </div>
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
        <button className="text-slate-500"><History size={28} /></button>
        <button onClick={() => setView('welcome')} className="text-slate-500"><Settings size={28} /></button>
      </nav>
    </div>
  );

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-[#0a192f] font-sans select-none overflow-hidden relative shadow-2xl border-x border-blue-900/20 text-white">
      {view === 'welcome' && <WelcomeScreen />}
      {view === 'home' && <HomeScreen />}
      {view === 'products' && (
        <div className="flex flex-col h-full bg-[#0a192f] overflow-hidden text-left">
          <header className="p-6 flex items-center gap-4 bg-[#112240] border-b border-blue-900/30 shadow-lg text-white flex-shrink-0">
            <button onClick={() => setView('home')} className="p-2 bg-[#0a192f] border border-blue-900/50 rounded-xl text-white active:scale-90 transition-transform"><ArrowLeft size={20}/></button>
            <h2 className="text-xl font-black tracking-tight text-white">{selectedCat}</h2>
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-24">
            {products.filter(p => getVal(p, 'Category') === selectedCat).map(p => (
              <button key={getVal(p, 'ID') || Math.random()} onClick={() => { setSelectedProduct(p); setView('details'); }} className="w-full bg-[#112240] p-5 rounded-3xl flex items-center justify-between text-white border border-blue-900/20 active:bg-blue-900/40 transition-all text-left shadow-lg">
                <div className="flex items-center gap-4 overflow-hidden w-full text-left">
                  <div className="w-12 h-12 bg-[#0a192f] rounded-xl overflow-hidden border border-blue-900/30 flex-shrink-0">
                      <img src={formatImageUrl(getVal(p, 'Link'))} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.src = "https://placehold.co/100x100/112240/ffffff?text=Img"; }} />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <h4 className="text-sm font-bold text-white truncate w-full">{getVal(p, 'Name')}</h4>
                    <p className="text-[10px] text-slate-400 font-medium truncate w-full">{getVal(p, 'Plan')}</p>
                    <p className="text-xs text-blue-500 font-black mt-0.5">{getVal(p, 'Price')} Ks</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-500 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
      {view === 'details' && (
        <div className="flex flex-col h-full text-white bg-[#0a192f] overflow-hidden text-left">
          <div className="relative h-[40vh] bg-[#112240] flex-shrink-0">
            <img src={formatImageUrl(getVal(selectedProduct, 'Link'))} className="w-full h-full object-cover opacity-70" alt="" onError={(e) => { e.target.src = "https://placehold.co/400x300/112240/3b82f6?text=MM+Tech"; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a192f] to-transparent"></div>
            <button onClick={() => setView('products')} className="absolute top-6 left-6 p-3 bg-white/10 backdrop-blur rounded-2xl border border-white/10 active:scale-90 transition-transform"><ArrowLeft size={20}/></button>
          </div>
          <div className="px-8 -mt-12 relative flex-1 flex flex-col overflow-hidden">
            <div className="flex-shrink-0 mb-6">
                <span className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-full text-[8px] font-black uppercase tracking-widest mb-4 inline-block">{getVal(selectedProduct, 'Category')}</span>
                <h2 className="text-3xl font-black mb-1 leading-tight text-white">{getVal(selectedProduct, 'Name')}</h2>
                <p className="text-slate-400 font-bold mb-1">{getVal(selectedProduct, 'Plan')}</p>
                <div className="text-2xl font-black text-blue-500">{getVal(selectedProduct, 'Price')} Ks</div>
            </div>
            <div className="bg-[#112240] p-6 rounded-3xl border border-blue-900/30 flex-1 overflow-y-auto mb-8 shadow-inner">
              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 block">Description</h4>
              <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap block">{getVal(selectedProduct, 'Des')}</p>
            </div>
            <div className="pb-8">
                <button onClick={handleOrder} disabled={loading} className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white shadow-xl active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3">
                  {loading ? <Loader2 className="animate-spin" /> : "Confirm Order"}
                </button>
            </div>
          </div>
        </div>
      )}
      {view === 'order_success' && (
        <div className="h-full flex flex-col items-center justify-center p-10 text-center text-white bg-[#0a192f]">
          <CheckCircle2 size={100} className="text-green-500 mb-6 animate-bounce" />
          <h2 className="text-3xl font-black mb-4 text-white">Successful!</h2>
          <p className="text-slate-400 mb-10 text-sm leading-relaxed text-center">အော်ဒါတင်ခြင်း အောင်မြင်ပါတယ်ရှင့်။ <br/> ပစ္စည်းအား Telegram မှတစ်ဆင့် ပို့ဆောင်ပေးပါမည်။</p>
          <button onClick={() => setView('home')} className="w-full bg-[#112240] py-4 rounded-2xl font-black text-blue-400 border border-blue-500/20 active:scale-95 shadow-lg text-center flex items-center justify-center w-full">Back to Home</button>
        </div>
      )}
    </div>
  );
}
