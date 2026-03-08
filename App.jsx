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
  Phone,
  Loader2
} from 'lucide-react';

// --- CONFIGURATION ---
// လူကြီးမင်းရဲ့ Google Apps Script URL ကို ဒီနေရာမှာ ထည့်ရပါမယ်
const SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE"; 

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

  // Google Drive Link ကို Image ပေါ်အောင် ပြောင်းပေးသည့် Function
  const formatImageUrl = (url) => {
    if (!url || typeof url !== 'string') return "https://placehold.co/400x300/e2e8f0/64748b?text=No+Image";
    if (url.includes('drive.google.com')) {
      let fileId = "";
      try {
        if (url.includes('id=')) fileId = url.split('id=')[1].split('&')[0];
        else if (url.includes('/d/')) fileId = url.split('/d/')[1].split('/')[0];
      } catch (e) { return url; }
      return fileId ? `https://drive.google.com/uc?export=view&id=${fileId}` : url;
    }
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
      // ဒီနေရာမှာ အမှန်တကယ် ချိတ်ဆက်တဲ့အခါ fetch(SCRIPT_URL) ကို သုံးရပါမယ်
      // အခုလောလောဆယ် နမူနာ data ဖြင့် ပြသထားပါတယ်
      setTimeout(() => {
        setProducts([
          { id: '1', Category: 'Game', Name: 'PUBG UC', Plan: '60 UC', Price: '3500', Des: 'Fast Delivery', Link: 'https://placehold.co/400x200?text=PUBG' },
          { id: '2', Category: 'Digital product', Name: 'Netflix', Plan: '1 Month', Price: '8500', Des: 'Premium UHD', Link: 'https://placehold.co/400x200?text=Netflix' }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const handleOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Google Sheet သို့ Order တင်သည့် Logic (POST Request)
    setTimeout(() => {
      setLoading(false);
      setView('order_success');
    }, 1500);
  };

  const WelcomeScreen = () => (
    <div className="flex flex-col h-[100dvh] bg-white p-6 text-center overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-200">
          <ShoppingBag size={48} color="white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">MM Tech မှ ကြိုဆိုပါတယ်ရှင့်</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">လူကြီးမင်း အလိုရှိတဲ့ product ကိုဝယ်ဖို့ အောက်က <br/><b>🚀 Start Shopping</b> button ကို နှိပ်ပေးပါရှင့်။</p>
        
        <button 
          onClick={() => setView('home')}
          className="w-full max-w-sm bg-blue-600 text-white py-4 rounded-2xl font-semibold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 mb-4"
        >
          🚀 Start Shopping <ChevronRight size={18} />
        </button>

        <button className="flex items-center gap-2 text-blue-600 font-medium py-2">
          🎁 MM Tech Grand Opening Promotion
        </button>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-4 w-full max-w-sm mx-auto pb-4">
        <a href="https://sonema.znnt.org/" target="_blank" rel="noreferrer" className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center active:bg-slate-100">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">စုံ/မ စစ်ဆေးရန်</span>
        </a>
        <a href="http://www.ceir.gov.mm" target="_blank" rel="noreferrer" className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center active:bg-slate-100">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">CEIR စစ်ဆေးရန်</span>
        </a>
      </div>
    </div>
  );

  const HomeScreen = () => (
    <div className="flex flex-col h-[100dvh] bg-slate-50 overflow-hidden">
      <div className="bg-white p-6 rounded-b-[2.5rem] shadow-sm flex-shrink-0 z-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-extrabold text-slate-800">MM Tech Store</h2>
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
            <Gift size={20} />
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="w-full bg-slate-100 py-3.5 pl-12 pr-4 rounded-2xl outline-none focus:ring-2 ring-blue-500 transition-all text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-28 custom-scrollbar">
        <h3 className="font-bold text-slate-800 mb-4 text-lg">Categories</h3>
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
          <h3 className="font-bold text-slate-800 text-lg">Popular Items</h3>
          {loading && <Loader2 className="animate-spin text-blue-600" size={20} />}
        </div>
        
        <div className="space-y-4">
          {products.filter(p => searchQuery === '' || (p.Name || '').toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
            <div 
              key={p.id || Math.random()}
              onClick={() => { setSelectedProduct(p); setView('details'); }}
              className="bg-white p-4 rounded-3xl shadow-sm flex gap-4 active:scale-95 transition-all cursor-pointer border border-white active:border-blue-100"
            >
              <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0">
                <img src={formatImageUrl(p.Link)} alt={p.Name} className="w-full h-full object-cover" onError={(e) => e.target.src="https://placehold.co/100"} />
              </div>
              <div className="flex flex-col justify-center flex-grow overflow-hidden">
                <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest truncate">{p.Category}</span>
                <h4 className="font-bold text-slate-800 text-md truncate">{p.Name}</h4>
                <span className="text-blue-600 font-extrabold">{p.Price} Ks</span>
              </div>
              <div className="flex items-center">
                <ChevronRight size={20} className="text-slate-300" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-lg border-t border-slate-100 p-4 flex justify-around items-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50">
        <button onClick={() => setView('home')} className="text-blue-600 p-2 active:scale-90 transition-transform"><ShoppingBag size={26} /></button>
        <button className="text-slate-400 p-2 active:scale-90 transition-transform"><History size={26} /></button>
        <button onClick={() => setView('welcome')} className="text-slate-400 p-2 active:scale-90 transition-transform"><Settings size={26} /></button>
      </nav>
    </div>
  );

  const ProductList = () => {
    const filtered = products.filter(p => p.Category === selectedCat);
    return (
      <div className="flex flex-col h-[100dvh] bg-slate-50 overflow-hidden">
        <header className="p-6 flex items-center gap-4 bg-white shadow-sm flex-shrink-0 z-10">
          <button onClick={() => setView('home')} className="p-2 bg-slate-100 rounded-xl active:scale-90 transition-transform"><ArrowLeft size={20}/></button>
          <h2 className="text-xl font-black text-slate-800">{selectedCat}</h2>
        </header>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-24">
          {filtered.length > 0 ? filtered.map(p => (
            <div 
              key={p.id || Math.random()}
              onClick={() => { setSelectedProduct(p); setView('details'); }}
              className="bg-white p-4 rounded-3xl shadow-sm flex items-center justify-between active:scale-95 transition-transform cursor-pointer"
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold overflow-hidden flex-shrink-0">
                   <img src={formatImageUrl(p.Link)} className="w-full h-full object-cover" onError={(e) => e.target.src="https://placehold.co/100"} />
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-bold text-slate-800 truncate">{p.Name}</h4>
                  <p className="text-xs font-bold text-blue-600">{p.Price} Ks</p>
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
    const kpay = (selectedProduct.Category === 'Game' || selectedProduct.Category === 'Digital product') 
      ? "09793655312 (Sai Khun Thet Hein)" 
      : "09402021942 (Hnin Pwint Phyu)";

    return (
      <div className="flex flex-col h-[100dvh] bg-white overflow-hidden">
        <div className="relative h-[35vh] bg-slate-200 flex-shrink-0">
          <img src={formatImageUrl(selectedProduct.Link)} className="w-full h-full object-cover" onError={(e) => e.target.src="https://placehold.co/400x300"} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          <button 
            onClick={() => setView('products')} 
            className="absolute top-6 left-6 p-3 bg-white/90 backdrop-blur rounded-2xl shadow-lg active:scale-90 transition-transform"
          >
            <ArrowLeft size={20}/>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 -mt-8 bg-white rounded-t-[2.5rem] relative shadow-[-10px_-10px_30px_rgba(0,0,0,0.1)] custom-scrollbar">
          <div className="flex justify-between items-start mb-4">
            <div className="overflow-hidden pr-2">
              <span className="px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-tighter inline-block mb-2">{selectedProduct.Category}</span>
              <h2 className="text-2xl font-black text-slate-800 leading-tight">{selectedProduct.Name}</h2>
              <p className="text-slate-500 font-bold text-sm mt-1">{selectedProduct.Plan}</p>
            </div>
            <div className="text-xl font-black text-blue-600 flex-shrink-0 mt-1">{selectedProduct.Price} Ks</div>
          </div>
          
          <div className="my-6">
            <h3 className="font-black text-slate-800 mb-2 uppercase text-[10px] tracking-widest">Description</h3>
            <p className="text-slate-500 text-sm leading-relaxed font-medium whitespace-pre-wrap">{selectedProduct.Des}</p>
          </div>

          <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 mb-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3 text-sm">
              <CheckCircle2 size={18} className="text-green-500" /> Payment Info
            </h3>
            <div className="space-y-2">
              <p className="text-xs text-slate-500 font-medium text-center mb-2">ကျေးဇူးပြု၍ အောက်ပါအကောင့်သို့ ငွေလွှဲပေးပါရှင့်</p>
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
                 <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">KPay Account</span>
                 <span className="text-sm md:text-md font-black text-blue-700">{kpay}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleOrder}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 mb-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Confirm Order & Upload"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto h-[100dvh] relative bg-slate-50 overflow-hidden shadow-2xl border-x border-slate-200">
      {view === 'welcome' && <WelcomeScreen />}
      {view === 'home' && <HomeScreen />}
      {view === 'products' && <ProductList />}
      {view === 'details' && <ProductDetails />}
      {view === 'order_success' && (
        <div className="h-[100dvh] bg-white flex flex-col items-center justify-center p-8 text-center overflow-hidden">
          <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-8 animate-bounce">
            <CheckCircle2 size={50} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-3">Order Placed!</h2>
          <p className="text-slate-500 font-medium mb-10 text-sm">အော်ဒါတင်ခြင်း အောင်မြင်ပါတယ်ရှင့်။ Admin မှ စစ်ဆေးပြီး ပစ္စည်းအား Telegram မှတစ်ဆင့် ပို့ဆောင်ပေးပါမည်။</p>
          <button onClick={() => setView('home')} className="w-full max-w-xs bg-slate-100 text-slate-800 py-4 rounded-2xl font-black active:scale-95 transition-transform">Back to Home</button>
        </div>
      )}
    </div>
  );
}
