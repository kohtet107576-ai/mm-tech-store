import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, setPersistence, browserLocalPersistence, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, updateDoc, query, orderBy } from 'firebase/firestore';
import { ShoppingBag, Gamepad2, Smartphone, ChevronRight, ArrowLeft, CheckCircle2, Loader2, User, ShieldCheck, LogOut, Send, Save, Layers, Image as ImageIcon, History, Plus, X } from 'lucide-react';

// --- CONFIGURATION ---
const LOGO_URL = "https://drive.google.com/thumbnail?id=1Lh-nHgyLMSr3rBVe4OGnjEvEspuMokd6&sz=w1000"; 
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyLEW9hAzeMYuhYz50_bIDOsiNwVRxDENSjsgL3qoddlgqZAD5DV95I1jKaqJVim9wI/exec";
const IMGBB_API_KEY = "88d3b49cfcf4fa4b1e77ce493aa3172a";
const ADMIN_EMAILS = ["kohtet107576@gmail.com"]; 
const TELEGRAM_BOT_TOKEN = "8666075565:AAFFgji8bX9jxcx90GMMqYq-JwKH-PTU2vk";
const TELEGRAM_CHAT_ID = "7427263125";

const firebaseConfig = {
  apiKey: "AIzaSyCBWTPAr0xWwpN9ASinAQWK_incw8kD-v4",
  authDomain: "mm-tech-store.firebaseapp.com",
  projectId: "mm-tech-store",
  storageBucket: "mm-tech-store.firebasestorage.app",
  messagingSenderId: "719292118752",
  appId: "1:719292118752:web:5cd87e7bb4d4582884c285"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const appId = "mm-tech-store";

// --- UTILS ---
const getPProp = (p, k) => p?.[k] || p?.[k.toLowerCase()] || p?.[k.toUpperCase()] || "";
const formatImg = (url) => {
  if (!url || typeof url !== 'string') return LOGO_URL;
  if (url.includes('drive.google.com')) {
    const idMatch = url.match(/[-\w]{25,}/);
    return idMatch ? `https://drive.google.com/thumbnail?id=${idMatch[0]}&sz=w1000` : LOGO_URL;
  }
  return url;
};

export default function App() {
  const [view, setView] = useState('initializing');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]); 
  const [allMembers, setAllMembers] = useState([]); 
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [editContact, setEditContact] = useState('');
  const [adminTab, setAdminTab] = useState('orders');
  const [deliveryInputs, setDeliveryInputs] = useState({});
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [techImages, setTechImages] = useState([null, null, null]);
  const [payImg, setPayImg] = useState("");
  export default function App() {
  const [view, setView] = useState('initializing');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]); 
  const [allMembers, setAllMembers] = useState([]); 
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [editContact, setEditContact] = useState('');
  const [adminTab, setAdminTab] = useState('orders');
  const [deliveryInputs, setDeliveryInputs] = useState({});
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [techImages, setTechImages] = useState([null, null, null]);
  const [payImg, setPayImg] = useState("");

  const dynamicCategories = useMemo(() => {
    const uniqueCats = [...new Set(products.map(p => getPProp(p, 'Category')).filter(Boolean))];
    return uniqueCats.map(cat => ({ id: cat, name: cat, icon: <Layers size={16}/> }));
  }, [products]);

  const syncProfile = useCallback(async (u) => {
    const docRef = doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data');
    const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'members', u.uid);
    try {
      const docSnap = await getDoc(docRef);
      let pData = docSnap.exists() ? docSnap.data() : {
        name: u.displayName || "User", email: u.email, 
        tier: ADMIN_EMAILS.includes(u.email) ? 'Admin' : 'Standard',
        role: ADMIN_EMAILS.includes(u.email) ? 'admin' : 'user', 
        uid: u.uid, photoURL: u.photoURL, createdAt: new Date().toISOString()
      };
      await setDoc(docRef, pData, { merge: true });
      await setDoc(memberRef, pData, { merge: true });
      setProfile(pData);
    } catch (e) { console.error("Sync Error:", e); }
  }, []);

  const dynamicCategories = useMemo(() => {
    const uniqueCats = [...new Set(products.map(p => getPProp(p, 'Category')).filter(Boolean))];
    return uniqueCats.map(cat => ({ id: cat, name: cat, icon: <Layers size={16}/> }));
  }, [products]);

  const syncProfile = useCallback(async (u) => {
    const docRef = doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data');
    const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'members', u.uid);
    try {
      const docSnap = await getDoc(docRef);
      let pData = docSnap.exists() ? docSnap.data() : {
        name: u.displayName || "User", email: u.email, 
        tier: ADMIN_EMAILS.includes(u.email) ? 'Admin' : 'Standard',
        role: ADMIN_EMAILS.includes(u.email) ? 'admin' : 'user', 
        uid: u.uid, photoURL: u.photoURL, createdAt: new Date().toISOString()
      };
      await setDoc(docRef, pData, { merge: true });
      await setDoc(memberRef, pData, { merge: true });
      setProfile(pData);
    } catch (e) { console.error("Sync Error:", e); }
  }, []);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence);
    const unsubscribe = onAuthStateChanged(auth, async (currUser) => {
      if (currUser) { setUser(currUser); await syncProfile(currUser); setView('home'); } 
      else { setUser(null); setProfile(null); setView('welcome'); }
    });
    return () => unsubscribe();
  }, [syncProfile]);

  useEffect(() => {
    fetch(SCRIPT_URL).then(res => res.json()).then(data => { if (Array.isArray(data)) setProducts(data); });
  }, []);

  useEffect(() => {
    if (!user) return;
    const qOrders = query(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderBy('timestamp', 'desc'));
    const unsubOrders = onSnapshot(qOrders, (sn) => {
      const docs = sn.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllOrders(docs); setMyOrders(docs.filter(o => o.userId === user.uid));
    });
    let unsubMembers = () => {};
    if (profile?.role === 'admin') {
      unsubMembers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'members'), (sn) => {
        setAllMembers(sn.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
    return () => { unsubOrders(); unsubMembers(); };
  }, [user, profile]);

  const handleLogin = async () => { try { await signInWithPopup(auth, googleProvider); } catch (e) { console.error(e); } };

  const handleImageUpload = async (file, index, type) => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        if (type === 'tech') {
          const updated = [...techImages]; updated[index] = data.data.url; setTechImages(updated);
        } else { setPayImg(data.data.url); }
      }
    } catch (e) { alert("Upload error. Try VPN."); } finally { setLoading(false); }
  };

  const getDisplayPrice = (plan) => {
    const tier = profile?.tier || 'Standard';
    return getPProp(plan, `Price_${tier}`) || getPProp(plan, 'Price');
  };

  const handleOrder = async () => {
    if (!editContact.trim()) return alert("အချက်အလက်များ ဖြည့်ပေးပါဦးဗျ");
    if (!payImg) return alert("ငွေလွှဲ Screenshot တင်ပေးပါဦးဗျ");
    setLoading(true);
    const orderData = {
      userId: user.uid, userName: profile?.name, product: getPProp(selectedPlan, 'Name'),
      plan: getPProp(selectedPlan, 'Plan'), price: getDisplayPrice(selectedPlan),
      contact: editContact, paymentMethod: selectedPayment?.name || 'KPay',
      techImages: techImages.filter(img => img !== null), payImage: payImg, 
      status: 'Pending', timestamp: Date.now(), date: new Date().toLocaleString('en-GB')
    };
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderData);
      const teleMsg = `🔔 *Order အသစ်ရပါပြီ!*\n👤 အမည်: ${orderData.userName}\n📦 ပစ္စည်း: ${orderData.product}\n💎 Plan: ${orderData.plan}\n💰 ဈေးနှုန်း: ${orderData.price} Ks\n📞 အချက်အလက်: ${orderData.contact}\n📱 [ငွေလွှဲပြေစာ](${orderData.payImage})`;
      fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: teleMsg, parse_mode: 'Markdown' })
      });
      fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(orderData) });
      setTechImages([null, null, null]); setPayImg(""); setEditContact(""); setSelectedPayment(null);
      setView('order_success');
    } catch (e) { alert("Error: " + e.message); } finally { setLoading(false); }
  };

  const updateStatus = async (orderId, newStatus, resultData = "") => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId), { status: newStatus, result: resultData });
      alert("Order Updated!");
    } catch (e) { console.error(e); }
  };

  const groupedProducts = useMemo(() => {
    const groups = {};
    products.forEach(p => {
      const name = getPProp(p, 'Name');
      if (name) {
        if (!groups[name]) groups[name] = { name, category: getPProp(p, 'Category'), image: getPProp(p, 'Link'), plans: [] };
        groups[name].plans.push(p);
      }
    });
    return Object.values(groups);
  }, [products]);

  const MainHeader = () => (
    <div className="flex items-center justify-between p-4 md:px-10 lg:px-16 bg-[#0a192f] border-b border-blue-900/20 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-lg border border-blue-500/30 overflow-hidden bg-[#112240] flex items-center justify-center">
          <img src={formatImg(LOGO_URL)} className="w-full h-full object-contain" alt="Logo" />
        </div>
        <h2 className="text-md font-black text-white uppercase tracking-tighter">MM Tech</h2>
      </div>
      <button onClick={() => setView('customer_dash')} className="text-white relative hover:text-blue-400 transition-colors"><ShoppingBag size={24}/></button>
    </div>
  );

  const BottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a192f]/95 border-t border-blue-900/20 p-5 flex justify-around items-center z-50 w-full md:max-w-2xl lg:max-w-3xl mx-auto rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300">
      <button onClick={() => setView('home')} className={`transition-all ${view === 'home' ? 'text-blue-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}><ShoppingBag size={24}/></button>
      <button onClick={() => setView('customer_dash')} className={`transition-all ${view === 'customer_dash' ? 'text-blue-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}><History size={24}/></button>
      {profile?.role === 'admin' && <button onClick={() => setView('admin_dash')} className={`transition-all ${view === 'admin_dash' ? 'text-blue-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}><ShieldCheck size={24}/></button>}
      <button onClick={() => setView('profile')} className={`transition-all ${view === 'profile' ? 'text-blue-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}><User size={24}/></button>
    </nav>
  );

  if (view === 'initializing') return <div className="min-h-screen bg-[#0a192f] flex flex-col items-center justify-center text-white"><Loader2 className="animate-spin text-blue-500" size={40}/></div>;

  return (
    <div className="bg-[#050d1a] min-h-screen text-white font-sans selection:bg-blue-500/30">
      
      {/* 🚀 အဓိက Container ကို ဖုန်း/ကွန်ပျူတာ အလိုအလျောက် အကျယ်ပြောင်းအောင် w-full သုံးထားပါသည် */}
      <div className="w-full min-h-screen flex flex-col relative bg-[#0a192f]">
        
        {view === 'welcome' && (
          <div className="flex flex-col flex-1 items-center justify-center p-10 text-center">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-[#112240] rounded-[2.5rem] border border-blue-500/20 mb-8 flex items-center justify-center overflow-hidden p-2 shadow-2xl">
              <img src={formatImg(LOGO_URL)} className="w-full h-full object-contain" alt="Logo" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-10 tracking-tighter uppercase">MM Tech</h1>
            <button onClick={handleLogin} className="w-full max-w-sm bg-white text-black py-4 rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all">Login with Google</button>
          </div>
        )}

        {view === 'home' && (
          <>
            <MainHeader />
            {/* 🚀 Desktop တွင် ဘေးဘက် Padding များများခွဲ၍ အလယ်ဗဟိုကျအောင် ပြင်ဆင်ထားသည် */}
            <div className="p-6 md:p-10 lg:p-16 pb-40 text-left max-w-[1600px] mx-auto w-full">
              <h1 className="text-3xl md:text-4xl font-black mb-6 md:mb-8">Store</h1>
              
              {/* Category Bar: Desktop တွင် flex-wrap ဖြင့် ခေါက်ပြမည် */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6 lg:flex-wrap">
                <button onClick={() => setSelectedCat(null)} className={`px-5 py-2.5 rounded-full text-[12px] md:text-sm font-black border transition-colors ${!selectedCat ? 'bg-blue-600 border-blue-500' : 'bg-[#112240] border-blue-900/30 hover:border-blue-500/50'}`}>All</button>
                {dynamicCategories.map(c => (
                  <button key={c.id} onClick={() => setSelectedCat(c.id)} className={`px-5 py-2.5 rounded-full text-[12px] md:text-sm font-black border whitespace-nowrap transition-colors ${selectedCat === c.id ? 'bg-blue-600 border-blue-400' : 'bg-[#112240] border-blue-900/30 hover:border-blue-500/50'}`}>{c.name}</button>
                ))}
              </div>

              {/* 🚀 Responsive Grid: ဖုန်းတွင် ၂တန်း၊ Tablet တွင် ၃တန်း၊ ကွန်ပျူတာတွင် ၄/၅ တန်း */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
                {groupedProducts.filter(g => !selectedCat || g.category === selectedCat).map(group => (
                  <div key={group.name} onClick={() => { setSelectedGroup(group); setView('group_details'); }} className="bg-[#112240]/60 p-3 md:p-4 rounded-2xl border border-blue-900/20 hover:border-blue-500/50 hover:bg-[#112240] active:scale-95 transition-all cursor-pointer shadow-lg">
                    <div className="aspect-square bg-[#0a192f] rounded-xl overflow-hidden mb-3 md:mb-4"><img src={formatImg(group.image)} className="w-full h-full object-cover transition-transform hover:scale-110 duration-500" alt="Img" /></div>
                    <h4 className="text-[12px] md:text-sm font-black truncate text-white uppercase">{group.name}</h4>
                  </div>
                ))}
              </div>
            </div>
            <BottomNav />
          </>
        )}

        {view === 'group_details' && (
          <div className="flex flex-col flex-1 pb-40 text-left">
            <MainHeader />
            <div className="p-6 md:p-10 lg:p-16 max-w-[1600px] mx-auto w-full">
              <button onClick={() => setView('home')} className="p-2 md:p-3 bg-[#112240] rounded-xl text-white mb-6 md:mb-8 border border-blue-900/20 hover:bg-blue-900/40 transition-colors"><ArrowLeft size={20}/></button>
              <h2 className="text-2xl md:text-3xl font-black mb-6 md:mb-8 tracking-tight uppercase">{selectedGroup?.name}</h2>
              
              {/* 🚀 Desktop တွင် Plan များကို Grid ဖြင့် တန်းစီပြမည် */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {selectedGroup?.plans.map((p, i) => (
                  <button key={i} onClick={() => { setSelectedPlan(p); setView('checkout'); }} className="w-full bg-[#112240] p-6 rounded-3xl border border-blue-900/20 flex items-center justify-between hover:border-blue-500/50 hover:bg-blue-900/20 active:scale-[0.98] transition-all shadow-lg">
                    <div className="text-left">
                      <h4 className="text-sm md:text-base font-black text-white mb-1">{getPProp(p, 'Plan')}</h4>
                      <p className="text-blue-500 font-black text-sm">{getDisplayPrice(p)} Ks</p>
                    </div>
                    <ChevronRight size={24} className="text-blue-500" />
                  </button>
                ))}
              </div>
            </div>
            <BottomNav />
          </div>
        )}

        {view === 'checkout' && (
          <div className="flex flex-col flex-1 pb-40 text-left w-full overflow-y-auto no-scrollbar">
            <MainHeader />
            
            {/* 🚀 Checkout Form သည် ကွန်ပျူတာတွင် အကျယ်ကြီးဖြစ်မသွားစေရန် max-w-3xl ဖြင့် ဗဟိုချထားသည် */}
            <div className="p-4 md:p-10 max-w-3xl mx-auto w-full">
              <button onClick={() => setView('group_details')} className="w-10 h-10 md:w-12 md:h-12 bg-[#112240] rounded-xl flex items-center justify-center mb-6 text-white border border-blue-900/20 hover:bg-blue-900/40 transition-colors"><ArrowLeft size={20}/></button>
              
              <div className="bg-[#112240] p-6 md:p-8 rounded-[2rem] border border-blue-900/30 text-center mb-6 md:mb-8 relative overflow-hidden shadow-xl">
                <img src={formatImg(getPProp(selectedPlan, 'Link'))} className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-4 rounded-3xl object-cover shadow-lg" alt="Product"/>
                <h3 className="text-xl md:text-2xl font-black text-white uppercase mb-2">{getPProp(selectedPlan, 'Name')}</h3>
                <p className="text-blue-400 text-[11px] md:text-xs font-bold tracking-widest uppercase mb-4">{getPProp(selectedPlan, 'Plan')}</p>
                
                <div className="text-2xl md:text-3xl font-black bg-[#0a192f] py-4 px-10 rounded-2xl inline-block mb-2 shadow-inner border border-blue-900/50">
                  {getDisplayPrice(selectedPlan)} Ks
                </div>

                {getPProp(selectedPlan, 'Des') && (
                  <div className="bg-[#050d1a] border border-blue-900/50 rounded-2xl p-5 mt-6 text-left shadow-inner">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 size={16} className="text-blue-500" />
                      <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Plan Details</span>
                    </div>
                    <p className="text-slate-300 text-[13px] md:text-sm leading-relaxed whitespace-pre-wrap">
                      {getPProp(selectedPlan, 'Des')}
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-6 md:mb-8">
                <label className="block text-slate-400 text-[11px] md:text-xs font-black uppercase mb-3 ml-2 tracking-widest">Customer Details (ID, Pass, Phone)</label>
                <textarea rows="3" placeholder="လိုအပ်သော အချက်အလက်များ ဒီမှာ ရေးပေးပါ..." className="w-full bg-[#112240] border border-blue-900/30 p-5 rounded-2xl text-white outline-none focus:border-blue-500 transition-colors text-sm md:text-base shadow-inner" value={editContact} onChange={e => setEditContact(e.target.value)} />
              </div>

              <div className="mb-6 md:mb-8">
                <label className="block text-slate-400 text-[11px] md:text-xs font-black uppercase mb-3 ml-2 tracking-widest">လိုအပ်သော ပုံများထည့်ရန်</label>
                <div className="grid grid-cols-3 gap-3 md:gap-5">
                  {[0, 1, 2].map((idx) => (
                    <div key={idx} className="relative aspect-square bg-[#112240] border-2 border-dashed border-blue-900/30 rounded-2xl flex items-center justify-center overflow-hidden hover:border-blue-500/50 transition-colors">
                      {techImages[idx] ? (
                        <img src={techImages[idx]} className="w-full h-full object-cover" alt="tech"/>
                      ) : (
                        <label className="cursor-pointer w-full h-full flex items-center justify-center">
                          <Plus className="text-blue-500" size={28}/>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], idx, 'tech')} />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6 md:mb-8">
                <label className="block text-slate-400 text-[11px] md:text-xs font-black uppercase mb-3 ml-2 tracking-widest">Payment Methode</label>
                <div className="grid grid-cols-4 gap-3 md:gap-5">
                  {[
                    { id: 'kpay', name: 'KBZ Pay', num: '09 402021942', user: 'Daw Hnin Pwint Phyu', img: 'https://i.ibb.co/Jj3SFW3C/kpay-logo.png' },
                    { id: 'visa', name: 'VISA', num: '4052 6403 0832 7313', user: 'U Htet Wai Soe', img: 'https://i.ibb.co/HLR2TxPr/Untitled-1.png' },
                    { id: 'wave', name: 'Wave Money', num: '09 793655312', user: 'U Sai Khun Thet Hein', img: 'https://i.ibb.co/23yq59BX/wave-pay.png' },
                    { id: 'ayapay', name: 'AYA Pay', num: '09 2021942', user: 'U Htet Wai Soe', img: 'https://i.ibb.co/GQyyTxh2/uabpay.png' }
                  ].map(m => (
                    <button key={m.id} onClick={() => setSelectedPayment(m)} className={`p-3 rounded-2xl border transition-all aspect-square flex items-center justify-center bg-white shadow-md ${selectedPayment?.id === m.id ? 'border-blue-500 border-4 scale-95' : 'border-transparent hover:scale-105'}`}>
                      <img src={m.img} className="w-full h-auto max-h-12 object-contain" alt={m.name}/>
                    </button>
                  ))}
                </div>
                {selectedPayment && (
                  <div className="mt-5 p-5 bg-blue-500/10 border border-blue-500/30 rounded-2xl animate-in fade-in zoom-in duration-300">
                    <p className="text-[11px] md:text-xs font-black text-blue-400 uppercase">{selectedPayment.name} Account:</p>
                    <h4 className="text-xl md:text-2xl font-black text-white my-1">{selectedPayment.num}</h4>
                    <p className="text-[11px] md:text-xs text-slate-400 font-bold">Name: {selectedPayment.user}</p>
                  </div>
                )}
              </div>

              <div className="mb-8 md:mb-10">
                <label className="block text-slate-400 text-[11px] md:text-xs font-black uppercase mb-3 ml-2 tracking-widest">Payment Screenshot</label>
                <div className="relative w-full aspect-video md:aspect-[21/9] bg-[#112240] border-2 border-dashed border-blue-900/30 rounded-2xl overflow-hidden flex items-center justify-center hover:border-blue-500/50 transition-colors">
                  {payImg ? (
                    <div className="relative w-full h-full">
                      <img src={payImg} className="w-full h-full object-contain bg-black/40" alt="pay"/>
                      <button onClick={() => setPayImg("")} className="absolute top-3 right-3 p-2 bg-red-500 rounded-full text-white shadow-xl hover:bg-red-600 transition-colors"><X size={20}/></button>
                    </div>
                  ) : (
                    <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center gap-3">
                      <ImageIcon className="text-blue-500" size={40}/>
                      <span className="text-[11px] md:text-xs font-black text-blue-400 uppercase tracking-widest">ငွေလွှဲ Screenshot တင်ရန်</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], 0, 'pay')} />
                    </label>
                  )}
                </div>
              </div>

              <button onClick={handleOrder} disabled={loading || !payImg} className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-3 active:scale-95 hover:bg-blue-500 transition-all disabled:opacity-50 text-lg">
                {loading ? <Loader2 className="animate-spin" size={24}/> : <><Send size={24}/> Confirm Order</>}
              </button>
            </div>
          </div>
        )}

        {view === 'order_success' && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in zoom-in duration-500">
            <CheckCircle2 size={100} className="text-green-500 mb-6 animate-bounce drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
            <h2 className="text-4xl md:text-5xl font-black mb-4">SUCCESS!</h2>
            <p className="text-slate-400 text-base mb-12">အော်ဒါတင်ခြင်း အောင်မြင်ပါသည်။</p>
            <button onClick={() => setView('customer_dash')} className="max-w-xs w-full bg-blue-600 py-5 rounded-2xl font-black text-white text-lg hover:bg-blue-500 transition-colors shadow-xl">History ကြည့်မယ်</button>
          </div>
        )}

        {view === 'customer_dash' && (
          <div className="flex flex-col flex-1 pb-40 text-left w-full">
            <MainHeader />
            <div className="p-6 md:p-10 lg:p-16 max-w-[1600px] mx-auto w-full">
              <h2 className="text-3xl md:text-4xl font-black mb-8 tracking-tight">History</h2>
              {/* 🚀 History များကို Desktop တွင် Grid ဖြင့် တန်းစီပြမည် */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {myOrders.length === 0 ? <p className="text-slate-500 col-span-full text-center py-20 text-lg">No orders found.</p> : myOrders.map(o => (
                  <div key={o.id} className="bg-[#112240] p-6 md:p-8 rounded-[2.5rem] border border-blue-900/30 shadow-lg hover:border-blue-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-black text-base md:text-lg uppercase text-white mb-1">{o.product}</h4>
                        <p className="text-blue-500 text-xs md:text-sm font-black">{o.plan} • {o.price} Ks</p>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider ${o.status === 'Completed' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>{o.status}</span>
                    </div>
                    {o.result && <div className="mt-5 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-[13px] leading-relaxed font-bold text-green-400">Result: {o.result}</div>}
                    <p className="text-[10px] md:text-xs text-slate-500 mt-5 font-semibold">{o.date}</p>
                  </div>
                ))}
              </div>
            </div>
            <BottomNav />
          </div>
        )}

        {view === 'admin_dash' && profile?.role === 'admin' && (
          <div className="flex flex-col flex-1 pb-40 text-left w-full">
            <MainHeader />
            <div className="p-6 md:p-10 lg:p-16 max-w-[1600px] mx-auto w-full">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                <h2 className="text-3xl md:text-4xl font-black uppercase">Admin Panel</h2>
                <div className="flex bg-[#112240] p-1.5 rounded-2xl border border-blue-900/30">
                  <button onClick={() => setAdminTab('orders')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-colors ${adminTab === 'orders' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>ORDERS</button>
                  <button onClick={() => setAdminTab('members')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-colors ${adminTab === 'members' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>USERS</button>
                </div>
              </div>
              
              {/* 🚀 Admin နေရာများတွင်ပါ Grid ဖြင့် နေရာချထားသည် */}
              <div className={adminTab === 'orders' ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"}>
                {adminTab === 'orders' ? allOrders.map(o => (
                  <div key={o.id} className="bg-[#112240] p-6 md:p-8 rounded-[2rem] border border-blue-900/30 shadow-xl flex flex-col">
                     <div className="flex justify-between items-start mb-5">
                      <div className="max-w-[70%]">
                        <h4 className="font-black text-base md:text-lg uppercase text-white mb-1">{o.product}</h4>
                        <p className="text-[11px] md:text-xs text-blue-500 font-black mb-1">{o.plan} - {o.price} Ks</p>
                        <p className="text-[10px] md:text-[11px] text-slate-400 font-bold italic">By: {o.userName}</p>
                      </div>
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] md:text-[11px] font-black uppercase tracking-wider ${o.status === 'Completed' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>{o.status}</span>
                    </div>
                    
                    <div className="bg-[#0a192f] p-5 rounded-2xl text-[12px] md:text-[13px] mb-5 text-slate-300 shadow-inner flex-1">
                      <p className="mb-2 font-black text-blue-400 tracking-wider">DETAILS:</p>
                      <p className="whitespace-pre-wrap leading-relaxed mb-4">{o.contact}</p>
                      
                      {o.techImages && o.techImages.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-blue-900/50">
                          <p className="mb-3 font-bold text-green-400 text-[11px]">Attached Images:</p>
                          <div className="flex gap-3 overflow-x-auto pb-2">
                            {o.techImages.map((img, i) => (
                              <a key={i} href={img} target="_blank" rel="noreferrer" className="w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden border-2 border-blue-900/50 flex-shrink-0 hover:border-blue-500 transition-colors">
                                <img src={img} className="w-full h-full object-cover" alt="tech"/>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {o.payImage && (
                        <div className="mt-4 pt-4 border-t border-blue-900/50">
                          <a href={o.payImage} target="_blank" rel="noreferrer" className="text-green-500 hover:text-green-400 font-black flex items-center gap-2 transition-colors">
                            <div className="p-2 bg-green-500/10 rounded-lg"><ImageIcon size={16}/></div> 
                            <span>View Receipt (ငွေလွှဲပြေစာ)</span>
                          </a>
                        </div>
                      )}
                    </div>
                    
                    {o.status === 'Pending' && (
                      <div className="flex gap-2 mt-auto">
                        <input type="text" placeholder="Result/Reply..." className="flex-1 bg-[#0a192f] p-3 md:p-4 rounded-xl text-xs md:text-sm outline-none border border-blue-900/30 focus:border-blue-500 transition-colors" value={deliveryInputs[o.id] || ''} onChange={(e) => setDeliveryInputs({...deliveryInputs, [o.id]: e.target.value})} />
                        <button onClick={() => updateStatus(o.id, 'Completed', deliveryInputs[o.id])} className="bg-blue-600 hover:bg-blue-500 px-5 md:px-6 rounded-xl font-black text-[11px] md:text-xs tracking-wider transition-colors shadow-lg">DONE</button>
                      </div>
                    )}
                  </div>
                )) : allMembers.map(m => (
                  <div key={m.uid} className="bg-[#112240] p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-blue-900/20 shadow-md">
                    <div className="flex items-center gap-4">
                      <img src={m.photoURL || LOGO_URL} className="w-12 h-12 rounded-xl object-cover" alt="M"/>
                      <div>
                        <p className="text-sm md:text-base font-black text-white">{m.name}</p>
                        <p className="text-[10px] md:text-[11px] text-blue-500 font-black uppercase tracking-widest mt-1">{m.tier} ACCOUNT</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {['Standard', 'VIP', 'Reseller'].map(t => (
                        <button key={t} onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', m.uid), {tier: t})} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-colors ${m.tier === t ? 'bg-blue-600 text-white shadow-md' : 'bg-[#0a192f] text-slate-400 hover:text-white border border-blue-900/30'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <BottomNav />
          </div>
        )}

        {view === 'profile' && (
          <div className="flex flex-col flex-1 pb-40 text-left w-full">
            <MainHeader />
            <div className="flex flex-col items-center justify-center flex-1 py-12 md:py-20">
              <div className="relative mb-6">
                <img src={profile?.photoURL || LOGO_URL} className="w-28 h-28 md:w-36 md:h-36 rounded-[2rem] border-4 border-blue-600/30 object-cover shadow-[0_0_30px_rgba(37,99,235,0.2)]" alt="U"/>
                <div className="absolute -bottom-3 -right-3 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase border-2 border-[#0a192f] shadow-lg">{profile?.role}</div>
              </div>
              <h3 className="text-3xl md:text-4xl font-black mb-2">{profile?.name}</h3>
              <p className="text-blue-500 font-black uppercase tracking-[0.2em] text-[11px] md:text-xs mb-12 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20">{profile?.tier} Account</p>
              
              <button onClick={() => auth.signOut()} className="flex items-center gap-3 text-red-500 bg-red-500/10 px-8 py-4 rounded-2xl font-black text-sm md:text-base border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-lg"><LogOut size={20}/> Sign Out Account</button>
            </div>
            <BottomNav />
          </div>
        )}

      </div>
    </div>
  );
}
