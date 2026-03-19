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

  // --- 1. n8n ROSE AI AGENT INTEGRATION ---
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://mmtechmdy.app.n8n.cloud/assets/chat.js'; 
    script.onload = () => {
      if (window.createChat) {
        window.createChat({
          webhookUrl: 'https://mmtechmdy.app.n8n.cloud/webhook/2f2ed367-cb30-411b-9cd6-1deac27cefdb/webhook',
          title: 'MM Tech Support (Rose)',
          welcomeMessage: 'မင်္ဂလာပါရှင်၊ MM Tech မှ Rose ပါ။ ဘာကူညီပေးရမလဲရှင့်?',
          avatarUrl: LOGO_URL,
          backgroundColor: '#0a192f',
          onboarding: true,
        });
      }
    };
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  // --- 2. AUTH & PROFILE LOGIC ---
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

  // --- 3. DATA FETCHING ---
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

  // --- 4. ADMIN USER TIER MANAGEMENT ---
  const updateMemberTier = async (userId, newTier) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'profile', 'data'), { tier: newTier });
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', userId), { tier: newTier });
      alert(`User is now a ${newTier}!`);
    } catch (e) { alert("Error updating tier."); }
  };

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

  const updateOrderStatus = async (orderId, newStatus, resultData = "") => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId), { status: newStatus, result: resultData });
    } catch (e) { console.error(e); }
  };

  const dynamicCategories = useMemo(() => {
    const uniqueCats = [...new Set(products.map(p => getPProp(p, 'Category')).filter(Boolean))];
    return uniqueCats.map(cat => ({ id: cat, name: cat, icon: <Layers size={16}/> }));
  }, [products]);

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

  // --- UI COMPONENTS ---
  const MainHeader = () => (
    <div className="flex items-center justify-between p-4 bg-[#0a192f] border-b border-blue-900/20 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-lg border border-blue-500/30 overflow-hidden bg-[#112240] flex items-center justify-center">
          <img src={formatImg(LOGO_URL)} className="w-full h-full object-contain" alt="Logo" />
        </div>
        <h2 className="text-md font-black text-white uppercase tracking-tighter">MM Tech</h2>
      </div>
      <button onClick={() => setView('customer_dash')} className="text-white"><ShoppingBag size={20}/></button>
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
    <div className="bg-[#050d1a] min-h-screen text-white font-sans flex justify-center selection:bg-blue-500/30">
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col relative bg-[#0a192f] border-x border-blue-900/20 shadow-2xl">
        
        {view === 'welcome' && (
          <div className="flex flex-col flex-1 items-center justify-center p-10 text-center">
            <img src={formatImg(LOGO_URL)} className="w-24 h-24 mb-6 rounded-3xl" alt="L" />
            <h1 className="text-4xl font-black mb-10 tracking-tighter uppercase">MM Tech</h1>
            <button onClick={handleLogin} className="w-full max-w-xs bg-white text-black py-4 rounded-2xl font-black">Login with Google</button>
          </div>
        )}

        {view === 'home' && (
          <>
            <MainHeader />
            <div className="p-6 pb-40 text-left">
              <h1 className="text-3xl font-black mb-6">Store</h1>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6">
                <button onClick={() => setSelectedCat(null)} className={`px-5 py-2 rounded-full text-[11px] font-black border ${!selectedCat ? 'bg-blue-600 border-blue-500' : 'bg-[#112240] border-blue-900/30'}`}>All</button>
                {dynamicCategories.map(c => (
                  <button key={c.id} onClick={() => setSelectedCat(c.id)} className={`px-5 py-2 rounded-full text-[11px] font-black border whitespace-nowrap ${selectedCat === c.id ? 'bg-blue-600 border-blue-400' : 'bg-[#112240] border-blue-900/30'}`}>{c.name}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {groupedProducts.filter(g => !selectedCat || g.category === selectedCat).map(group => (
                  <div key={group.name} onClick={() => { setSelectedGroup(group); setView('group_details'); }} className="bg-[#112240]/40 p-3 rounded-2xl border border-blue-900/10 cursor-pointer">
                    <img src={formatImg(group.image)} className="aspect-square w-full rounded-xl object-cover mb-2" alt="I" />
                    <h4 className="text-[11px] font-black truncate uppercase">{group.name}</h4>
                  </div>
                ))}
              </div>
            </div>
            <BottomNav />
          </>
        )}

        {view === 'group_details' && (
          <div className="p-6 pb-32">
            <MainHeader />
            <button onClick={() => setView('home')} className="p-2 bg-[#112240] rounded-xl mb-4"><ArrowLeft size={20}/></button>
            <h2 className="text-xl font-black mb-6 uppercase tracking-tight">{selectedGroup?.name}</h2>
            <div className="space-y-3">
              {selectedGroup?.plans.map((p, i) => (
                <button key={i} onClick={() => { setSelectedPlan(p); setView('checkout'); }} className="w-full bg-[#112240] p-4 rounded-2xl flex justify-between items-center border border-blue-900/10">
                  <div className="text-left"><h4 className="text-sm font-black">{getPProp(p, 'Plan')}</h4><p className="text-blue-500 text-xs font-black">{getDisplayPrice(p)} Ks</p></div>
                  <ChevronRight size={18} className="text-blue-500" />
                </button>
              ))}
            </div>
            <BottomNav />
          </div>
        )}

        {view === 'checkout' && (
          <div className="p-4 flex flex-col flex-1 pb-40 overflow-y-auto no-scrollbar">
            <MainHeader />
            <button onClick={() => setView('group_details')} className="p-2 bg-[#112240] rounded-xl my-4 w-fit"><ArrowLeft size={20}/></button>
            
            <div className="bg-[#112240] p-6 rounded-[2rem] border border-blue-900/30 text-center mb-6">
              <h3 className="text-lg font-black mb-2 uppercase">{getPProp(selectedPlan, 'Name')}</h3>
              <p className="text-blue-500 text-2xl font-black">{getDisplayPrice(selectedPlan)} Ks</p>
              {getPProp(selectedPlan, 'Des') && <div className="mt-4 p-4 bg-black/20 rounded-2xl text-[11px] text-slate-300 text-left whitespace-pre-wrap">{getPProp(selectedPlan, 'Des')}</div>}
            </div>

            <textarea rows="3" placeholder="ID, Password, Phone Number အကုန်ဒီမှာရေးပါ..." className="w-full bg-[#112240] p-4 rounded-2xl mb-6 text-sm outline-none border border-blue-900/20" value={editContact} onChange={e => setEditContact(e.target.value)} />

            <div className="mb-6">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-3 ml-2">လိုအပ်သော ပုံများတင်ရန်</p>
              <div className="grid grid-cols-3 gap-2">
                {techImages.map((img, idx) => (
                  <div key={idx} className="aspect-square bg-[#112240] rounded-xl border-2 border-dashed border-blue-900/30 overflow-hidden flex items-center justify-center relative">
                    {img ? <img src={img} className="w-full h-full object-cover" alt="T"/> : (
                      <label className="cursor-pointer w-full h-full flex items-center justify-center"><Plus className="text-blue-900"/><input type="file" className="hidden" onChange={e => handleImageUpload(e.target.files[0], idx, 'tech')}/></label>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-3 ml-2">Payment Receipt (Required)</p>
              <div className="w-full aspect-video bg-[#112240] rounded-2xl border-2 border-dashed border-blue-900/30 flex items-center justify-center relative overflow-hidden">
                {payImg ? (
                  <div className="w-full h-full relative"><img src={payImg} className="w-full h-full object-contain" alt="P"/><button onClick={() => setPayImg("")} className="absolute top-2 right-2 bg-red-500 p-1 rounded-full"><X size={14}/></button></div>
                ) : (
                  <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-blue-500"><ImageIcon size={24}/><p className="text-[9px] font-black uppercase mt-1">Screenshot တင်ရန်</p><input type="file" className="hidden" onChange={e => handleImageUpload(e.target.files[0], 0, 'pay')}/></label>
                )}
              </div>
            </div>

            <button onClick={handleOrder} disabled={loading || !payImg} className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3">
              {loading ? <Loader2 className="animate-spin" /> : <><Send size={20}/> Confirm Order</>}
            </button>
          </div>
        )}

        {/* --- ADMIN DASHBOARD (User Management Rows Included) --- */}
        {view === 'admin_dash' && (
          <div className="p-8 flex flex-col flex-1 pb-40">
            <MainHeader />
            <div className="flex justify-between items-center mb-8 mt-4">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Admin</h2>
              <div className="flex bg-[#112240] p-1 rounded-2xl">
                <button onClick={() => setAdminTab('orders')} className={`px-4 py-2 rounded-xl text-[10px] font-black ${adminTab === 'orders' ? 'bg-blue-600' : 'text-slate-500'}`}>ORDERS</button>
                <button onClick={() => setAdminTab('members')} className={`px-4 py-2 rounded-xl text-[10px] font-black ${adminTab === 'members' ? 'bg-blue-600' : 'text-slate-500'}`}>USERS</button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
              {adminTab === 'orders' ? allOrders.map(o => (
                <div key={o.id} className="bg-[#112240] p-6 rounded-[2rem] border border-blue-900/30">
                  <div className="flex justify-between items-start mb-4">
                    <div><h4 className="font-black text-sm uppercase">{o.product}</h4><p className="text-[10px] text-blue-500 font-black">{o.plan} - {o.price} Ks</p></div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${o.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{o.status}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-3 italic">User: {o.userName}</p>
                  <p className="bg-black/20 p-3 rounded-xl text-xs text-slate-300 mb-4 whitespace-pre-wrap border border-blue-900/10">{o.contact}</p>
                  <div className="flex gap-2 mb-4">
                    {o.payImage && <a href={o.payImage} target="_blank" rel="noreferrer" className="flex-1 bg-green-600/10 p-2 rounded-lg text-center text-[9px] font-black text-green-500 border border-green-500/20">RECEIPT</a>}
                    {o.techImages?.map((img, i) => <a key={i} href={img} target="_blank" rel="noreferrer" className="w-10 h-10 bg-blue-600/10 rounded-lg border border-blue-500/20 overflow-hidden"><img src={img} className="w-full h-full object-cover" alt="T"/></a>)}
                  </div>
                  {o.status === 'Pending' && (
                    <div className="flex gap-2">
                      <input type="text" placeholder="Deliver Code..." className="flex-1 bg-[#0a192f] p-3 rounded-xl text-[10px] outline-none border border-blue-900/30" value={deliveryInputs[o.id] || ''} onChange={e => setDeliveryInputs({...deliveryInputs, [o.id]: e.target.value})} />
                      <button onClick={() => updateOrderStatus(o.id, 'Completed', deliveryInputs[o.id])} className="bg-blue-600 px-4 rounded-xl font-black text-[10px]">DONE</button>
                    </div>
                  )}
                </div>
              )) : (
                /* --- USER TIER ROWS (This is the section you missed) --- */
                <div className="space-y-4">
                  {allMembers.map(m => (
                    <div key={m.uid} className="bg-[#112240] p-4 rounded-3xl flex items-center justify-between border border-blue-900/10">
                      <div className="flex items-center gap-3">
                        <img src={m.photoURL || LOGO_URL} className="w-10 h-10 rounded-xl object-cover" alt="M"/>
                        <div><p className="text-[11px] font-black text-white">{m.name}</p><p className="text-[9px] text-blue-500 uppercase font-bold">{m.tier}</p></div>
                      </div>
                      <div className="flex gap-1 bg-[#0a192f] p-1 rounded-xl">
                        {['Standard', 'VIP', 'Reseller'].map(t => (
                          <button key={t} onClick={() => updateMemberTier(m.uid, t)} className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${m.tier === t ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>{t[0]}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <BottomNav />
          </div>
        )}

        {view === 'order_success' && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in zoom-in duration-500">
            <CheckCircle2 size={80} className="text-green-500 mb-6 animate-bounce" />
            <h2 className="text-3xl font-black mb-4 tracking-tighter">SUCCESS!</h2>
            <button onClick={() => setView('customer_dash')} className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white shadow-xl active:scale-95 transition-all">Order မှတ်တမ်းကြည့်ရန်</button>
          </div>
        )}

        {view === 'customer_dash' && (
          <div className="p-8 flex flex-col flex-1 pb-40">
            <MainHeader />
            <h2 className="text-3xl font-black mb-8 mt-4 tracking-tight">History</h2>
            <div className="space-y-4 overflow-y-auto no-scrollbar flex-1">
              {myOrders.length === 0 ? <p className="text-slate-500 text-center py-20 text-xs italic">No orders found.</p> : myOrders.map(o => (
                <div key={o.id} className="bg-[#112240] p-6 rounded-[2.5rem] border border-blue-900/30">
                  <div className="flex justify-between items-start mb-2">
                    <div><h4 className="font-black text-[12px] uppercase text-white">{o.product}</h4><p className="text-blue-500 text-[10px] font-black">{o.plan} • {o.price} Ks</p></div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${o.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{o.status}</span>
                  </div>
                  {o.result && (
                    <div className="mt-4 p-4 bg-green-500/5 border border-green-500/10 rounded-2xl flex items-center justify-between gap-3">
                      <code className="text-xs font-bold text-green-400 break-all">{o.result}</code>
                      <button onClick={() => {navigator.clipboard.writeText(o.result); alert("Copied!");}} className="bg-green-600 p-2 rounded-lg text-white shadow-lg"><Save size={14}/></button>
                    </div>
                  )}
                  <p className="text-[9px] text-slate-600 italic mt-4">{o.date}</p>
                </div>
              ))}
            </div>
            <BottomNav />
          </div>
        )}

        {view === 'profile' && (
          <div className="p-8 flex flex-col flex-1 items-center justify-center pb-40">
            <MainHeader />
            <div className="w-full flex flex-col items-center">
              <img src={profile?.photoURL || LOGO_URL} className="w-24 h-24 rounded-[2.5rem] border-4 border-blue-600/20 mb-4 shadow-2xl" alt="U"/>
              <h3 className="text-2xl font-black tracking-tighter">{profile?.name}</h3>
              <p className="text-blue-500 font-black uppercase tracking-widest text-[10px] mb-12">{profile?.tier} Account</p>
              
              <div className="w-full bg-[#112240] rounded-[2rem] p-8 border border-blue-900/20 mb-12">
                <div className="flex justify-between py-4 border-b border-blue-900/10"><span className="text-[10px] font-black text-slate-500 uppercase">Tier</span><span className="text-blue-500 font-black text-xs">{profile?.tier}</span></div>
                <div className="flex justify-between py-4"><span className="text-[10px] font-black text-slate-500 uppercase">Role</span><span className="text-white font-black text-xs uppercase">{profile?.role}</span></div>
              </div>
              
              <button onClick={() => auth.signOut()} className="flex items-center gap-2 text-red-500 font-black text-sm active:scale-95 transition-all"><LogOut size={18}/> Sign Out</button>
            </div>
            <BottomNav />
          </div>
        )}

      </div>
    </div>
  );
}
