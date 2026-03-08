import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Gamepad2, 
  Smartphone, 
  BookOpen, 
  Settings, 
  History, 
  ChevronRight, 
  ArrowLeft,
  CheckCircle2,
  Gift,
  Search,
  Loader2,
  Star
} from 'lucide-react';

// --- CONFIGURATION ---
const SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE"; 

export default function App() {
  const [view, setView] = useState('welcome');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories] = useState([
    { id: 'Game', name: 'Game', icon: <Gamepad2 size={20} /> },
    { id: 'Digital product', name: 'Digital Product', icon: <Smartphone size={20} /> },
    { id: 'Online class', name: 'Online Class', icon: <BookOpen size={20} /> },
    { id: 'Gsm reseller', name: 'GSM Reseller', icon: <Settings size={20} /> }
  ]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (view === 'home' && products.length === 0) {
      fetchProducts();
    }
  }, [view]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      setTimeout(() => {
        setProducts([
          { id: '1', Category: 'Game', Name: 'Mobile Legends Diamonds', Plan: '257 Diamonds', Price: '12500', Des: 'Instant top-up via Player ID.', Link: 'https://placehold.co/400x200/001f3f/ffffff?text=MLBB+Diamonds' },
          { id: '2', Category: 'Digital product', Name: 'YouTube Premium', Plan: 'Family Plan', Price: '5500', Des: 'No Ads, Background Play.', Link: 'https://placehold.co/400x200/001f3f/ffffff?text=YouTube+Premium' },
          { id: '3', Category: 'Online class', Name: 'Graphic Design', Plan: 'Beginner to Pro', Price: '25000', Des: 'Photoshop & Illustrator included.', Link: 'https://placehold.co/400x200/001f3f/ffffff?text=Graphic+Design' }
        ]);
        setLoading(false);
      }, 800);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleOrder = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setView('order_success');
    }, 1500);
  };

  const WelcomeScreen = () => (
    <div className="flex flex-col h-[100dvh] bg-[#0a192f] p-8 text-center justify-between items-center overflow-hidden">
      {/* Top Logo Section - Logo space ကို fixed ပေးထားပါတယ် */}
      <div className="flex flex-col items-center pt-10">
        <div className="w-36 h-36 bg-[#112240] rounded-[2.5rem] flex items-center justify-center border border-blue-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.3)] mb-8 overflow-hidden">
          <img src="https://placehold.co/200x200/001f3f/3b82f6?text=MM+TECH" alt="MM Tech Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-4xl font-black text-white mb-3 tracking-tight">MM Tech မှ ကြိုဆိုပါတယ်ရှင့်</h1>
        <p className="text-slate-400 text-sm leading-relaxed max-w-[280px]">
          လူကြီးမင်း အလိုရှိတဲ့ product ကိုဝယ်ဖို့ အောက်က <br/>
          <span className="text-blue-400 font-bold">🚀 Start Shopping</span> button ကို နှိပ်ပေးပါရှင့်။
        </p>
      </div>

      {/* Middle Buttons Section - အလယ်မှာ နေရာယူစေပါတယ် */}
      <div className="w-full max-w-sm flex flex-col items-center gap-4">
        <button 
          onClick={() => setView('home')}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-bold shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)] active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          🚀 Start Shopping <ChevronRight size={20} />
        </button>

        <button className="flex items-center justify-center gap-2 text-slate-300 font-medium py-3 hover:text-white transition-colors w-full">
          <Star size={18} className="text-yellow-500 fill-yellow-500" /> 
          MM Tech Grand Opening Promotion
        </button>
      </div>

      {/* Bottom Footer Links - အောက်ဆုံးမှာ fix ဖြစ်နေစေပါတယ် */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-10 pt-4">
        <a href="https://sonema.znnt.org/" target="_blank" rel="noreferrer" className="bg-[#112240] p-4 rounded-2xl border border-blue-900/50 flex flex-col items-center active:bg-blue-900/30 transition-colors shadow-lg">
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">စုံ/မ စစ်ဆေးရန်</span>
        </a>
        <a href="http://www.ceir.gov.mm" target="_blank" rel="noreferrer" className="bg-[#112240] p-4 rounded-2xl border border-blue-900/50 flex flex-col items-center active:bg-blue-900/30 transition-colors shadow-lg">
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">CEIR စစ်ဆေးရန်</span>
        </a>
      </div>
    </div>
  );

  const HomeScreen = () => (
    <div className="h-[100dvh] flex flex-col bg-[#0a192f] overflow-hidden">
      <div className="bg-[#112240] p-6 rounded-b-[2.5rem] shadow-xl border-b border-blue-900/30">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">Premium Store</p>
            <h2 className="text-2xl font-black text-white">MM Tech Store</h2>
          </div>
          <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
            <Gift size={24} />
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="w-full bg-[#0a192f] border border-blue-900/50 text-white py-4 pl-12 pr-4 rounded-2xl outline-none focus:ring-2 ring-blue-500/50 transition-all placeholder:text-slate-600"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-24 custom-scrollbar">
        <h3 className="font-bold text-slate-300 mb-4 text-xs uppercase tracking-widest">Categories</h3>
        <div className="grid grid-cols-2 gap-4 mb-10">
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => { setSelectedCat(cat.id); setView('products'); }}
              className="bg-[#112240] p-6 rounded-3xl shadow-lg border border-transparent active:border-blue-500 active:bg-[#1a2d4d] flex flex-col items-center gap-3 transition-all group"
            >
              <div className="p-4 bg-blue-600/10 text-blue-400 rounded-2xl group-active:scale-90 transition-transform">{cat.icon}</div>
              <span className="text-xs font-bold text-slate-300">{cat.name}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-300 text-xs uppercase tracking-widest">Popular Items</h3>
          {loading && <Loader2 className="animate-spin text-blue-500" size={20} />}
        </div>
        
        <div className="space-y-4">
          {products.map(p => (
            <div 
              key={p.id}
              onClick={() => { setSelectedProduct(p); setView('details'); }}
              className="bg-[#112240] p-4 rounded-3xl shadow-md flex gap-4 active:scale-95 transition-all cursor-pointer border border-blue-900/20"
            >
              <div className="w-20 h-20 bg-[#0a192f] rounded-2xl overflow-hidden flex-shrink-0">
                <img src={p.Link} alt={p.Name} className="w-full h-full object-cover opacity-80" />
              </div>
              <div className="flex flex-col justify-center flex-grow text-left">
                <span className="text-[9px] text-blue-400 font-black uppercase tracking-[0.2em] mb-1">{p.Category}</span>
                <h4 className="font-bold text-white text-md truncate">{p.Name}</h4>
                <span className="text-blue-500 font-black mt-1">{p.Price} Ks</span>
              </div>
              <div className="flex items-center">
                <ChevronRight size={20} className="text-slate-600" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#0a192f]/95 backdrop-blur-xl border-t border-blue-900/30 p-5 flex justify-around items-center shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-50">
        <button onClick={() => setView('home')} className="text-blue-500 p-2"><ShoppingBag size={28} /></button>
        <button className="text-slate-600 p-2"><History size={28} /></button>
        <button onClick={() => setView('welcome')} className="text-slate-600 p-2"><Settings size={28} /></button>
      </nav>
    </div>
  );

  return (
    <div className="max-w-md mx-auto h-[100dvh] relative bg-[#0a192f] overflow-x-hidden font-sans select-none shadow-2xl">
      {view === 'welcome' && <WelcomeScreen />}
      {view === 'home' && <HomeScreen />}
      {view === 'products' && (
        <div className="h-[100dvh] flex flex-col bg-[#0a192f]">
          <header className="p-6 flex items-center gap-4 bg-[#112240] border-b border-blue-900/30 shadow-lg">
            <button onClick={() => setView('home')} className="p-2 bg-[#0a192f] border border-blue-900/50 rounded-xl text-white active:scale-90 transition-transform"><ArrowLeft size={20}/></button>
            <h2 className="text-xl font-black text-white">{selectedCat}</h2>
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {products.filter(p => p.Category === selectedCat).map(p => (
              <div 
                key={p.id}
                onClick={() => { setSelectedProduct(p); setView('details'); }}
                className="bg-[#112240] p-5 rounded-3xl shadow-lg border border-blue-900/20 flex items-center justify-between active:bg-blue-900/30 transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#0a192f] rounded-2xl border border-blue-900/50 flex items-center justify-center text-blue-400 font-bold overflow-hidden">
                     <img src={p.Link} className="w-full h-full object-cover opacity-70" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{p.Name}</h4>
                    <p className="text-xs font-black text-blue-500 mt-1">{p.Price} Ks</p>
                  </div>
                </div>
                <ChevronRight className="text-slate-700" />
              </div>
            ))}
          </div>
        </div>
      )}
      {view === 'details' && (
        <div className="h-[100dvh] bg-[#0a192f] flex flex-col text-white overflow-hidden">
          <div className="relative h-[45vh] bg-[#112240]">
            <img src={selectedProduct.Link} className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a192f] via-transparent to-transparent"></div>
            <button 
              onClick={() => setView('products')} 
              className="absolute top-6 left-6 p-3 bg-white/10 backdrop-blur rounded-2xl border border-white/10 shadow-lg active:scale-90 transition-transform"
            >
              <ArrowLeft size={20}/>
            </button>
          </div>
          <div className="px-8 -mt-16 relative flex-1 flex flex-col">
             <div className="space-y-1 mb-8">
                <span className="px-4 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">{selectedProduct.Category}</span>
                <h2 className="text-3xl font-black text-white pt-2 leading-tight">{selectedProduct.Name}</h2>
                <div className="text-2xl font-black text-blue-500 mt-2">{selectedProduct.Price} Ks</div>
              </div>
              
              <div className="bg-[#112240] p-6 rounded-3xl border border-blue-900/30 mb-8">
                <p className="text-slate-400 text-sm leading-relaxed">{selectedProduct.Des}</p>
              </div>

              <div className="mt-auto pb-10">
                <button 
                  onClick={handleOrder}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-[0_15px_30px_rgba(37,99,235,0.4)] flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Confirm Order"}
                </button>
              </div>
          </div>
        </div>
      )}
      {view === 'order_success' && (
        <div className="h-[100dvh] bg-[#0a192f] flex flex-col items-center justify-center p-10 text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full"></div>
            <CheckCircle2 size={100} className="text-green-500 relative" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4">Successful!</h2>
          <p className="text-slate-400 mb-10">Admin မှ စစ်ဆေးပြီး ပစ္စည်းအား Telegram မှတစ်ဆင့် ပို့ဆောင်ပေးပါမည်။</p>
          <button onClick={() => setView('home')} className="w-full bg-[#112240] text-blue-400 py-5 rounded-2xl font-black active:scale-95 transition-all">Home</button>
        </div>
      )}
    </div>
  );
}
