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
  Loader2
} from 'lucide-react';

// --- CONFIGURATION ---
// လူကြီးမင်း၏ Google Apps Script Web App URL အမှန်
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyC1MECq8ZNzdj-RxmBaMcFfSqVk9Ijt9uuRW-szeukWuCoNBhywDz0k7W1r5mCvjhR/exec"; 

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

  // Sheet ထဲမှ Header နာမည်များကို Case-insensitive ဖတ်ရန်
  const getVal = (obj, key) => {
    if (!obj) return "";
    return obj[key] || obj[key.toLowerCase()] || obj[key.toUpperCase()] || obj[key.charAt(0).toUpperCase() + key.slice(1)] || "";
  };

  // Google Drive Link ကို Image ပေါ်အောင် ပြောင်းပေးသည့် ပိုမိုတိကျသော Function (Regex အသုံးပြုထားသည်)
  const formatImageUrl = (url) => {
    if (!url || typeof url !== 'string') return "https://placehold.co/400x300/e2e8f0/64748b?text=No+Image";
    
    // Google Drive URL များအတွက် ID ထုတ်ယူခြင်း
    const match = url.match(/(?:https?:\/\/)?(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|googledrive\.com\/host\/)([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
    
    // Drive link မဟုတ်လျှင် (သို့) တိုက်ရိုက်ပုံ link ဆိုလျှင်
    return url;
  };

  // --- အချက်အလက်များကို Google Sheet မှ ဖတ်ယူခြင်း ---
  useEffect(() => {
    if (view === 'home' && products.length === 0) {
      fetchProducts();
    }
  }, [view]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(SCRIPT_URL);
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async (e) => {
    e.preventDefault();
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

  const WelcomeScreen = () => (
    <div className="flex flex-col h-full w-full bg-white text-center overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-28 h-28 bg-blue-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-blue-200">
          <ShoppingBag size={56} color="white" />
        </div>
        <h1 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">MM Tech မှ ကြိုဆိုပါတယ်ရှင့်</h1>
        <p className="text-slate-500 mb-10 leading-relaxed max-w-[280px]">လူကြီးမင်း အလိုရှိတဲ့ product ကိုဝယ်ဖို့ အောက်က <br/><b>🚀 Start Shopping</b> button ကို နှိပ်ပေးပါရှင့်။</p>
        
        <button 
          onClick={() => setView('home')}
          className="w-full max-w-sm bg-blue-600 text-white py-4.5 rounded-2xl font-bold shadow-[0_10px_30px_-5px_rgba(37,99,235,0.4)] active:scale-95 transition-all flex items-center justify-center gap-3 text-lg mb-6"
        >
          🚀 Start Shopping <ChevronRight size={20} />
        </button>

        <button className="flex items-center gap-2 text-blue-600 font-bold py-2 bg-blue-50 px-4 rounded-full">
          🎁 MM Tech Grand Opening Promotion
        </button>
      </div>

      <div className="p-6 pb-8 bg-slate-50 border-t border-slate-100 mt-auto">
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mx-auto">
          <a href="https://sonema.znnt.org/" target="_blank" rel="noreferrer" className="bg-white py-4 rounded-xl border border-slate-200 flex flex-col items-center shadow-sm active:bg-slate-50">
            <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">စုံ/မ စစ်ဆေးရန်</span>
          </a>
          <a href="http://www.ceir.gov.mm" target="_blank" rel="noreferrer" className="bg-white py-4 rounded-xl border border-slate-200 flex flex-col items-center shadow-sm active:bg-slate-50">
            <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">CEIR စစ်ဆေးရန်</span>
          </a>
        </div>
      </div>
    </div>
  );

  const HomeScreen = () => (
    <div className="flex flex-col h-full w-full bg-slate-50 overflow-hidden relative">
      <div className="bg-white p-6 rounded-b-[2.5rem] shadow-sm flex-shrink-0 z-10 border-b border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-slate-800">MM Tech Store</h2>
          <button onClick={fetchProducts} className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 active:bg-blue-100">
            <Gift size={20} />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="w-full bg-slate-100 py-4 pl-12 pr-4 rounded-2xl outline-none focus:ring-2 ring-blue-500 transition-all text-sm font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 pb-32 custom-scrollbar">
        <h3 className="font-bold text-slate-400 uppercase tracking-widest text-[11px] mb-4">Categories</h3>
        <div className="grid grid-cols-2 gap-4 mb-8">
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => { setSelectedCat(cat.id); setView('products'); }}
              className="bg-white p-5 rounded-3xl shadow-sm border border-transparent active:border-blue-500 active:bg-blue-50 flex flex-col items-center gap-3 transition-all"
            >
              <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">{cat.icon}</div>
              <span className="text-sm font-bold text-slate-700">{cat.name}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-400 uppercase tracking-widest text-[11px]">Popular Items</h3>
          {loading && <Loader2 className="animate-spin text-blue-600" size={20} />}
        </div>
        
        <div className="space-y-4">
          {products.length > 0 ? products.filter(p => searchQuery === '' || getVal(p, 'Name').toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
            <div 
              key={getVal(p, 'ID') || Math.random()}
              onClick={() => { setSelectedProduct(p); setView('details'); }}
              className="bg-white p-4 rounded-3xl shadow-sm flex gap-4 active:scale-95 transition-all cursor-pointer border border-transparent active:border-blue-100"
            >
              <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0">
                <img 
                  src={formatImageUrl(getVal(p, 'Link'))} 
                  alt="" 
                  className="w-full h-full object-cover" 
                  onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/100x100/e2e8f0/64748b?text=Img"; }} 
                />
              </div>
              <div className="flex flex-col justify-center flex-grow overflow-hidden">
                <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest truncate">{getVal(p, 'Category')}</span>
                <h4 className="font-bold text-slate-800 text-md truncate mt-0.5">{getVal(p, 'Name')}</h4>
                <span className="text-blue-600 font-black text-sm mt-1">{getVal(p, 'Price')} Ks</span>
              </div>
              <div className="flex items-center">
                <ChevronRight size={20} className="text-slate-300" />
              </div>
            </div>
          )) : (
            <div className="py-12 text-center text-slate-400 font-medium text-sm">
              {loading ? "အချက်အလက်များ ဆွဲယူနေပါသည်..." : "ပစ္စည်းမတွေ့ရှိပါရှင်။"}
            </div>
          )}
        </div>
      </div>

      <nav className="absolute bottom-0 left-0 right-0 w-full bg-white/90 backdrop-blur-lg border-t border-slate-100 p-4 flex justify-around items-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50">
        <button onClick={() => setView('home')} className="text-blue-600 p-2 active:scale-90 transition-transform"><ShoppingBag size={28} /></button>
        <button className="text-slate-400 p-2 active:scale-90 transition-transform"><History size={28} /></button>
        <button onClick={() => setView('welcome')} className="text-slate-400 p-2 active:scale-90 transition-transform"><Settings size={28} /></button>
      </nav>
    </div>
  );

  const ProductList = () => {
    const filtered = products.filter(p => getVal(p, 'Category') === selectedCat);
    return (
      <div className="flex flex-col h-full w-full bg-slate-50 overflow-hidden relative">
        <header className="p-6 flex items-center gap-4 bg-white shadow-sm flex-shrink-0 z-10 border-b border-slate-100">
          <button onClick={() => setView('home')} className="p-2 bg-slate-100 rounded-xl active:scale-90 transition-transform text-slate-600"><ArrowLeft size={20}/></button>
          <h2 className="text-xl font-black text-slate-800">{selectedCat}</h2>
        </header>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-24 custom-scrollbar">
          {filtered.length > 0 ? filtered.map(p => (
            <div 
              key={getVal(p, 'ID') || Math.random()}
              onClick={() => { setSelectedProduct(p); setView('details'); }}
              className="bg-white p-4 rounded-3xl shadow-sm flex items-center justify-between active:scale-95 transition-transform cursor-pointer border border-transparent active:border-blue-100"
            >
              <div className="flex items-center gap-4 overflow-hidden w-full">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold overflow-hidden flex-shrink-0">
                   <img 
                    src={formatImageUrl(getVal(p, 'Link'))} 
                    className="w-full h-full object-cover" 
                    onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/100x100/e2e8f0/64748b?text=Img"; }} 
                   />
                </div>
                <div className="overflow-hidden pr-2 flex-1">
                  <h4 className="font-bold text-slate-800 truncate text-md">{getVal(p, 'Name')}</h4>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5 truncate">{getVal(p, 'Plan')}</p>
                  <p className="text-sm font-black text-blue-600 mt-1">{getVal(p, 'Price')} Ks</p>
                </div>
              </div>
              <ChevronRight className="text-slate-300 flex-shrink-0" />
            </div>
          )) : (
            <div className="text-center py-20 text-slate-400 font-medium">ဤကဏ္ဍတွင် ပစ္စည်းမရှိသေးပါရှင်။</div>
          )}
        </div>
      </div>
    );
  };

  const ProductDetails = () => {
    const cat = getVal(selectedProduct, 'Category');
    const kpay = (cat === 'Game' || cat === 'Digital product') 
      ? "09793655312 (Sai Khun Thet Hein)" 
      : "09402021942 (Hnin Pwint Phyu)";

    return (
      <div className="flex flex-col h-full w-full bg-white overflow-hidden relative">
        <div className="relative h-[35vh] bg-slate-200 flex-shrink-0">
          <img 
            src={formatImageUrl(getVal(selectedProduct, 'Link'))} 
            className="w-full h-full object-cover" 
            onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x300/e2e8f0/64748b?text=No+Image"; }} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
          <button 
            onClick={() => setView('products')} 
            className="absolute top-6 left-6 p-3 bg-white/90 backdrop-blur rounded-2xl shadow-lg active:scale-90 transition-transform text-slate-800 z-10"
          >
            <ArrowLeft size={20}/>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 -mt-8 bg-white rounded-t-[2.5rem] relative shadow-[0_-10px_40px_rgba(0,0,0,0.1)] custom-scrollbar">
          <div className="flex justify-between items-start mb-6">
            <div className="overflow-hidden pr-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-3">{cat}</span>
              <h2 className="text-2xl font-black text-slate-800 leading-tight">{getVal(selectedProduct, 'Name')}</h2>
              <p className="text-slate-500 font-bold text-sm mt-1">{getVal(selectedProduct, 'Plan')}</p>
            </div>
            <div className="text-xl font-black text-blue-600 flex-shrink-0 mt-1">{getVal(selectedProduct, 'Price')} Ks</div>
          </div>
          
          <div className="mb-8">
            <h3 className="font-black text-slate-400 mb-3 uppercase text-[10px] tracking-widest">Description</h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium whitespace-pre-wrap">{getVal(selectedProduct, 'Des')}</p>
          </div>

          <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 mb-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3 text-sm">
              <CheckCircle2 size={18} className="text-green-500" /> Payment Info
            </h3>
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-medium text-center">ကျေးဇူးပြု၍ အောက်ပါအကောင့်သို့ ငွေလွှဲပေးပါရှင့်</p>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-sm">
                 <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">KPay Account</span>
                 <span className="text-sm font-black text-blue-700">{kpay}</span>
              </div>
            </div>
          </div>

          <div className="pb-8">
            <button 
              onClick={handleOrder}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4.5 rounded-2xl font-black shadow-lg shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 text-lg"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Confirm Order & Upload"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Outer Wrapper fixes the black bars by filling the whole screen with a soft background, 
  // and constraining the app container to mobile size (max-w-md) in the center.
  return (
    <div className="w-full min-h-screen bg-slate-100 flex justify-center items-center font-sans">
      <div className="w-full max-w-md h-[100dvh] bg-slate-50 relative overflow-hidden shadow-2xl flex flex-col border-x border-slate-200">
        {view === 'welcome' && <WelcomeScreen />}
        {view === 'home' && <HomeScreen />}
        {view === 'products' && <ProductList />}
        {view === 'details' && <ProductDetails />}
        {view === 'order_success' && (
          <div className="h-full w-full bg-white flex flex-col items-center justify-center p-8 text-center overflow-hidden">
            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-8 animate-bounce">
              <CheckCircle2 size={50} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Order Placed!</h2>
            <p className="text-slate-500 font-medium mb-10 text-sm max-w-xs leading-relaxed">အော်ဒါတင်ခြင်း အောင်မြင်ပါတယ်ရှင့်။ <br/> Admin မှ စစ်ဆေးပြီး ပစ္စည်းအား Telegram မှတစ်ဆင့် ပို့ဆောင်ပေးပါမည်။</p>
            <button onClick={() => setView('home')} className="w-full max-w-xs bg-slate-100 text-slate-800 py-4.5 rounded-2xl font-black active:scale-95 transition-transform shadow-sm">Back to Home</button>
          </div>
        )}
      </div>
    </div>
  );
}
