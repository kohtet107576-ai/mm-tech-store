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
  const [selectedGroup, setSelectedGroup] = useState(null); 
  const [selectedPlan, setSelectedPlan] = useState(null);   
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

  // Google Drive Image Link Fixer
  const formatImageUrl = (url) => {
    if (!url || typeof url !== 'string' || url.trim() === "") {
        return "https://placehold.co/400x400/112240/ffffff?text=MM+Tech";
    }
    const driveMatch = url.match(/(?:id=|\/d\/|src=)([\w-]{25,})/);
    if (driveMatch && driveMatch[1]) {
        return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
    }
    return url;
  };

  // --- Grouping Logic ---
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

  // --- Layout Wrapper ---
  const Container = ({ children, className = "" }) => (
    <div className={`w-full max-w-md mx-auto min-h-[100dvh] bg-[#0a192f] shadow-2xl relative ${className}`}>
        {children}
    </div>
  );

  // --- VIEW: Welcome ---
  if (view === 'welcome') return (
    <Container className="flex flex-col items-center justify-between py-12 px-8">
      <div className="flex flex-col items-center pt-10">
        <div className="w-28 h-28 bg-[#112240] rounded-[2rem] flex items-center justify-center border border-blue-500/20 shadow-2xl mb-8 overflow-hidden">
          <img src="https://placehold.co/300x300/112240/ffffff?text=MM+TECH" alt="Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2">MM Tech Store</h1>
        <p className="text-slate-400 text-sm leading-relaxed text-center px-4">
          Digital Products များကို <br/> စျေးနှုန်းချိုသာစွာဖြင့် ဝယ်ယူနိုင်ပါပြီ။
        </p>
      </div>

      <div className="w-full space-y-6">
        <button onClick={() => setView('home')} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
          🚀 Start Shopping <ChevronRight size={20} />
        </button>
        <div className="flex items-center justify-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
          <Star size={14} className="text-yellow-500" /> Grand Opening Promo
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full">
        <button className="bg-[#112240] py-3 rounded-xl border border-blue-900/50 text-[10px] font-black text-blue-400 text-center uppercase">စုံ/မ စစ်ဆေးရန်</button>
        <button className="bg-[#112240] py-3 rounded-xl border border-blue-900/50 text-[10px] font-black text-blue-400 text-center uppercase">CEIR စစ်ဆေးရန်</button>
      </div>
    </Container>
  );

  // --- VIEW: Home ---
  if (view === 'home') return (
    <Container className="pb-24">
      <div className="bg-[#0d1b33] p-6 rounded-b-[2.5rem] shadow-xl border-b border-blue-900/30 sticky top-0 z-30">
        <div className="flex justify-between items-center mb-6">
          <div className="text-left">
            <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">Premium Store</p>
            <h2 className="text-xl font-black text-white">MM Tech Store</h2>
          </div>
          <button onClick={fetchData} className={`p-2 rounded-xl bg-blue-600/10 text-blue-400 ${loading && 'animate-spin'}`}>
            <RefreshCw size={20}/>
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="w-full bg-[#0a192f] border border-blue-900/50 text-white py-3.5 pl-12 pr-4 rounded-2xl outline-none focus:ring-2 ring-blue-500/30 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="px-5 py-6">
        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">Categories</h3>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {categories.map(c => (
            <button key={c.id} onClick={() => { setSelectedCat(c.id); setView('products'); }}
              className="bg-[#112240] p-4 rounded-[1.5rem] flex items-center gap-3 border border-blue-900/20 active:bg-blue-600 transition-all group"
            >
              <div className="p-2 bg-blue-600/10 rounded-lg text-blue-400 group-active:text-white">{c.icon}</div>
              <span className="text-[11px] font-bold text-slate-300 group-active:text-white">{c.name}</span>
            </button>
          ))}
        </div>

        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">Popular Items</h3>
        <div className="grid grid-cols-3 gap-3">
          {loading ? (
            <div className="col-span-3 py-10 text-center"><Loader2 className="animate-spin text-blue-600 mx-auto" /></div>
          ) : (
            groupedData
              .filter(g => searchQuery === '' || g.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(group => (
                <div key={group.name} onClick={() => { setSelectedGroup(group); setView('group_details'); }}
                  className="bg-[#112240] p-2 rounded-2xl border border-blue-900/20 active:scale-95 transition-all text-center flex flex-col cursor-pointer"
                >
                  <div className="aspect-square bg-[#0a192f] rounded-xl overflow-hidden mb-2">
                    <img src={formatImageUrl(group.image)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <h4 className="text-white text-[9px] font-bold truncate px-1">{group.name}</h4>
                  <span className="text-blue-500 text-[8px] font-black mt-1">{group.plans.length} Plans</span>
                </div>
              ))
          )}
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#0a192f]/80 backdrop-blur-xl border-t border-blue-900/20 p-4 flex justify-around items-center z-50 rounded-t-3xl shadow-2xl">
        <button onClick={() => setView('home')} className="text-blue-500 p-2"><ShoppingBag size={24} /></button>
        <button className="text-slate-600 p-2"><History size={24} /></button>
        <button onClick={() => setView('welcome')} className="text-slate-600 p-2"><Settings size={24} /></button>
      </nav>
    </Container>
  );

  // --- Views for Product Details and Success ---
  if (view === 'products' || view === 'group_details' || view === 'details' || view === 'order_success') {
      return (
        <Container>
            {view === 'products' && (
                <div className="flex flex-col h-full">
                    <header className="p-5 bg-[#112240] flex items-center gap-4 sticky top-0 z-30 text-white">
                        <button onClick={() => setView('home')} className="p-2 bg-[#0a192f] rounded-lg"><ArrowLeft size={18}/></button>
                        <h2 className="text-lg font-black">{selectedCat}</h2>
                    </header>
                    <div className="p-5 grid grid-cols-3 gap-3">
                        {groupedData.filter(g => g.category === selectedCat).map(group => (
                            <div key={group.name} onClick={() => { setSelectedGroup(group); setView('group_details'); }}
                                className="bg-[#112240] p-2 rounded-2xl border border-blue-900/20 active:scale-95 text-center"
                            >
                                <div className="aspect-square bg-[#0a192f] rounded-xl overflow-hidden mb-2">
                                    <img src={formatImageUrl(group.image)} className="w-full h-full object-cover" alt="" />
                                </div>
                                <h4 className="text-white text-[9px] font-bold truncate">{group.name}</h4>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === 'group_details' && (
                <div className="flex flex-col h-full">
                    <div className="relative h-[35vh]">
                        <img src={formatImageUrl(selectedGroup?.image)} className="w-full h-full object-cover opacity-50" alt="" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a192f] to-transparent"></div>
                        <button onClick={() => setView('home')} className="absolute top-5 left-5 p-2 bg-black/20 backdrop-blur-md rounded-xl"><ArrowLeft size={18} className="text-white"/></button>
                    </div>
                    <div className="px-6 -mt-10 relative z-10">
                        <h2 className="text-2xl font-black text-white mb-6">{selectedGroup?.name}</h2>
                        <div className="space-y-3 pb-10">
                            {selectedGroup?.plans.map((p, idx) => (
                                <button key={idx} onClick={() => { setSelectedPlan(p); setView('details'); }}
                                    className="w-full bg-[#112240] p-4 rounded-2xl border border-blue-900/30 flex items-center justify-between active:border-blue-500"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-600/10 rounded-xl text-blue-400"><Layers size={16}/></div>
                                        <span className="text-sm font-bold text-white">{getPProp(p, 'Plan')}</span>
                                    </div>
                                    <span className="text-blue-500 font-black text-sm">{getPProp(p, 'Price')} Ks</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {view === 'details' && (
                <div className="flex flex-col h-full p-6">
                    <header className="flex items-center gap-4 mb-8">
                        <button onClick={() => setView('group_details')} className="p-2 bg-[#112240] rounded-lg text-white"><ArrowLeft size={18}/></button>
                        <h2 className="text-lg font-black text-white">Confirm Order</h2>
                    </header>
                    <div className="bg-[#112240] p-8 rounded-[2.5rem] border border-blue-900/30 text-center mb-8">
                        <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden mb-4 shadow-xl">
                            <img src={formatImageUrl(getPProp(selectedPlan, 'Link'))} className="w-full h-full object-cover" alt="" />
                        </div>
                        <h3 className="text-xl font-black text-white">{getPProp(selectedPlan, 'Name')}</h3>
                        <p className="text-blue-400 font-bold text-sm mb-4">{getPProp(selectedPlan, 'Plan')}</p>
                        <div className="text-2xl font-black text-white">{getPProp(selectedPlan, 'Price')} Ks</div>
                    </div>
                    <button onClick={handleOrder} disabled={loading} className="mt-auto w-full bg-blue-600 py-4 rounded-2xl font-black text-white active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                        {loading ? <Loader2 className="animate-spin" /> : "Confirm Order Now"}
                    </button>
                </div>
            )}

            {view === 'order_success' && (
                <div className="h-full flex flex-col items-center justify-center p-10 text-center">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
                        <CheckCircle2 size={40} className="text-green-500" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3">Order Success!</h2>
                    <p className="text-slate-400 text-sm mb-10 px-4">Telegram မှတစ်ဆင့် ဆက်သွယ်ပေးပါမည်။</p>
                    <button onClick={() => setView('home')} className="w-full bg-[#112240] py-4 rounded-2xl font-black text-blue-400 border border-blue-900/50">Back to Home</button>
                </div>
            )}
        </Container>
      );
  }

  return null;
}
