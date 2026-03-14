import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, setPersistence, browserLocalPersistence, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, updateDoc, query, orderBy } from 'firebase/firestore';
import { ShoppingBag, Gamepad2, Smartphone, ChevronRight, ArrowLeft, CheckCircle2, Loader2, User, ShieldCheck, LogOut, Send, Save, Layers, Image as ImageIcon, History } from 'lucide-react';

// --- CONFIGURATION ---
const LOGO_URL = "https://drive.google.com/thumbnail?id=1Lh-nHgyLMSr3rBVe4OGnjEvEspuMokd6&sz=w1000"; 
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyC1MECq8ZNzdj-RxmBaMcFfSqVk9Ijt9uuRW-szeukWuCoNBhywDz0k7W1r5mCvjhR/exec";
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
  const [techImg, setTechImg] = useState("");
  const [payImg, setPayImg] = useState("");

  const dynamicCategories = useMemo(() => {
    const uniqueCats = [...new Set(products.map(p => getPProp(p, 'Category')).filter(Boolean))];
    const iconMap = { 'Game': <Gamepad2 size={16}/>, 'Digital product': <Smartphone size={16}/> };
    return uniqueCats.map(cat => ({ id: cat, name: cat, icon: iconMap[cat] || <Layers size={16}/> }));
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
      if (ADMIN_EMAILS.includes(u.email)) pData.role = 'admin';
      await setDoc(docRef, pData, { merge: true });
      await setDoc(memberRef, pData, { merge: true });
      setProfile(pData);
    } catch (e) { console.error("Sync Error:", e); }
  }, []);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence);
    const unsubscribe = onAuthStateChanged(auth, async (currUser) => {
      if (currUser) { 
        setUser(currUser); 
        await syncProfile(currUser); 
        setView('home'); 
      } else { 
        setUser(null); 
        setProfile(null); 
        setView('welcome'); 
      }
    });
    return () => unsubscribe();
  }, [syncProfile]);

  useEffect(() => {
    fetch(SCRIPT_URL)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setProducts(data); })
      .catch(err => console.error("Fetch Products Error:", err));
  }, []);

  useEffect(() => {
    if (!user) return;
    const qOrders = query(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderBy('timestamp', 'desc'));
    const unsubOrders = onSnapshot(qOrders, (sn) => {
      const docs = sn.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllOrders(docs); 
      setMyOrders(docs.filter(o => o.userId === user.uid));
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

  const handleImageUpload = async (file, type) => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        if (type === 'tech') setTechImg(data.data.url);
        else setPayImg(data.data.url);
      }
    } catch (e) { alert("ပုံတင်လို့ မရပါဘူး၊ VPN ဖွင့်ထားဖို့ လိုအပ်နိုင်ပါတယ်"); } 
    finally { setLoading(false); }
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
      userId: user.uid, 
      userName: profile?.name, 
      product: getPProp(selectedPlan, 'Name'),
      plan: getPProp(selectedPlan, 'Plan'), 
      price: getDisplayPrice(selectedPlan),
      contact: editContact, 
      paymentMethod: selectedPayment?.name || 'KPay',
      techImage: techImg, 
      payImage: payImg, 
      status: 'Pending', 
      timestamp: Date.now(),
      date: new Date().toLocaleString('en-GB')
    };

    try {
      // ၁။ Firebase သိမ်းဆည်းခြင်း
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderData);
      
      // ၂။ Telegram Notification ပို့ဆောင်ခြင်း
      const teleMsg = `
🔔 *Order အသစ်ရောက်ရှိ!*
-------------------------
👤 *အမည်:* ${orderData.userName}
📦 *ပစ္စည်း:* ${orderData.product} (${orderData.plan})
💰 *ဈေးနှုန်း:* ${orderData.price} Ks
📞 *အချက်အလက်:* ${orderData.contact}
-------------------------
📱 [ငွေလွှဲပြေစာ ကြည့်ရန်](${orderData.payImage})
      `;

      fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: teleMsg,
          parse_mode: 'Markdown'
        })
      });

      // ၃။ Google Sheet သိမ်းဆည်းခြင်း
      fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(orderData) });

      setTechImg(""); setPayImg(""); setEditContact(""); setSelectedPayment(null);
      setView('order_success');
    } catch (e) { 
      alert("Error ordering: " + e.message); 
    } finally { 
      setLoading(false); 
    }
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

  // --- UI COMPONENTS --- (Header, BottomNav, etc.)
  const MainHeader = () => (
    <div className="flex items-center justify-between p-4 bg-[#0a192f] border-b border-blue-900/20 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-lg border border-blue-500/30 overflow-hidden bg-[#112240] flex items-center justify-center">
          <img src={formatImg(LOGO_URL)} className="w-full h-full object-contain" alt="Logo" />
        </div>
        <h2 className="text-md font-black text-white uppercase tracking-tighter">MM Tech</h2>
      </div>
      <button onClick={() => setView('customer_dash')} className="text-white relative">
        <ShoppingBag size={20}/>
        {myOrders.some(o => o.status === 'Completed') && <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>}
      </button>
    </div>
  );

  const BottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a192f]/95 border-t border-blue-900/20 p-5 flex justify-around items-center z-50 w-full max-w-md mx-auto rounded-t-[2.5rem] shadow-2xl backdrop-blur-md">
      <button onClick={() => setView('home')} className={view === 'home' ? 'text-blue-500 scale-110' : 'text-slate-500'}><ShoppingBag size={24}/></button>
      <button onClick={() => setView('customer_dash')} className={view === 'customer_dash' ? 'text-blue-500 scale-110' : 'text-slate-500'}><History size={24}/></button>
      {profile?.role === 'admin' && <button onClick={() => setView('admin_dash')} className={view === 'admin_dash' ? 'text-blue-500 scale-110' : 'text-slate-500'}><ShieldCheck size={24}/></button>}
      <button onClick={() => setView('profile')} className={view === 'profile' ? 'text-blue-500 scale-110' : 'text-slate-500'}><User size={24}/></button>
    </nav>
  );

  if (view === 'initializing') return <div className="min-h-screen bg-[#0a192f] flex flex-col items-center justify-center text-white"><Loader2 className="animate-spin text-blue-500" size={40}/></div>;

  return (
    <div className="bg-[#050d1a] min-h-screen text-white font-sans selection:bg-blue-500/30">
      <div className="max-w-md mx-auto w-full min-h-screen flex flex-col relative bg-[#0a192f] border-x border-blue-900/10 shadow-2xl">
        
        {view === 'welcome' && (
          <div className="flex flex-col flex-1 items-center justify-center p-10 text-center">
            <div className="w-32 h-32 bg-[#112240] rounded-[2.5rem] border border-blue-500/20 mb-8 flex items-center justify-center overflow-hidden p-2">
              <img src={formatImg(LOGO_URL)} className="w-full h-full object-contain" alt="L" />
            </div>
            <h1 className="text-4xl font-black mb-10 tracking-tighter uppercase">MM Tech</h1>
            <button onClick={handleLogin} className="w-full max-w-xs bg-white text-black py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all">Login with Google</button>
          </div>
        )}

        {view === 'home' && (
          <>
            <MainHeader />
            <div className="p-6 pb-40 text-left">
              <h1 className="text-3xl font-black mb-6">Store</h1>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6">
                <button onClick={() => setSelectedCat(null)} className={`px-5 py-2 rounded-full text-[11px] font-black border ${!selectedCat ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-[#112240] border-blue-900/30'}`}>All</button>
                {dynamicCategories.map(c => (
                  <button key={c.id} onClick={() => setSelectedCat(c.id)} className={`px-5 py-2 rounded-full text-[11px] font-black border whitespace-nowrap ${selectedCat === c.id ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/20' : 'bg-[#112240] border-blue-900/30'}`}>{c.name}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {groupedProducts.filter(g => !selectedCat || g.category === selectedCat).map(group => (
                  <div key={group.name} onClick={() => { setSelectedGroup(group); setView('group_details'); }} className="bg-[#112240]/40 p-3 rounded-2xl border border-blue-900/10 active:scale-95 transition-all cursor-pointer">
                    <div className="aspect-square bg-[#0a192f] rounded-xl overflow-hidden mb-3"><img src={formatImg(group.image)} className="w-full h-full object-cover" alt="I" /></div>
                    <h4 className="text-[11px] font-black truncate text-white uppercase">{group.name}</h4>
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
            <div className="p-6">
              <button onClick={() => setView('home')} className="p-2 bg-[#112240] rounded-xl text-white mb-4 border border-blue-900/20"><ArrowLeft size={20}/></button>
              <h2 className="text-2xl font-black mb-6 tracking-tight uppercase">{selectedGroup?.name}</h2>
              <div className="space-y-3">
                {selectedGroup?.plans.map((p, i) => (
                  <button key={i} onClick={() => { setSelectedPlan(p); setView('checkout'); }} className="w-full bg-[#112240] p-5 rounded-3xl border border-blue-900/20 flex items-center justify-between active:scale-[0.98] transition-all">
                    <div className="text-left"><h4 className="text-sm font-black text-white">{getPProp(p, 'Plan')}</h4><p className="text-blue-500 font-black">{getDisplayPrice(p)} Ks</p></div>
                    <ChevronRight size={20} className="text-blue-500" />
                  </button>
                ))}
              </div>
            </div>
            <BottomNav />
          </div>
        )}

        {view === 'checkout' && (
          <div className="p-4 flex flex-col flex-1 pb-40 text-left w-full overflow-y-auto no-scrollbar">
            <MainHeader />
            <button onClick={() => setView('group_details')} className="w-10 h-10 bg-[#112240] rounded-xl flex items-center justify-center my-6 text-white border border-blue-900/20"><ArrowLeft size={20}/></button>
            <div className="bg-[#112240] p-8 rounded-[2rem] border border-blue-900/30 text-center mb-6 shadow-2xl relative overflow-hidden">
              <img src={formatImg(getPProp(selectedPlan, 'Link'))} className="w-24 h-24 mx-auto mb-6 rounded-3xl object-cover border-4 border-blue-600/20 shadow-xl" alt="Product"/>
              <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{getPProp(selectedPlan, 'Name')}</h3>
              <p className="text-blue-400 font-bold mb-4 uppercase text-[10px] tracking-widest">{getPProp(selectedPlan, 'Plan')}</p>
              <div className="text-3xl font-black bg-[#0a192f]/50 py-4 rounded-2xl text-white inline-block px-10 shadow-inner">{getDisplayPrice(selectedPlan)} Ks</div>
            </div>
            <div className="mb-6">
              <label className="block text-slate-500 text-[10px] font-black uppercase mb-3 ml-2 tracking-widest">Customer Details (ID, Pass, Phone)</label>
              <textarea rows="4" placeholder="လိုအပ်သော အချက်အလက်များ ဒီမှာ ရေးပေးပါ..." className="w-full bg-[#112240] border border-blue-900/30 p-5 rounded-2xl text-white outline-none focus:border-blue-500 text-sm" value={editContact} onChange={e => setEditContact(e.target.value)} />
            </div>
            <div className="mb-8">
              <label className="block text-slate-500 text-[10px] font-black uppercase mb-3 ml-2 tracking-widest">Payment Screenshot</label>
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0], 'pay')} className="w-full text-[10px] bg-[#112240] rounded-2xl p-2" />
              {payImg && <p className="text-[10px] text-green-500 mt-2 font-black">✓ Screenshot Uploaded</p>}
            </div>
            <button onClick={handleOrder} disabled={loading || !payImg} className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 transition-all">
              {loading ? <Loader2 className="animate-spin" /> : <><Send size={20}/> Confirm Order</>}
            </button>
          </div>
        )}

        {view === 'order_success' && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <CheckCircle2 size={80} className="text-green-500 mb-6 animate-bounce" />
            <h2 className="text-3xl font-black mb-4">SUCCESS!</h2>
            <p className="text-slate-400 text-sm mb-12">အော်ဒါတင်ခြင်း အောင်မြင်ပါသည်။</p>
            <button onClick={() => setView('customer_dash')} className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white">History ကြည့်မယ်</button>
          </div>
        )}

        {view === 'customer_dash' && (
          <div className="p-8 flex flex-col flex-1 pb-40 text-left">
            <MainHeader />
            <h2 className="text-3xl font-black mb-8 mt-4">History</h2>
            <div className="space-y-4 overflow-y-auto no-scrollbar">
              {myOrders.length === 0 ? <p className="text-slate-500 text-center py-20">No orders found.</p> : myOrders.map(o => (
                <div key={o.id} className="bg-[#112240] p-6 rounded-[2.5rem] border border-blue-900/30">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-black text-sm uppercase">{o.product}</h4>
                      <p className="text-blue-500 text-[10px] font-black">{o.plan} • {o.price} Ks</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${o.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{o.status}</span>
                  </div>
                  {o.result && <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-[12px] font-black text-green-400">Result: {o.result}</div>}
                  <p className="text-[9px] text-slate-500 mt-4">{o.date}</p>
                </div>
              ))}
            </div>
            <BottomNav />
          </div>
        )}

        {view === 'profile' && (
          <div className="p-8 flex flex-col flex-1 pb-40 text-left">
            <MainHeader />
            <div className="flex flex-col items-center py-10">
              <img src={profile?.photoURL || LOGO_URL} className="w-24 h-24 rounded-[2rem] border-4 border-blue-600/20 mb-4" alt="U"/>
              <h3 className="text-2xl font-black">{profile?.name}</h3>
              <p className="text-blue-500 font-black uppercase tracking-widest text-xs mb-8">{profile?.tier} Account</p>
              <button onClick={() => auth.signOut()} className="flex items-center gap-2 text-red-500 font-black text-sm"><LogOut size={18}/> Sign Out</button>
            </div>
            <BottomNav />
          </div>
        )}

        {view === 'admin_dash' && profile?.role === 'admin' && (
          <div className="p-8 flex flex-col flex-1 pb-40 text-left">
            <MainHeader />
            <div className="flex justify-between items-center mb-10 mt-4">
              <h2 className="text-2xl font-black uppercase">Admin Panel</h2>
              <div className="flex bg-[#112240] p-1 rounded-2xl">
                <button onClick={() => setAdminTab('orders')} className={`px-4 py-2 rounded-xl text-[10px] font-black ${adminTab === 'orders' ? 'bg-blue-600' : 'text-slate-500'}`}>ORDERS</button>
                <button onClick={() => setAdminTab('members')} className={`px-4 py-2 rounded-xl text-[10px] font-black ${adminTab === 'members' ? 'bg-blue-600' : 'text-slate-500'}`}>USERS</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
              {adminTab === 'orders' ? allOrders.map(o => (
                <div key={o.id} className="bg-[#112240] p-6 rounded-[2rem] border border-blue-900/30">
                   <div className="flex justify-between items-start mb-4">
                    <div className="max-w-[70%]">
                      <h4 className="font-black text-sm truncate uppercase">{o.product}</h4>
                      <p className="text-[10px] text-blue-500 font-black">{o.plan} - {o.price} Ks</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-bold">User: {o.userName}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${o.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{o.status}</span>
                  </div>
                  <div className="bg-[#0a192f] p-4 rounded-xl text-[11px] mb-4 text-slate-300">
                    <p className="mb-2"><span className="text-blue-400">Details:</span> {o.contact}</p>
                    {o.payImage && <a href={o.payImage} target="_blank" rel="noreferrer" className="text-green-500 font-black underline flex items-center gap-1"><ImageIcon size={12}/> View Receipt</a>}
                  </div>
                  {o.status === 'Pending' && (
                    <div className="flex gap-2">
                      <input type="text" placeholder="Result code..." className="flex-1 bg-[#0a192f] p-3 rounded-xl text-[11px] outline-none border border-blue-900/30" value={deliveryInputs[o.id] || ''} onChange={(e) => setDeliveryInputs({...deliveryInputs, [o.id]: e.target.value})} />
                      <button onClick={() => updateStatus(o.id, 'Completed', deliveryInputs[o.id])} className="bg-blue-600 px-4 rounded-xl font-black text-[10px]">DONE</button>
                    </div>
                  )}
                </div>
              )) : allMembers.map(m => (
                <div key={m.uid} className="bg-[#112240] p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={m.photoURL || LOGO_URL} className="w-10 h-10 rounded-xl" alt="M"/>
                    <div><p className="text-xs font-black">{m.name}</p><p className="text-[9px] text-blue-500 uppercase">{m.tier}</p></div>
                  </div>
                  <div className="flex gap-1">
                    {['Standard', 'VIP', 'Reseller'].map(t => (
                      <button key={t} onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', m.uid), {tier: t})} className={`px-2 py-1 rounded text-[8px] font-black ${m.tier === t ? 'bg-blue-600' : 'bg-slate-800 text-slate-500'}`}>{t[0]}</button>
                    ))}
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
