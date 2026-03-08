import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Gamepad2, Smartphone, BookOpen, Settings, 
  History, ChevronRight, ArrowLeft, CheckCircle2, Gift, 
  Search, Phone, Loader2, Star 
} from 'lucide-react';

// --- CONFIGURATION ---
// ၁။ လူကြီးမင်းရဲ့ Logo Direct Link ကို ဒီမှာထည့်ပါ
const LOGO_URL = "https://drive.google.com/uc?export=view&id=1mIT1IUmxc_4Ese8NwMOidpmnFCJ1Ab8X"; 
// ၂။ အဆင့် (၁) က ရလာတဲ့ Google Web App URL ကို ဒီမှာထည့်ပါ
const SCRIPT_URL = "AKfycbyC1MECq8ZNzdj-RxmBaMcFfSqVk9Ijt9uuRW-szeukWuCoNBhywDz0k7W1r5mCvjhR"; 

export default function App() {
  const [view, setView] = useState('welcome');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([
    { id: 'Game', name: 'Game', icon: <Gamepad2 size={20} /> },
    { id: 'Digital product', name: 'Digital Product', icon: <Smartphone size={20} /> },
    { id: 'Online class', name: 'Online Class', icon: <BookOpen size={20} /> },
    { id: 'Gsm reseller', name: 'GSM Reseller', icon: <Settings size={20} /> }
  ]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Google Sheet မှ ပစ္စည်းများ ဖတ်ယူခြင်း
  useEffect(() => {
    if (view === 'home' && products.length === 0) {
      loadData();
    }
  }, [view]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch(SCRIPT_URL);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Data loading failed", error);
    } finally {
      setLoading(false);
    }
  };

  const submitOrder = async (orderData) => {
    setLoading(true);
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
      setView('order_success');
    } catch (error) {
      alert("အော်ဒါတင်ခြင်း မအောင်မြင်ပါ။ နောက်မှ ပြန်ကြိုးစားပါရှင်။");
    } finally {
      setLoading(false);
    }
  };

  // --- UI COMPONENTS ---
  const WelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0a192f] p-8 text-center">
      <div className="w-32 h-32 bg-[#112240] rounded-[2.5rem] flex items-center justify-center mb-8 border border-blue-500/20 shadow-2xl overflow-hidden p-2">
        <img src={LOGO_URL} alt="MM Tech Logo" className="w-full h-full object-contain" />
      </div>
      <h1 className="text-3xl font-black text-white mb-3 tracking-tight text-center">MM Tech မှ ကြိုဆိုပါတယ်ရှင့်</h1>
      <p className="text-slate-400 mb-12 text-sm leading-relaxed text-center px-4">
        လူကြီးမင်း အလိုရှိတဲ့ product ကိုဝယ်ဖို့ အောက်က <br/>
        <span className="text-blue-400 font-bold">🚀 Start Shopping</span> button ကို နှိပ်ပေးပါရှင့်။
      </p>
      <button onClick={() => setView('home')} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 mb-6">
        🚀 Start Shopping <ChevronRight size={20} />
      </button>
      <button className="flex items-center gap-2 text-slate-300 font-medium py-2 hover:text-white"><Star size={18} className="text-yellow-500" /> MM Tech Grand Opening Promotion</button>
      <div className="mt-auto grid grid-cols-2 gap-4 w-full pt-8">
        <a href="https://sonema.znnt.org/" target="_blank" className="bg-[#112240] p-4 rounded-2xl border border-blue-900/50 flex flex-col items-center"><span className="text-[10px] font-black text-blue-400 uppercase tracking-widest text-center">စုံ/မ စစ်ဆေးရန်</span></a>
        <a href="http://www.ceir.gov.mm" target="_blank" className="bg-[#112240] p-4 rounded-2xl border border-blue-900/50 flex flex-col items-center"><span className="text-[10px] font-black text-blue-400 uppercase tracking-widest text-center">CEIR စစ်ဆေးရန်</span></a>
      </div>
    </div>
  );

  const HomeScreen = () => (
    <div className="min-h-screen bg-[#0a192f] pb-24">
      <div className="bg-[#112240] p-6 rounded-b-[2.5rem] shadow-xl border-b border-blue-900/30">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0a192f] rounded-xl overflow-hidden border border-blue-500/20 p-1"><img src={LOGO_URL} className="w-full h-full object-contain" /></div>
            <h2 className="text-xl font-black text-white">MM Tech Store</h2>
          </div>
          <Gift size={20} className="text-blue-400" />
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input type="text" placeholder="Search products..." className="w-full bg-[#0a192f] border border-blue-900/50 text-white py-4 pl-12 pr-4 rounded-2xl outline-none focus:ring-1 ring-blue-500 transition-all placeholder:text-slate-600" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>
      <div className="px-6 mt-8">
        <h3 className="font-bold text-slate-300 mb-4 text-xs uppercase tracking-widest">Categories</h3>
        <div className="grid grid-cols-2 gap-4 mb-10">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => { setSelectedCat(cat.id); setView('products'); }} className="bg-[#112240] p-6 rounded-3xl shadow-lg border border-transparent active:border-blue-500 flex flex-col items-center gap-3 transition-all"><div className="p-4 bg-blue-600/10 text-blue-400 rounded-2xl">{cat.icon}</div><span className="text-xs font-bold text-slate-300">{cat.name}</span></button>
          ))}
        </div>
        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-300 text-xs uppercase tracking-widest">Popular Items</h3>{loading && <Loader2 className="animate-spin text-blue-500" size={16} />}</div>
        <div className="space-y-4">
          {products.slice(0, 5).map(p => (
            <div key={p.ID} onClick={() => { setSelectedProduct(p); setView('details'); }} className="bg-[#112240] p-4 rounded-3xl shadow-md flex gap-4 active:scale-95 transition-all border border-blue-900/20"><div className="w-16 h-16 bg-[#0a192f] rounded-2xl overflow-hidden flex-shrink-0"><img src={p.Link} className="w-full h-full object-cover opacity-80" /></div><div className="flex flex-col justify-center flex-grow"><span className="text-[8px] text-blue-400 font-black uppercase tracking-[0.2em] mb-1">{p.Category}</span><h4 className="font-bold text-white text-sm">{p.Name}</h4><span className="text-blue-500 font-black text-xs mt-1">{p.Price} Ks</span></div><ChevronRight size={18} className="text-slate-700 mt-5" /></div>
          ))}
        </div>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0a192f]/90 backdrop-blur-xl border-t border-blue-900/30 p-5 flex justify-around items-center shadow-2xl">
        <button onClick={() => setView('home')} className="text-blue-500"><ShoppingBag size={24} /></button>
        <button className="text-slate-600"><History size={24} /></button>
        <button onClick={() => setView('welcome')} className="text-slate-600"><Settings size={24} /></button>
      </nav>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#0a192f] font-sans">
      {view === 'welcome' && <WelcomeScreen />}
      {view === 'home' && <HomeScreen />}
      {view === 'products' && (
        <div className="min-h-screen bg-[#0a192f]">
          <header className="p-6 flex items-center gap-4 bg-[#112240] border-b border-blue-900/30 shadow-lg"><button onClick={() => setView('home')} className="p-2 bg-[#0a192f] border border-blue-900/50 rounded-xl text-white"><ArrowLeft size={20}/></button><h2 className="text-xl font-black text-white">{selectedCat}</h2></header>
          <div className="p-6 space-y-4">
            {products.filter(p => p.Category === selectedCat).map(p => (
              <div key={p.ID} onClick={() => { setSelectedProduct(p); setView('details'); }} className="bg-[#112240] p-5 rounded-3xl border border-blue-900/20 flex items-center justify-between active:bg-blue-900/30 transition-all"><div className="flex items-center gap-4"><div className="w-14 h-14 bg-[#0a192f] rounded-2xl border border-blue-900/50 overflow-hidden"><img src={p.Link} className="w-full h-full object-cover opacity-70" /></div><div><h4 className="font-bold text-white text-sm">{p.Name} ({p.Plan})</h4><p className="text-xs font-black text-blue-500 mt-1">{p.Price} Ks</p></div></div><ChevronRight size={18} className="text-slate-700" /></div>
            ))}
          </div>
        </div>
      )}
      {view === 'details' && (
        <div className="min-h-screen bg-[#0a192f] text-white">
          <div className="relative h-[40vh] bg-[#112240]"><img src={selectedProduct.Link} className="w-full h-full object-cover opacity-60" /><div className="absolute inset-0 bg-gradient-to-t from-[#0a192f] to-transparent"></div><button onClick={() => setView('products')} className="absolute top-6 left-6 p-3 bg-white/10 backdrop-blur rounded-2xl border border-white/10 shadow-lg"><ArrowLeft size={20}/></button></div>
          <div className="px-8 -mt-12 relative"><span className="px-3 py-0.5 bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-full text-[8px] font-black uppercase tracking-[0.2em]">{selectedProduct.Category}</span><h2 className="text-2xl font-black text-white pt-2 leading-tight">{selectedProduct.Name}</h2><p className="text-slate-400 font-medium text-xs mb-6">{selectedProduct.Plan}</p><div className="bg-[#112240] p-6 rounded-3xl border border-blue-900/30 mb-8"><h3 className="font-black text-blue-400 mb-2 uppercase text-[9px] tracking-widest">Description</h3><p className="text-slate-300 leading-relaxed text-sm">{selectedProduct.Des}</p><div className="mt-4 pt-4 border-t border-blue-900/30 flex justify-between items-center"><span className="text-slate-500 text-xs font-bold uppercase">Price</span><span className="text-xl font-black text-blue-500">{selectedProduct.Price} Ks</span></div></div><div className="p-6 bg-blue-600/5 rounded-3xl border border-blue-500/20 mb-8 text-center"><h3 className="font-bold text-slate-300 flex items-center justify-center gap-2 mb-4 text-[10px] uppercase tracking-widest"><CheckCircle2 size={14} className="text-green-500" /> Payment Account</h3><div className="bg-[#0a192f] p-4 rounded-2xl border border-blue-900/50 shadow-inner"><span className="block text-[8px] font-black text-slate-500 uppercase mb-1">KPay Info</span><span className="text-md font-black text-blue-400">09xxxxxxxxx</span></div></div><button onClick={() => submitOrder({productName: selectedProduct.Name, price: selectedProduct.Price})} disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">{loading ? <Loader2 className="animate-spin" /> : "Confirm Order"}</button></div>
        </div>
      )}
      {view === 'order_success' && (
        <div className="h-screen bg-[#0a192f] flex flex-col items-center justify-center p-10 text-center"><div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-8 border border-green-500/20"><CheckCircle2 size={50} /></div><h2 className="text-3xl font-black text-white mb-4">Order Received!</h2><p className="text-slate-400 font-medium mb-12 text-sm">အော်ဒါတင်ခြင်း အောင်မြင်ပါတယ်ရှင့်။ <br/>Admin မှ စစ်ဆေးပြီး ပစ္စည်းအား Telegram မှတစ်ဆင့် ပို့ဆောင်ပေးပါမည်။</p><button onClick={() => setView('home')} className="w-full bg-[#112240] text-blue-400 border border-blue-500/30 py-5 rounded-2xl font-black">Back to Home</button></div>
      )}
    </div>
  );
}
