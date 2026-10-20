import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { 
  ShoppingBag, ArrowLeft, CheckCircle2, Loader2, User, ShieldCheck, 
  LogOut, Send, Image as ImageIcon, History, X, Search, ShoppingCart, 
  LogIn, Facebook, Share2, MessageCircle, ChevronRight, Trash2, 
  Megaphone, Phone, Copy, Check
} from 'lucide-react';

// --- (၁) CONFIGURATION ---
const LOGO_URL = "https://drive.google.com/thumbnail?id=1Lh-nHgyLMSr3rBVe4OGnjEvEspuMokd6&sz=w1000"; 
// 🔴 GAS Script URL အသစ်
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwHTn9ROfzNUroCtKDUEAdz07Qd7BEkMAwy7fpCXBxP665umrCV6RNE5Ndzxdtm9IMj/exec"; 

const API_SECRET = process.env.REACT_APP_API_SECRET ; 
const IMGBB_API_KEY = process.env.REACT_APP_IMGBB_API_KEY ;
const ADMIN_EMAILS = ["kohtet107576@gmail.com"]; 
const TG_BOT_URL = "https://t.me/mmtech19";

// 🟢 Firebase Config (Vercel မှ မရခဲ့လျှင် Error မတက်စေရန် Fallback များ ထည့်ထားသည်)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY ,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID ,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID "
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const appId = "mm-tech-store";

// --- (၂) UTILS & HELPERS ---
const getPProp = (p, k) => p?.[k] || p?.[k.toLowerCase()] || p?.[k.toUpperCase()] || "";
const formatImg = (url) => {
  if (!url || typeof url !== 'string' || url.trim() === '') return LOGO_URL;
  if (url.includes('drive.google.com')) {
    const idMatch = url.match(/[-\w]{25,}/);
    return idMatch ? `https://drive.google.com/thumbnail?id=${idMatch[0]}&sz=w1000` : LOGO_URL;
  }
  return url;
};

// Copy Button Component for Result Box
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors border border-blue-500/30 flex items-center gap-1 text-blue-300 active:scale-95">
      {copied ? <><Check size={12}/> <span className="text-[9px] font-bold">Copied</span></> : <><Copy size={12}/> <span className="text-[9px] font-bold">Copy</span></>}
    </button>
  );
};

export default function App() {
  const [view, setView] = useState('initializing');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]); 
  const [announcement, setAnnouncement] = useState("📢 MM Tech မှ ကြိုဆိုပါသည်! • 24/7 Auto-Buy အတွက် Telegram Bot သို့ သွားရောက်နိုင်ပါသည်။");

  // States
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const [editContact, setEditContact] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [payImg, setPayImg] = useState("");
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const [deliveryInputs, setDeliveryInputs] = useState({});

  // --- (၃) PROFILE & DATA SYNC ---
  const syncProfile = useCallback(async (u) => {
    const docRef = doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data');
    try {
      const docSnap = await getDoc(docRef);
      let pData = docSnap.exists() ? docSnap.data() : {
        name: u.displayName || "Customer", 
        email: u.email, 
        role: ADMIN_EMAILS.includes(u.email) ? 'admin' : 'user', 
        uid: u.uid, 
        photoURL: u.photoURL,
        phone: ""
      };
      await setDoc(docRef, pData, { merge: true });
      setProfile(pData);
      if (pData.phone) setCustomerPhone(pData.phone);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      if (u) { setUser(u); await syncProfile(u); } 
      else { setUser(null); setProfile(null); }
      setView('home'); 
    });

    fetch(SCRIPT_URL)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data);
        else if (data && typeof data === 'object') {
          if (Array.isArray(data.products)) setProducts(data.products);
          else if (Array.isArray(data.data)) setProducts(data.data);
          if (data.announcement) setAnnouncement(data.announcement);
        }
      })
      .catch(err => console.error("Sheet Fetch Error:", err));
  }, [syncProfile]);

  useEffect(() => {
    if (!user) return;
    
    // 🟢 Firebase Rule နှင့် ကိုက်ညီစေရန် Admin နှင့် User အော်ဒါ ဆွဲယူမှု ခွဲခြားခြင်း
    let qOrders;
    if (ADMIN_EMAILS.includes(user.email)) {
      qOrders = query(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderBy('timestamp', 'desc'));
    } else {
      qOrders = query(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), where('userId', '==', user.uid), orderBy('timestamp', 'desc'));
    }

    const unsubOrders = onSnapshot(qOrders, (sn) => {
      const docs = sn.docs.map(d => ({ id: d.id, ...d.data() }));
      if (ADMIN_EMAILS.includes(user.email)) {
        setAllOrders(docs); 
        setMyOrders(docs.filter(o => o && o.userId === user.uid));
      } else {
        setMyOrders(docs);
        setAllOrders([]);
      }
    }, (error) => {
      console.error("Order fetch error:", error);
    });
    
    const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    const unsubUser = onSnapshot(userRef, (docSnap) => { 
      if(docSnap.exists()) {
        const d = docSnap.data();
        setProfile(d);
        if (d.phone) setCustomerPhone(d.phone);
      } 
    });

    return () => {
      unsubOrders();
      unsubUser();
    };
  }, [user]);

  // --- (၄) ORDER SUBMIT LOGIC ---
  const handleOrder = async () => {
    if (!user) return setView('welcome');
    
    const totalPrice = cart.reduce((s, i) => s + parseInt(getPProp(i, 'Price') || 0), 0);
    const totalCost = cart.reduce((s, i) => s + parseInt(getPProp(i, 'Total') || getPProp(i, 'Cost') || 0), 0);

    if (cart.length === 0) return alert("စျေးဝယ်လှည်းထဲတွင် ပစ္စည်းမရှိသေးပါခင်ဗျာ။");
    if (!customerPhone.trim() || customerPhone.length < 8) return alert("ဆက်သွယ်ရမည့် ဖုန်းနံပါတ်ကို သေချာစွာ ဖြည့်သွင်းပေးပါခင်ဗျာ။");
    if (!editContact.trim()) return alert("လိုအပ်သော အချက်အလက်များ (ID / Pass / Game ID) အပြည့်အစုံ ဖြည့်ပေးပါဗျ။");
    if (!selectedPayment) return alert("ငွေလွှဲပေးချေမည့် ဘဏ်အကောင့်ကို ရွေးချယ်ပေးပါဗျ။");
    if (!payImg) return alert("ငွေလွှဲပြေစာ Screenshot ကို Upload တင်ပေးပါခင်ဗျာ။");

    setLoading(true);

    const orderData = {
      userId: user.uid,
      userGmail: user.email,
      userName: profile?.name || user.displayName,
      userPhone: customerPhone.trim(),
      product: cart.map(i => getPProp(i, 'Name')).join(", "),
      plan: cart.map(i => getPProp(i, 'Plan')).join(", "),
      prefix: cart.map(i => getPProp(i, 'Prefix') || "General").join(", "), 
      price: totalPrice,
      cost: totalCost, 
      contact: `📱 Phone: ${customerPhone.trim()}\n📝 Info: ${editContact.trim()}`,
      paymentMethod: selectedPayment.name,
      payImage: payImg,
      items: cart.map(i => ({ Name: getPProp(i, 'Name'), Plan: getPProp(i, 'Plan'), Price: getPProp(i, 'Price'), Prefix: getPProp(i, 'Prefix') })),
      date: new Date().toLocaleString('en-GB')
    };

    try {
      const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
      await updateDoc(profileRef, { phone: customerPhone.trim() });

      const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), { 
        ...orderData, 
        status: 'Pending', 
        timestamp: Date.now() 
      });

      await fetch(SCRIPT_URL, { 
        method: "POST", 
        mode: "no-cors", 
        body: JSON.stringify({ ...orderData, token: API_SECRET, type: "new_order", orderId: docRef.id }) 
      });

      setCart([]); 
      setPayImg(""); 
      setEditContact("");
      setView('order_success');
    } catch (e) { 
      console.error(e); 
      alert("အော်ဒါတင်ရာတွင် အမှားဖြစ်သွားပါသည်။ ပြန်ကြိုးစားပေးပါခင်ဗျာ။"); 
    } finally { 
      setLoading(false); 
    }
  };

  // 🟢 Web မှနေ၍ Order Status ပြောင်းခြင်း နှင့် Email တိုက်ရိုက်ပို့ခြင်း
  const updateOrderStatus = async (orderId, newStatus, resultData = "") => {
    try {
      setLoading(true);
      const orderRef = doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus, result: resultData });

      const currentOrder = allOrders.find(o => o.id === orderId);

      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
          token: API_SECRET,
          type: "send_email",
          orderId: orderId,
          userGmail: currentOrder?.userGmail,
          userName: currentOrder?.userName,
          product: currentOrder?.product,
          plan: currentOrder?.plan,
          paymentMethod: currentOrder?.paymentMethod,
          price: currentOrder?.price,
          date: currentOrder?.date,
          status: newStatus,
          result: resultData
        })
      });

      alert(newStatus === 'Completed' ? "အော်ဒါ အောင်မြင်စွာ ပို့ဆောင်ပြီးပါပြီ! Email လည်းပို့လိုက်ပါပြီ။" : "အော်ဒါအား ပယ်ဖျက်လိုက်ပါပြီ!");
    } catch (e) { 
      alert(e.message); 
    } finally { 
      setLoading(false); 
    }
  };

  // --- (၅) GROUPING PRODUCTS DIRECTLY UNDER CATEGORIES ---
  const groupedProducts = useMemo(() => {
    const groups = {};
    products.forEach(p => {
      const name = getPProp(p, 'Name');
      const cat = getPProp(p, 'Category');
      if (!name) return;
      const matchesSearch = searchTerm.trim() === '' || name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCat || cat.toLowerCase() === selectedCat.toLowerCase();
      if (matchesSearch && matchesCategory) {
        if (!groups[name]) groups[name] = { name, category: cat, image: getPProp(p, 'Link'), plans: [] };
        groups[name].plans.push(p);
      }
    });
    return Object.values(groups);
  }, [products, searchTerm, selectedCat]);

  // --- (၆) UI COMPONENTS ---
  const MainHeader = () => (
    <header className="sticky top-0 z-40 bg-[#0a192f]/95 backdrop-blur-md border-b border-blue-900/30">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setSelectedCat(null); setSearchTerm(''); setView('home'); }}>
          <img src={LOGO_URL} className="w-8 h-8 rounded-xl border border-blue-500/40 object-cover shadow-md" alt="Logo" onError={(e)=>{e.target.src=LOGO_URL;}} />
          <h1 className="text-base font-black text-white uppercase tracking-tight">MM Tech</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative cursor-pointer p-1.5 rounded-xl bg-blue-950/40 border border-blue-900/40 hover:border-blue-500/40 transition-all" onClick={() => setView('cart_view')}>
            <ShoppingCart size={20} className="text-blue-400" />
            {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">{cart.length}</span>}
          </div>
          {user ? (
            <img src={profile?.photoURL || LOGO_URL} className="w-8 h-8 rounded-xl border border-blue-500/50 cursor-pointer object-cover shadow-sm" onClick={() => setView('profile')} alt="User" onError={(e)=>{e.target.src=LOGO_URL;}} />
          ) : (
            <button onClick={() => setView('welcome')} className="bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1.5 border border-blue-500/30 active:scale-95 transition-all">
              <LogIn size={13}/> LOGIN
            </button>
          )}
        </div>
      </div>

      <a href={TG_BOT_URL} target="_blank" rel="noreferrer" className="mx-4 mb-2 p-2.5 rounded-2xl bg-gradient-to-r from-blue-900/50 via-blue-800/40 to-blue-900/50 border border-blue-500/40 flex items-center justify-between text-white active:scale-[0.99] transition-all shadow-lg hover:border-blue-400 group">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="text-[11px] font-black tracking-tight text-blue-200">MM Tech Auto-System (24/7)</span>
        </div>
        <span className="text-[9px] font-black bg-blue-600 px-2.5 py-1 rounded-xl text-white flex items-center gap-1 group-hover:bg-blue-500 transition-all">Open Telegram ➔</span>
      </a>

      <div className="mx-4 mb-3 py-1.5 px-3 bg-[#112240]/80 rounded-xl border border-blue-900/40 flex items-center overflow-hidden">
        <div className="flex items-center gap-1 text-amber-400 shrink-0 font-black text-[9px] pr-2 border-r border-blue-900/60 mr-2 bg-[#112240] z-10">
          <Megaphone size={12} className="animate-pulse text-amber-400" /> PROMO
        </div>
        <div className="overflow-hidden w-full relative">
          <div className="animate-marquee inline-block text-[11px] font-medium text-slate-300">{announcement}</div>
        </div>
      </div>
    </header>
  );

  const BottomNav = () => (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-5xl lg:max-w-screen-2xl bg-[#0a192f]/95 p-4 flex justify-around items-center z-50 rounded-t-3xl border-t border-blue-900/30 shadow-2xl backdrop-blur-md">
      <button onClick={() => { setSelectedCat(null); setSearchTerm(''); setView('home'); }} className={`flex flex-col items-center gap-1 transition-all ${view === 'home' ? 'text-blue-500 scale-105' : 'text-slate-400'}`}><ShoppingBag size={22}/><span className="text-[9px] font-bold">Store</span></button>
      <button onClick={() => user ? setView('customer_dash') : setView('welcome')} className={`flex flex-col items-center gap-1 transition-all ${view === 'customer_dash' ? 'text-blue-500 scale-105' : 'text-slate-400'}`}><History size={22}/><span className="text-[9px] font-bold">Orders</span></button>
      {profile?.role === 'admin' && <button onClick={() => setView('admin_dash')} className={`flex flex-col items-center gap-1 transition-all ${view === 'admin_dash' ? 'text-blue-500 scale-105' : 'text-slate-400'}`}><ShieldCheck size={22}/><span className="text-[9px] font-bold">Admin</span></button>}
      <button onClick={() => user ? setView('profile') : setView('welcome')} className={`flex flex-col items-center gap-1 transition-all ${view === 'profile' ? 'text-blue-500 scale-105' : 'text-slate-400'}`}><User size={22}/><span className="text-[9px] font-bold">Account</span></button>
    </nav>
  );

  if (view === 'initializing') return <div className="min-h-screen bg-[#050d1a] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40}/></div>;

  return (
    <div className="bg-[#050d1a] min-h-screen text-white font-sans flex items-center justify-center p-0 md:p-4">
      <style>{`
        @keyframes marquee { 
          0% { transform: translateX(100%); } 
          100% { transform: translateX(-50%); } 
        }
        .animate-marquee { 
          white-space: nowrap; 
          display: inline-block; 
          padding-right: 50px; 
          animation: marquee 35s linear infinite; 
        }
        .animate-marquee:hover { animation-play-state: paused; }
      `}</style>

      <div className="w-full max-w-md md:max-w-5xl lg:max-w-screen-2xl mx-auto min-h-[100dvh] md:min-h-[92vh] flex flex-col relative bg-[#0a192f] md:rounded-[2.5rem] border-x border-blue-900/20 shadow-2xl overflow-x-hidden md:border-y">
        
        {view === 'welcome' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0a192f] z-[60]">
            <img src={LOGO_URL} className="w-20 h-20 mb-6 rounded-3xl shadow-2xl border border-blue-500/30 object-cover" alt="Logo" onError={(e)=>{e.target.src=LOGO_URL;}} />
            <h2 className="text-3xl font-black mb-2 tracking-tight uppercase">MM Tech</h2>
            <p className="text-slate-400 text-xs mb-10 font-bold tracking-widest uppercase">Sign in to complete order</p>
            <button onClick={() => signInWithPopup(auth, googleProvider)} className="w-full max-w-xs bg-white text-black py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">Continue with Google</button>
            <button onClick={() => setView('home')} className="mt-6 text-blue-400 text-xs font-black uppercase tracking-widest">Back to Store</button>
          </div>
        )}

        {view === 'home' && (
          <>
            <MainHeader />
            <div className="p-5 pb-36">
              <div className="relative mb-5">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Search products..." className="w-full bg-[#112240] border border-blue-900/30 py-3.5 pl-12 pr-4 rounded-2xl text-xs outline-none focus:border-blue-500 transition-all text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-1">
                <button onClick={() => setSelectedCat(null)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${!selectedCat ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-[#112240] text-slate-300 hover:bg-[#152a4e]'}`}>All</button>
                {[...new Set(products.map(p => getPProp(p, 'Category')).filter(Boolean))].map(cat => (
                  <button key={cat} onClick={() => setSelectedCat(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedCat === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-[#112240] text-slate-300 hover:bg-[#152a4e]'}`}>{cat}</button>
                ))}
              </div>
              {groupedProducts.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs">ပစ္စည်းများ ရှာမတွေ့သေးပါခင်ဗျာ။</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                  {groupedProducts.map(group => (
                    <div key={group.name} onClick={() => { setSelectedGroup(group); setView('group_details'); }} className="bg-[#112240]/70 p-3 rounded-2xl border border-blue-900/20 active:scale-95 transition-all hover:border-blue-500/40 cursor-pointer shadow-md flex flex-col justify-between group">
                      <div className="aspect-square bg-[#0a192f] rounded-xl overflow-hidden mb-2.5">
                        <img src={formatImg(group.image)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={group.name} onError={(e)=>{e.target.src=LOGO_URL;}} />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black truncate text-white uppercase">{group.name}</h4>
                        <p className="text-[9px] text-blue-400 font-bold truncate mt-0.5">{group.plans?.length || 1} Plans Available</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <BottomNav />
          </>
        )}

        {/* --- VIEW: GROUP DETAILS (Plan Selection & Check Stock) --- */}
        {view === 'group_details' && (
          <div className="p-5 pb-36">
            <MainHeader />
            <div className="flex items-center gap-3 my-4">
              <button onClick={() => setView('home')} className="bg-[#112240] p-2 rounded-xl border border-blue-900/30 active:scale-90"><ArrowLeft size={18}/></button>
              <h3 className="text-sm font-black uppercase tracking-tight text-white">{selectedGroup?.name}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {selectedGroup?.plans.map((p, i) => {
                const stockVal = String(getPProp(p, 'Stock') || "Available").trim();
                const priceVal = parseInt(getPProp(p, 'Price') || 0);
                // 🟢 Stock 0 (သို့) Price 0 ဖြစ်နေလျှင် Disabled လုပ်မည်
                const isOutOfStock = stockVal === "0" || stockVal.toLowerCase() === "out of stock" || priceVal === 0; 
                
                return (
                  <div key={i} onClick={() => { if(!isOutOfStock) { setSelectedPlan(p); setView('plan_details'); } }} className={`bg-[#112240] p-4 rounded-3xl border border-blue-900/30 flex justify-between items-center transition-all ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98] hover:border-blue-500/40 cursor-pointer shadow-md'}`}>
                    <div>
                      <p className="text-xs font-black text-white">{getPProp(p, 'Plan')}</p>
                      <p className="text-blue-400 font-black text-xs mt-0.5">{priceVal.toLocaleString()} Ks</p>
                      {stockVal && stockVal !== "Available" && (
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${isOutOfStock ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>Stock: {stockVal}</span>
                      )}
                    </div>
                    {isOutOfStock ? <span className="text-[10px] text-red-400 font-black">{priceVal === 0 ? "Unavailable" : "ကုန်နေပါသည်"}</span> : <ChevronRight className="text-slate-400" size={18}/>}
                  </div>
                );
              })}
            </div>
            <BottomNav />
          </div>
        )}

        {/* --- VIEW: PLAN DETAILS (Combine TDes & MMDes) --- */}
        {view === 'plan_details' && selectedPlan && (
          <div className="p-5 pb-36">
            <MainHeader />
            <button onClick={() => setView('group_details')} className="my-4 bg-[#112240] p-2 rounded-xl border border-blue-900/30 active:scale-90"><ArrowLeft size={18}/></button>
            <div className="max-w-xl mx-auto bg-[#112240] p-6 rounded-[2.5rem] border border-blue-900/30 text-center shadow-2xl">
              <img src={formatImg(getPProp(selectedPlan, 'Link'))} className="w-28 h-28 mx-auto mb-4 rounded-3xl shadow-xl object-cover border border-blue-500/30" alt="P" onError={(e)=>{e.target.src=LOGO_URL;}} />
              <h3 className="text-xl font-black uppercase text-white mb-1">{getPProp(selectedPlan, 'Name')}</h3>
              <p className="text-xs text-slate-400 font-bold mb-2">{getPProp(selectedPlan, 'Plan')}</p>
              <p className="text-blue-400 text-2xl font-black mb-5">{parseInt(getPProp(selectedPlan, 'Price') || 0).toLocaleString()} Ks</p>
              
              {/* 🟢 TDes နှင့် MMDes ကို ပေါင်းပြခြင်း */}
              {(getPProp(selectedPlan, 'TDes') || getPProp(selectedPlan, 'MMDes') || getPProp(selectedPlan, 'Des')) && (
                <div className="p-4 bg-black/30 rounded-2xl text-[11px] text-slate-300 text-left mb-6 whitespace-pre-wrap leading-relaxed border border-blue-900/20">
                  <p className="text-blue-400 font-bold mb-2">📝 အသေးစိတ် အချက်အလက် (Details):</p>
                  {getPProp(selectedPlan, 'TDes') && <div className="mb-2">{getPProp(selectedPlan, 'TDes')}</div>}
                  {getPProp(selectedPlan, 'MMDes') && <div>{getPProp(selectedPlan, 'MMDes')}</div>}
                  {!getPProp(selectedPlan, 'TDes') && !getPProp(selectedPlan, 'MMDes') && getPProp(selectedPlan, 'Des')}
                </div>
              )}

              <button onClick={() => { if (!user) return setView('welcome'); setCart([...cart, selectedPlan]); setView('cart_view'); }} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-white active:scale-95 transition-all shadow-xl text-xs uppercase tracking-wider">ADD TO CART</button>
            </div>
            <BottomNav />
          </div>
        )}

        {/* --- VIEW: CART & CHECKOUT --- */}
        {view === 'cart_view' && (
          <div className="p-5 pb-36 flex flex-col flex-1">
            <MainHeader />
            <div className="flex justify-between items-center my-4"><button onClick={() => setView('home')} className="bg-[#112240] p-2 rounded-xl border border-blue-900/30"><ArrowLeft size={18}/></button><h3 className="text-sm font-black uppercase tracking-tight">Your Cart ({cart.length})</h3><div className="w-8"></div></div>
            {cart.length === 0 ? (
              <div className="mt-20 text-center opacity-40"><ShoppingCart size={50} className="mx-auto mb-3 text-slate-500"/><p className="font-bold uppercase text-xs">Empty Cart</p></div>
            ) : (
              <div className="max-w-xl mx-auto w-full space-y-3">
                {cart.map((item, idx) => (
                  <div key={idx} className="bg-[#112240] p-3.5 rounded-2xl flex items-center justify-between border border-blue-900/20 shadow-md">
                    <div className="flex items-center gap-3"><img src={formatImg(getPProp(item, 'Link'))} className="w-11 h-11 rounded-xl object-cover border border-blue-500/20" alt="I" onError={(e)=>{e.target.src=LOGO_URL;}} /><div><p className="text-xs font-black uppercase text-white truncate max-w-[170px]">{getPProp(item, 'Name')}</p><p className="text-[10px] text-blue-400 font-bold">{getPProp(item, 'Plan')} • {parseInt(getPProp(item, 'Price') || 0).toLocaleString()} Ks</p></div></div>
                    <button onClick={() => { const up = [...cart]; up.splice(idx, 1); setCart(up); }} className="text-red-400 p-2 hover:bg-red-500/10 rounded-xl"><Trash2 size={18}/></button>
                  </div>
                ))}
                <div className="mt-6 p-5 bg-[#112240] rounded-3xl border border-blue-500/20 shadow-xl">
                  <div className="flex justify-between items-center mb-5"><span className="text-xs font-bold text-slate-400 uppercase">Total Amount</span><span className="text-xl text-blue-400 font-black">{cart.reduce((s,i)=>s+parseInt(getPProp(i, 'Price') || 0), 0).toLocaleString()} Ks</span></div>
                  <button onClick={() => user ? setView('checkout') : setView('welcome')} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-white shadow-xl active:scale-95 transition-all text-xs uppercase tracking-wider">Proceed to Checkout</button>
                </div>
              </div>
            )}
            <BottomNav />
          </div>
        )}

        {view === 'checkout' && (
          <div className="p-5 pb-36 overflow-y-auto no-scrollbar">
            <MainHeader />
            <button onClick={() => setView('cart_view')} className="my-4 bg-[#112240] p-2 rounded-xl border border-blue-900/30"><ArrowLeft size={18}/></button>
            <div className="max-w-xl mx-auto">
              <div className="bg-[#112240] p-5 rounded-3xl border border-blue-900/30 text-center mb-6 shadow-md"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Checkout</span><p className="text-blue-400 font-black text-2xl mt-0.5">{cart.reduce((s,i)=>s+parseInt(getPProp(i, 'Price') || 0), 0).toLocaleString()} Ks</p></div>
              <div className="mb-4"><label className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 flex items-center gap-1"><Phone size={12} className="text-blue-400"/> ဆက်သွယ်ရမည့် ဖုန်းနံပါတ် *</label><input type="tel" placeholder="09123456789" className="w-full bg-[#112240] p-4 rounded-2xl text-xs outline-none border border-blue-900/30 focus:border-blue-500 text-white shadow-inner" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}/></div>
              <div className="mb-6"><label className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 block">လိုအပ်သော အချက်အလက် (ID, Password, Game ID, etc.) *</label><textarea rows="3" placeholder="ID, Password, Phone Number အစရှိသည့် လိုအပ်သော အချက်အလက်များ အကုန်ဒီမှာရေးပေးပါ..." className="w-full bg-[#112240] p-4 rounded-2xl text-xs outline-none border border-blue-900/30 focus:border-blue-500 text-white shadow-inner" value={editContact} onChange={e => setEditContact(e.target.value)} /></div>
              <div className="mb-6"><p className="text-[10px] font-black text-slate-400 uppercase mb-2.5 ml-1 tracking-widest">Payment Method</p>
                <div className="grid grid-cols-4 gap-2">
                  {[ 
                    { id: 'kpay', name: 'KBZ Pay', num: '09 976659997', user: 'Daw Khin Mar Wai', img: 'https://i.ibb.co/Jj3SFW3C/kpay-logo.png' }, 
                    { id: 'wave', name: 'Wave Money', num: '09 793655312', user: 'U Sai Khun Thet Hein', img: 'https://i.ibb.co/23yq59BX/wave-pay.png' }, 
                    { id: 'ayapay', name: 'UAB Pay', num: '09 2021942', user: 'U Htet Wai Soe', img: 'https://i.ibb.co/GQyyTxh2/uabpay.png' },
                    { id: 'visa', name: 'VISA', num: '4052 6403 0832 7313', user: 'U Htet Wai Soe', img: 'https://i.ibb.co/HLR2TxPr/Untitled-1.png' }, 
                  ].map(m => (
                    <button key={m.id} onClick={() => setSelectedPayment(m)} className={`p-2.5 rounded-2xl border bg-white aspect-square flex flex-col items-center justify-center transition-all ${selectedPayment?.id === m.id ? 'border-blue-500 border-4 scale-95 shadow-lg' : 'border-transparent opacity-80'}`}>
                      <img src={m.img} className="w-full h-auto max-h-7 object-contain mb-1" alt={m.name}/><span className="text-[8px] font-black text-slate-800 leading-tight">{m.name}</span>
                    </button>
                  ))}
                </div>
                {selectedPayment && <div className="mt-3.5 p-4 bg-blue-500/10 rounded-2xl border border-blue-500/30 animate-in zoom-in duration-200"><p className="text-[9px] font-black text-blue-400 uppercase">{selectedPayment.name}</p><h4 className="text-base font-black text-white mt-0.5">{selectedPayment.num}</h4><p className="text-[10px] text-slate-300 font-bold">Name: {selectedPayment.user}</p></div>}
              </div>
              <div className="mb-8"><p className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Payment Receipt *</p>
                <div className="w-full aspect-video bg-[#112240] rounded-3xl border-2 border-dashed border-blue-900/40 flex items-center justify-center relative overflow-hidden group">
                  {payImg ? (
                    <div className="w-full h-full relative"><img src={payImg} className="w-full h-full object-contain" alt="Receipt"/><button onClick={()=>setPayImg("")} className="absolute top-3 right-3 bg-red-500 p-2 rounded-full shadow-lg active:scale-90 transition-all"><X size={15}/></button></div>
                  ) : (
                    <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-blue-400 group-hover:bg-blue-500/5 transition-colors">
                      <ImageIcon size={30}/><span className="text-[10px] font-black mt-2 uppercase tracking-widest">Upload Screenshot</span>
                      <input type="file" className="hidden" accept="image/*" onChange={async e => {
                        if (!e.target.files[0]) return;
                        setLoading(true); const fd = new FormData(); fd.append("image", e.target.files[0]);
                        try { const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: fd }); const d = await res.json(); if(d.success) setPayImg(d.data.url); } catch(err) { alert("ပုံတင်ရာတွင် အမှားဖြစ်သွားပါသည်"); }
                        setLoading(false);
                      }} />
                    </label>
                  )}
                </div>
              </div>
              <button onClick={handleOrder} disabled={loading || !payImg || !selectedPayment || !customerPhone.trim()} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-white shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <><Send size={16}/> CONFIRM ORDER</>}
              </button>
            </div>
            <BottomNav />
          </div>
        )}

        {view === 'order_success' && (
          <div className="p-8 pb-36 flex-1 flex flex-col items-center justify-center text-center">
            <CheckCircle2 size={70} className="text-green-400 mb-5 animate-bounce" />
            <h3 className="text-2xl font-black uppercase text-white mb-2">Order Successful!</h3>
            <p className="text-slate-300 text-xs mb-8 max-w-sm leading-relaxed">သင့်အော်ဒါတင်ခြင်း အောင်မြင်ပါသည်။ Admin မှ စစ်ဆေးပြီး အမြန်ဆုံး ဆောင်ရွက်ပေးပါမည်။</p>
            <button onClick={() => setView('home')} className="w-full max-w-xs bg-blue-600 hover:bg-blue-500 py-3.5 rounded-2xl font-black text-white shadow-xl text-xs uppercase">Back to Store</button>
            <BottomNav />
          </div>
        )}

        {/* --- VIEW: CUSTOMER DASHBOARD (My Orders with Copy Box) --- */}
        {view === 'customer_dash' && (
          <div className="p-5 pb-36 flex-1 flex flex-col">
            <MainHeader />
            <h3 className="text-sm font-black uppercase my-4 tracking-tight text-white">My Orders History</h3>
            <div className="space-y-3.5 overflow-y-auto no-scrollbar flex-1">
              {myOrders.length === 0 ? (
                <p className="text-center text-slate-500 text-xs mt-20">No orders found.</p>
              ) : (
                myOrders.map(o => (
                  <div key={o.id} className="bg-[#112240] p-4 rounded-3xl border border-blue-900/30 shadow-md">
                    <div className="flex justify-between items-center mb-1.5">
                      <h4 className="text-xs font-black uppercase text-white">{o.product}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase ${o.status === 'Completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : o.status === 'Failed' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                        {o.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-blue-400 font-bold mb-1.5">{o.plan} • {parseInt(o.price || 0).toLocaleString()} Ks</p>
                    <p className="text-[9px] text-slate-400">Date: {o.date}</p>
                    
                    {/* 🟢 Result / Details Copy Box */}
                    {o.result && (
                      <div className={`mt-3 p-3.5 rounded-2xl border ${o.status === 'Completed' ? 'bg-[#0f2922] border-green-500/40' : 'bg-[#2a1318] border-red-500/40'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-[10px] font-bold ${o.status === 'Completed' ? 'text-green-400' : 'text-red-400'}`}>
                            {o.status === 'Completed' ? '✅ Result / Details:' : '❌ မအောင်မြင်ရသည့် အကြောင်းရင်း:'}
                          </span>
                          {o.status === 'Completed' && <CopyButton text={o.result} />}
                        </div>
                        <div className={`font-mono text-[11px] whitespace-pre-wrap break-all ${o.status === 'Completed' ? 'text-green-100' : 'text-red-200'}`}>
                          {o.result}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <BottomNav />
          </div>
        )}

        {/* --- VIEW: PROFILE --- */}
        {view === 'profile' && user && (
          <div className="p-5 pb-36 flex-1 flex flex-col items-center">
            <MainHeader />
            <div className="w-full max-w-sm bg-[#112240] p-6 rounded-[2.5rem] border border-blue-900/30 text-center my-auto shadow-2xl">
              <img src={profile?.photoURL || LOGO_URL} className="w-20 h-20 rounded-2xl mx-auto mb-3 border-2 border-blue-500/50 object-cover shadow-lg" alt="P" onError={(e)=>{e.target.src=LOGO_URL;}} />
              <h3 className="text-base font-black text-white mb-0.5">{profile?.name || user.displayName}</h3>
              <p className="text-slate-400 text-xs mb-3">{user.email}</p>
              {profile?.phone && <p className="text-blue-400 text-xs font-bold mb-5 flex items-center justify-center gap-1"><Phone size={12}/> {profile.phone}</p>}
              <button onClick={() => { signOut(auth); setView('home'); }} className="w-full bg-red-600/20 border border-red-500/30 text-red-400 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"><LogOut size={15}/> Sign Out</button>
            </div>
            <BottomNav />
          </div>
        )}

        {/* --- VIEW: ADMIN DASHBOARD (Direct Email & Reject Setup) --- */}
        {view === 'admin_dash' && profile?.role === 'admin' && (
          <div className="p-5 pb-36 flex-1 flex flex-col">
            <MainHeader />
            <h3 className="text-sm font-black uppercase my-4 tracking-tight text-white">Management Dashboard</h3>
            <div className="space-y-4 overflow-y-auto no-scrollbar max-w-3xl mx-auto w-full flex-1">
              {allOrders.map(o => (
                <div key={o.id} className="bg-[#112240] p-5 rounded-3xl border border-blue-900/30 shadow-lg relative overflow-hidden">
                  {/* Status Indicator Bar at Left */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${o.status === 'Completed' ? 'bg-green-500' : o.status === 'Failed' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                  
                  <div className="flex justify-between items-start mb-2 pl-2">
                    <div>
                      <h4 className="font-black text-xs uppercase text-white">{o.product}</h4>
                      <p className="text-blue-400 text-[10px] font-black uppercase mt-0.5">{o.plan} • {parseInt(o.price || 0).toLocaleString()} Ks</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${o.status === 'Completed' ? 'bg-green-500/20 text-green-400' : o.status === 'Failed' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {o.status}
                    </span>
                  </div>
                  
                  <div className="bg-black/30 p-4 rounded-2xl text-[11px] text-slate-300 mb-3 whitespace-pre-wrap border border-blue-900/20 ml-2">
                    <p className="mb-1"><b>ID:</b> <span className="text-slate-400 text-[9px]">#{o.id}</span></p>
                    <p className="mb-1"><b>User:</b> {o.userName} ({o.userGmail})</p>
                    <p className="mb-3"><b>Payment:</b> {o.paymentMethod}</p>
                    <div className="p-2 bg-[#0a192f] rounded-lg border border-blue-900/40 text-blue-200">
                      <b>Order Details:</b><br/>{o.contact}
                    </div>
                  </div>

                  <div className="pl-2">
                    {o.payImage && (
                      <a href={o.payImage} target="_blank" rel="noreferrer" className="block w-full bg-blue-600/20 border border-blue-500/30 p-2.5 rounded-xl text-center text-[10px] font-black text-blue-300 hover:bg-blue-600/30 mb-3 transition-all flex items-center justify-center gap-2">
                        <ImageIcon size={14}/> View Receipt Screenshot
                      </a>
                    )}

                    {o.status === 'Pending' && (
                      <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-blue-900/40">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Deliver Code OR Reject Reason</label>
                        <textarea 
                          rows="3" 
                          placeholder="e.g. user@gmail.com / Pass123" 
                          className="w-full bg-[#0a192f] p-3.5 rounded-xl text-xs outline-none border border-blue-900/30 focus:border-blue-500 text-white font-mono" 
                          value={deliveryInputs[o.id] || ''} 
                          onChange={e => setDeliveryInputs({...deliveryInputs, [o.id]: e.target.value})} 
                        />
                        <div className="flex gap-2 mt-1">
                          <button onClick={() => updateOrderStatus(o.id, 'Completed', deliveryInputs[o.id] || "Order Completed Successfully.")} className="flex-1 bg-green-600 hover:bg-green-500 py-3 rounded-xl font-black text-[10px] uppercase shadow-md active:scale-95 flex items-center justify-center gap-1.5 transition-colors">
                            <CheckCircle2 size={15}/> CONFIRM & SEND
                          </button>
                          <button onClick={() => updateOrderStatus(o.id, 'Failed', deliveryInputs[o.id] || "ငွေလွှဲပြေစာ(သို့) account id မှားယွင်းနေပါသဖြင့် စီစစ်ပြီးမှတင်ပေးပါရှင့်")} className="flex-1 bg-red-600 hover:bg-red-500 py-3 rounded-xl font-black text-[10px] uppercase shadow-md active:scale-95 flex items-center justify-center gap-1.5 transition-colors">
                            <X size={15}/> REJECT
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <BottomNav />
          </div>
        )}

      </div>
    </div>
  );
}
