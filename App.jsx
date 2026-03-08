import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Gamepad2, Smartphone, BookOpen, Settings, 
  History, ChevronRight, ArrowLeft, CheckCircle2, Search, 
  Loader2, Star, RefreshCw 
} from 'lucide-react';

// --- CONFIGURATION ---
// လူကြီးမင်း Deploy လုပ်လို့ရလာတဲ့ Web App URL ကို ဒီနေရာမှာ အစားထိုးပါ
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

  // --- Data Fetching ---
  useEffect(() => {
    if (view === 'home' || view === 'products') {
      fetchData();
    }
  }, [view]);

  const fetchData = async () => {
    if (!SCRIPT_URL || SCRIPT_URL.includes("YOUR_")) {
        // Preview data if URL is not set
        setProducts([
          { ID: '1', Category: 'Game', Name: 'Mobile Legends Diamonds', Plan: '257 Diamonds', Price: '12500', Des: 'Instant top-up via ID.', Link: 'https://placehold.co/400x200/001f3f/ffffff?text=MLBB' },
          { ID: '2', Category: 'Digital product', Name: 'YouTube Premium', Plan: 'Family', Price: '5500', Des: 'No Ads.', Link: 'https://placehold.co/400x200/001f3f/ffffff?text=YouTube' }
        ]);
        return;
    };
    
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
      if (SCRIPT_URL && !SCRIPT_URL.includes("YOUR_")) {
          await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
              productName: selectedProduct.Name + " (" + selectedProduct.Plan + ")",
              price: selectedProduct.Price,
              fullName: "Web User"
            })
          });
      }
      setView('order_success');
    } catch (e) {
      setView('order_success'); 
    } finally {
      setLoading(false);
    }
  };

  // --- SUB-COMPONENTS ---

  const WelcomeScreen = () => (
    <div className="flex flex-col h-[100dvh] bg-[#0a192f] p-8 text-center items-center justify-between overflow-hidden border-x border-blue-900/20">
      <div className="flex flex-col items-center pt-10">
        <div className="w-32 h-32 bg-[#112240] rounded-[2.5rem] flex items-center justify-center border border-blue-500/20 shadow-2xl mb-8 overflow-hidden">
          <img src="https://placehold.co/300x300/112240/ffffff?text=MM+TECH" alt="Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">MM Tech မှ ကြိုဆိုပါတယ်ရှင့်</h1>
        <p className="text-slate-400 text-sm leading-relaxed max-w-[280px]">
          လူကြီးမင်း အလိုရှိတဲ့ product ကိုဝယ်ဖို့ အောက်က <br/>
          <span className="text-blue-400 font-bold">🚀 Start Shopping</span> button ကို နှိပ်ပေးပါရှင့်။
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-5">
        <button 
          onClick={() => setView('home')}
          className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white shadow-xl active:scale-95 transition-all"
        >
          🚀 Start Shopping
        </button>
        <div className="flex items-center justify-center gap-2 text-slate-300 text-sm font-bold">
          <Star size={16} className="text-yellow-500 fill-yellow-500" /> Promotion Info
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-10">
        <a href="https://sonema.znnt.org/" target="_blank" rel="noreferrer" className="bg-[#112240] py-4 rounded-xl border border-blue-900/50 text-[10px] font-black text-blue-400 text-center uppercase tracking-widest">စုံ/မ စစ်ဆေးရန်</a>
        <a href="http://www.ceir.gov.mm" target="_blank" rel="noreferrer" className="bg-[#112240] py-4 rounded-xl border border-blue-900/50 text-[10px] font-black text-blue-400 text-center uppercase tracking-widest">CEIR စစ်ဆေးရန်</a>
      </div>
    </div>
  );

  const HomeScreen = () => (
    <div className="flex flex-col h-[100dvh] bg-[#0a192f] overflow-hidden">
      <div className="bg-[#112240] p-6 rounded-b-[2.5rem] shadow-xl border-b border-blue-900/30 flex-shrink-0">
        <div className="flex justify-between items-center mb-6 text-white text-left">
          <div>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Premium Store</p>
            <h2 className="text-2xl font-black">MM Tech Store</h2>
          </div>
          <button 
            onClick={fetchData} 
            className={`p-2 rounded-full bg-blue-600/10 text-blue-400 ${loading && 'animate-spin'}`}
          >
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

      <div className="flex-1 overflow-y-auto p-6 pb-28">
        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4 text-left">Categories</h3>
        <div className="grid grid-cols-2 gap-4 mb-10">
          {categories.map(c => (
            <button 
              key={c.id} 
              onClick={() => { setSelectedCat(c.id); setView('products'); }}
              className="bg-[#112240] p-5 rounded-[2rem] flex flex-col items-center gap-3 border border-transparent active:border-blue-500 transition-all text-white"
            >
              <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-400">{c.icon}</div>
              <span className="text-xs font-bold">{c.name}</span>
            </button>
          ))}
        </div>

        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4 text-left">Popular Items</h3>
        <div className="space-y-4">
          {products.length > 0 ? (
            products.filter(p => searchQuery === '' || p.Name?.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
              <div 
                key={p.ID || Math.random()} 
                onClick={() => { setSelectedProduct(p); setView('details'); }}
                className="bg-[#112240] p-4 rounded-3xl flex gap-4 border border-blue-900/20 active:scale-95 transition-all text-left"
              >
                <div className="w-16 h-16 bg-[#0a192f] rounded-2xl overflow-hidden flex-shrink-0 border border-blue-900/30">
                    <img src={p.Link || "https://placehold.co/100"} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col justify-center flex-1">
                  <span className="text-[8px] text-blue-400 font-black uppercase mb-1">{p.Category}</span>
                  <h4 className="text-white text-sm font-bold truncate">{p.Name}</h4>
                  <span className="text-blue-500 font-black text-xs">{p.Price} Ks</span>
                </div>
                <ChevronRight className="self-center text-slate-700" size={18} />
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-slate-500 text-xs italic">Loading items...</div>
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

  const ProductList = () => {
    const filtered = products.filter(p => p.Category === selectedCat);
    return (
      <div className="flex flex-col h-[100dvh] bg-[#0a192f]">
        <header className="p-6 flex items-center gap-4 bg-[#112240] border-b border-blue-900/30 shadow-lg text-white flex-shrink-0">
          <button onClick={() => setView('home')} className="p-2 bg-[#0a192f] rounded-xl"><ArrowLeft size={20}/></button>
          <h2 className="text-xl font-black">{selectedCat}</h2>
        </header>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filtered.length > 0 ? filtered.map(p => (
            <button 
              key={p.ID || Math.random()} 
              onClick={() => { setSelectedProduct(p); setView('details'); }}
              className="w-full bg-[#112240] p-5 rounded-3xl flex items-center justify-between text-white border border-blue-900/20 active:bg-blue-900/40 transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#0a192f] rounded-xl overflow-hidden">
                    <img src={p.Link || "https://placehold.co/100"} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">{p.Name}</h4>
                  <p className="text-[10px] text-slate-400">{p.Plan}</p>
                  <p className="text-xs text-blue-500 font-black mt-1">{p.Price} Ks</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-700" />
            </button>
          )) : (
            <div className="py-20 text-center text-slate-500 italic">No products found.</div>
          )}
        </div>
      </div>
    );
  };

  const ProductDetails = () => (
    <div className="flex flex-col h-[100dvh] bg-[#0a192f] text-white">
      <div className="relative h-[40vh] bg-[#112240] flex-shrink-0">
        <img src={selectedProduct?.Link || "https://placehold.co/400"} className="w-full h-full object-cover opacity-70" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a192f] to-transparent"></div>
        <button onClick={() => setView('products')} className="absolute top-6 left-6 p-3 bg-white/10 backdrop-blur rounded-2xl"><ArrowLeft size={20}/></button>
      </div>
      <div className="px-8 -mt-10 relative flex-1 flex flex-col overflow-hidden text-left">
        <span className="px-4 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-full text-[8px] font-black uppercase self-start mb-4">{selectedProduct?.Category}</span>
        <h2 className="text-3xl font-black mb-1">{selectedProduct?.Name}</h2>
        <div className="text-2xl font-black text-blue-500 mb-6">{selectedProduct?.Price} Ks</div>
        
        <div className="bg-[#112240] p-6 rounded-3xl border border-blue-900/30 flex-1 overflow-y-auto mb-8">
          <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Description</h4>
          <p className="text-slate-400 text-sm leading-relaxed">{selectedProduct?.Des}</p>
        </div>

        <button 
          onClick={handleOrder} 
          disabled={loading} 
          className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white shadow-xl mb-10 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Confirm Order"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-[#0a192f] font-sans select-none overflow-hidden relative shadow-2xl">
      {view === 'welcome' && <WelcomeScreen />}
      {view === 'home' && <HomeScreen />}
      {view === 'products' && <ProductList />}
      {view === 'details' && <ProductDetails />}
      {view === 'order_success' && (
        <div className="h-full flex flex-col items-center justify-center p-10 text-center text-white">
          <CheckCircle2 size={100} className="text-green-500 mb-6" />
          <h2 className="text-3xl font-black mb-4">Successful!</h2>
          <p className="text-slate-400 mb-10">အော်ဒါတင်ခြင်း အောင်မြင်ပါတယ်ရှင့်။ ပစ္စည်းအား Telegram မှတစ်ဆင့် ပို့ဆောင်ပေးပါမည်။</p>
          <button onClick={() => setView('home')} className="w-full bg-[#112240] py-5 rounded-2xl font-black text-blue-400">Back to Home</button>
        </div>
      )}
    </div>
  );
}
