import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, updateDoc, query, orderBy } from 'firebase/firestore';
import { ShoppingBag, ArrowLeft, CheckCircle2, Loader2, User, ShieldCheck, LogOut, Send, Save, Layers, Image as ImageIcon, History, Plus, X, Search, ShoppingCart, LogIn, Facebook, Share2, MessageCircle } from 'lucide-react';

// --- (၁) CONFIGURATION ---
const LOGO_URL = "https://drive.google.com/thumbnail?id=1Lh-nHgyLMSr3rBVe4OGnjEvEspuMokd6&sz=w1000"; 
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyAFUjLmxxR3rS-KJIcBsi9x-Ah-ZA2JPNRzktW5N2s4UTdRtDiZT6hGvnuDjOjkxRF/exec";
const IMGBB_API_KEY = "88d3b49cfcf4fa4b1e77ce493aa3172a";
const ADMIN_EMAILS = ["kohtet107576@gmail.com"]; 

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

// --- (၂) UTILS ---
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
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [isSocialOpen, setIsSocialOpen] = useState(false);

  // --- (၃) CORE LOGIC ---
  const syncProfile = useCallback(async (u) => {
    const docRef = doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data');
    const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'members', u.uid);
    try {
      const docSnap = await getDoc(docRef);
      let pData = docSnap.exists() ? docSnap.data() : {
        name: u.displayName, email: u.email, tier: ADMIN_EMAILS.includes(u.email) ? 'Admin' : 'Standard',
        role: ADMIN_EMAILS.includes(u.email) ? 'admin' : 'user', uid: u.uid, photoURL: u.photoURL
      };
      await setDoc(docRef, pData, { merge: true });
      await setDoc(memberRef, pData, { merge: true });
      setProfile(pData);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      if (u) { setUser(u); await syncProfile(u); } else { setUser(null); setProfile(null); }
      setView('home'); 
    });
    fetch(SCRIPT_URL).then(res => res.json()).then(data => { if (Array.isArray(data)) setProducts(data); });
  }, [syncProfile]);

  useEffect(() => {
    if (!user) return;
    const qOrders = query(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderBy('timestamp', 'desc'));
    onSnapshot(qOrders, (sn) => {
      const docs = sn.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllOrders(docs); setMyOrders(docs.filter(o => o.userId === user.uid));
    });
    if (profile?.role === 'admin') {
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'members'), (sn) => setAllMembers(sn.docs.map(d => ({ id: d.id, ...d.data() }))));
    }
  }, [user, profile]);

  const handleOrder = async () => {
    if (!user) return setView('welcome');
    if (cart.length === 0 || !editContact.trim() || !payImg || !selectedPayment) return alert("Fill all info");
    setLoading(true);
    const orderData = {
      userId: user.uid, userGmail: user.email, userName: profile?.name,
      product: cart.map(i => getPProp(i, 'Name')).join(", "),
      plan: cart.map(i => getPProp(i, 'Plan')).join(", "),
      price: cart.reduce((s, i) => s + parseInt(getDisplayPrice(i)), 0),
      contact: editContact, paymentMethod: selectedPayment.name,
      payImage: payImg, items: cart.map(i => ({ Name: getPProp(i, 'Name'), Plan: getPProp(i, 'Plan') })),
      date: new Date().toLocaleString('en-GB')
    };
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), { ...orderData, status: 'Pending', timestamp: Date.now() });
      await fetch(SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(orderData) });
      setCart([]); setPayImg(""); setView('order_success');
    } catch (e) { alert("Error!"); } finally { setLoading(false); }
  };

  const getDisplayPrice = (plan) => {
    const tier = profile?.tier || 'Standard';
    return getPProp(plan, `Price_${tier}`) || getPProp(plan, 'Price') || 0;
  };

  const groupedProducts = useMemo(() => {
    const groups = {};
    products.forEach(p => {
      const name = getPProp(p, 'Name');
      if (name && name.toLowerCase().includes(searchTerm.toLowerCase())) {
        if (!selectedCat || getPProp(p, 'Category') === selectedCat) {
          if (!groups[name]) groups[name] = { name, category: getPProp(p, 'Category'), image: getPProp(p, 'Link'), plans: [] };
          groups[name].plans.push(p);
        }
      }
    });
    return Object.values(groups);
  }, [products, searchTerm, selectedCat]);

  // --- (၄) UI COMPONENTS ---
  const MainHeader = () => (
    <div className="flex items-center justify-between p-4 bg-[#0a192f]/90 backdrop-blur-md sticky top-0 z-40 border-b border-blue-900/20">
      <div className="flex items-center gap-2"><img src={LOGO_URL} className="w-8 h-8 rounded-lg" /><h2 className="text-sm font-black text-white uppercase tracking-tighter">MM Tech</h2></div>
      <div className="flex items-center gap-3">
        <div className="relative cursor-pointer mr-1" onClick={() => setView('cart_view')}><ShoppingCart size={22} className="text-blue-500" />{cart.length > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{cart.length}</span>}</div>
        {user ? <img src={profile?.photoURL || LOGO_URL} className="w-8 h-8 rounded-full border border-blue-500/50 cursor-pointer" onClick={() => setView('profile')} /> : 
        <button onClick={() => setView('welcome')} className="bg-blue-600/20 text-blue-500 px-3 py-1.5 rounded-full text-[9px] font-black flex items-center gap-1.5 border border-blue-500/30"><LogIn size={12}/> LOGIN</button>}
      </div>
    </div>
  );

  const SocialPopup = () => (
    <div className="fixed right-4 bottom-28 z-[100] flex flex-col items-end gap-3">
      {isSocialOpen && (
        <div className="flex flex-col gap-3 mb-2 animate-in slide-in-from-bottom-5 duration-300">
          <a href="https://facebook.com/mmtech" target="_blank" rel="noreferrer" className="bg-blue-600 p-3 rounded-full shadow-lg text-white"><Facebook size={20}/></a>
          <a href="https://t.me/mmtech" target="_blank" rel="noreferrer" className="bg-blue-400 p-3 rounded-full shadow-lg text-white"><Send size={20}/></a>
          <a href="viber://chat?number=%2B959402529376" target="_blank" rel="noreferrer" className="bg-purple-600 p-3 rounded-full shadow-lg text-white"><MessageCircle size={20}/></a>
        </div>
      )}
      <button onClick={() => setIsSocialOpen(!isSocialOpen)} className={`${isSocialOpen ? 'bg-red-500' : 'bg-blue-600'} p-4 rounded-full shadow-2xl text-white transition-all transform active:scale-90`}><Share2 size={24}/></button>
    </div>
  );

  const BottomNav = () => (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#0a192f]/95 p-5 flex justify-around items-center z-50 rounded-t-3xl border-t border-blue-900/10 shadow-2xl">
      <button onClick={() => setView('home')} className={view === 'home' ? 'text-blue-500 scale-110' : 'text-slate-500'}><ShoppingBag size={24}/></button>
      <button onClick={() => user ? setView('customer_dash') : setView('welcome')} className={view === 'customer_dash' ? 'text-blue-500 scale-110' : 'text-slate-500'}><History size={24}/></button>
      {profile?.role === 'admin' && <button onClick={() => setView('admin_dash')} className={view === 'admin_dash' ? 'text-blue-500 scale-110' : 'text-slate-500'}><ShieldCheck size={24}/></button>}
      <button onClick={() => user ? setView('profile') : setView('welcome')} className={view === 'profile' ? 'text-blue-500 scale-110' : 'text-slate-500'}><User size={24}/></button>
    </nav>
  );

  if (view === 'initializing') return <div className="min-h-screen bg-[#050d1a] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40}/></div>;

  return (
    <div className="bg-[#050d1a] min-h-screen text-white font-sans flex justify-center">
      <div className="w-full max-w-md min-h-screen flex flex-col relative bg-[#0a192f] shadow-2xl overflow-x-hidden">
        <SocialPopup />
        
        {view === 'welcome' && (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-[#0a192f] z-[60]">
            <img src={LOGO_URL} className="w-20 h-20 mb-6 rounded-2xl shadow-xl" /><h1 className="text-3xl font-black mb-2 tracking-tighter uppercase">MM Tech</h1>
            <p className="text-slate-400 text-xs mb-10 font-bold uppercase tracking-widest">Sign in to complete order</p>
            <button onClick={() => signInWithPopup(auth, googleProvider)} className="w-full bg-white text-black py-4 rounded-2xl font-black shadow-xl active:scale-95">Login with Google</button>
            <button onClick={() => setView('home')} className="mt-6 text-blue-500 text-[10px] font-black uppercase tracking-widest">Back to Store</button>
          </div>
        )}

        {view === 'home' && (
          <><MainHeader /><div className="p-6 pb-40">
            <div className="relative mb-6"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} /><input type="text" placeholder="Search..." className="w-full bg-[#112240] border border-blue-900/20 py-4 pl-12 pr-4 rounded-2xl text-sm outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
              <button onClick={() => setSelectedCat(null)} className={`px-5 py-2 rounded-full text-[10px] font-black border ${!selectedCat ? 'bg-blue-600 border-blue-500' : 'bg-[#112240] border-blue-900/20'}`}>All</button>
              {[...new Set(products.map(p => getPProp(p, 'Category')).filter(Boolean))].map(c => <button key={c} onClick={() => setSelectedCat(c)} className={`px-5 py-2 rounded-full text-[10px] font-black border whitespace-nowrap ${selectedCat === c ? 'bg-blue-600' : 'bg-[#112240]'}`}>{c}</button>)}
            </div>
            <div className="grid grid-cols-2 gap-4">{groupedProducts.map(group => (<div key={group.name} onClick={() => { setSelectedGroup(group); setView('group_details'); }} className="bg-[#112240]/40 p-3 rounded-2xl border border-blue-900/10 active:scale-95"><div className="aspect-square bg-[#0a192f] rounded-xl overflow-hidden mb-3"><img src={formatImg(group.image)} className="w-full h-full object-cover" /></div><h4 className="text-[10px] font-black truncate text-white uppercase">{group.name}</h4></div>))}</div>
          </div><BottomNav /></>
        )}

        {view === 'group_details' && (
          <div className="p-6 pb-40"><MainHeader /><button onClick={() => setView('home')} className="mt-6 mb-6 bg-[#112240] p-2 rounded-xl border border-blue-900/20"><ArrowLeft size={20}/></button>
            <h2 className="text-xl font-black mb-8 uppercase tracking-tighter">{selectedGroup?.name}</h2>
            <div className="space-y-4">{selectedGroup?.plans.map((p, i) => (<div key={i} onClick={() => { setSelectedPlan(p); setView('plan_details'); }} className="bg-[#112240] p-5 rounded-3xl border border-blue-900/20 flex justify-between items-center active:scale-95"><div className="text-left"><p className="text-sm font-black">{getPProp(p, 'Plan')}</p><p className="text-blue-500 font-black">{getDisplayPrice(p)} Ks</p></div><Plus className="text-blue-500" size={18}/></div>))}</div><BottomNav /></div>
        )}

        {view === 'plan_details' && selectedPlan && (
          <div className="p-6 pb-40"><MainHeader /><button onClick={() => setView('group_details')} className="mt-6 mb-6 bg-[#112240] p-2 rounded-xl border border-blue-900/20"><ArrowLeft size={20}/></button>
            <div className="bg-[#112240] p-6 rounded-[2.5rem] border border-blue-900/30 text-center mb-8 shadow-xl">
              <img src={formatImg(getPProp(selectedPlan, 'Link'))} className="w-24 h-24 mx-auto mb-6 rounded-3xl shadow-2xl" /><h2 className="text-xl font-black uppercase mb-1">{getPProp(selectedPlan, 'Name')}</h2><p className="text-blue-500 text-2xl font-black mb-6">{getDisplayPrice(selectedPlan)} Ks</p>
              {getPProp(selectedPlan, 'Des') && <div className="p-4 bg-black/20 rounded-2xl text-[11px] text-slate-400 text-left mb-6 whitespace-pre-wrap leading-relaxed">{getPProp(selectedPlan, 'Des')}</div>}
              <button onClick={() => { if (!user) return setView('welcome'); setCart([...cart, selectedPlan]); alert("Added to cart!"); }} className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white active:scale-95">ADD TO CART</button>
            </div><BottomNav /></div>
        )}

        {view === 'cart_view' && (
          <div className="p-6 pb-40 flex flex-col flex-1"><MainHeader /><div className="flex justify-between items-center my-6"><button onClick={() => setView('home')} className="bg-[#112240] p-2 rounded-xl border border-blue-900/20"><ArrowLeft size={20}/></button><h2 className="text-lg font-black uppercase">Your Cart</h2><div className="w-10"></div></div>
            {cart.length === 0 ? <div className="mt-20 text-center opacity-30"><ShoppingCart size={60} className="mx-auto mb-4"/><p className="font-bold">Empty</p></div> : 
            <div className="space-y-4">{cart.map((item, idx) => (<div key={idx} className="bg-[#112240] p-4 rounded-2xl flex items-center justify-between border border-blue-900/10"><div className="flex items-center gap-3"><img src={formatImg(getPProp(item, 'Link'))} className="w-10 h-10 rounded-lg object-cover" /><div><p className="text-[10px] font-black uppercase truncate max-w-[140px]">{getPProp(item, 'Name')}</p><p className="text-[9px] text-blue-500 font-bold">{getPProp(item, 'Plan')} • {getDisplayPrice(item)} Ks</p></div></div><button onClick={()=>{const up=[...cart]; up.splice(idx,1); setCart(up);}} className="text-red-500 p-2"><X size={18}/></button></div>))}
            <div className="mt-10 p-6 bg-[#112240] rounded-3xl border border-blue-500/10"><div className="flex justify-between mb-6"><span className="text-xs font-bold text-slate-400">Total Items: {cart.length}</span><span className="text-xl font-black">{cart.reduce((s,i)=>s+parseInt(getDisplayPrice(i)),0)} Ks</span></div><button onClick={() => user ? setView('checkout') : setView('welcome')} className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white shadow-xl active:scale-95">Proceed to Checkout</button></div></div>}<BottomNav /></div>
        )}

        {view === 'checkout' && (
          <div className="p-6 pb-40 overflow-y-auto no-scrollbar"><MainHeader /><button onClick={() => setView('cart_view')} className="mt-6 mb-6 bg-[#112240] p-2 rounded-xl border border-blue-900/20"><ArrowLeft size={20}/></button>
            <div className="bg-[#112240] p-6 rounded-[2.5rem] border border-blue-900/30 text-center mb-6"><h3 className="text-lg font-black mb-1">Total Checkout</h3><p className="text-blue-500 font-black text-2xl">{cart.reduce((s,i)=>s+parseInt(getDisplayPrice(i)),0)} Ks</p></div>
            <textarea rows="4" placeholder="ID, Password, Phone Number အကုန်ဒီမှာရေးပေးပါ..." className="w-full bg-[#112240] p-5 rounded-2xl mb-8 text-sm outline-none border border-blue-900/20 focus:border-blue-500" value={editContact} onChange={e => setEditContact(e.target.value)} />
            <div className="mb-6"><p className="text-[10px] font-black text-slate-500 uppercase mb-3 ml-2 tracking-widest">Payment Method</p><div className="grid grid-cols-4 gap-2">
              {[ { id: 'kpay', name: 'KBZ Pay', num: '09 402529376', user: 'Daw Khin Mar Wai', img: 'https://i.ibb.co/Jj3SFW3C/kpay-logo.png' }, { id: 'visa', name: 'VISA', num: '4052 6403 0832 7313', user: 'U Htet Wai Soe', img: 'https://i.ibb.co/HLR2TxPr/Untitled-1.png' }, { id: 'wave', name: 'Wave Money', num: '09 793655312', user: 'U Sai Khun Thet Hein', img: 'https://i.ibb.co/23yq59BX/wave-pay.png' }, { id: 'ayapay', name: 'UAB Pay', num: '09 2021942', user: 'U Htet Wai Soe', img: 'https://i.ibb.co/GQyyTxh2/uabpay.png' } ].map(m => (
                <button key={m.id} onClick={() => setSelectedPayment(m)} className={`p-2 rounded-xl border bg-white ${selectedPayment?.id === m.id ? 'border-blue-500 border-4 scale-95' : 'border-transparent'}`}><img src={m.img} className="w-full h-auto max-h-10 object-contain" /></button>
              ))}
            </div>{selectedPayment && <div className="mt-4 p-4 bg-blue-500/10 rounded-2xl"><p className="text-[10px] font-black text-blue-400">{selectedPayment.name}</p><h4 className="text-lg font-black text-white">{selectedPayment.num}</h4><p className="text-[10px] text-slate-400">Name: {selectedPayment.user}</p></div>}</div>
            <div className="mb-8"><p className="text-[10px] font-black text-slate-500 uppercase mb-3 ml-2 tracking-widest">Payment Receipt</p><div className="w-full aspect-video bg-[#112240] rounded-2xl border-2 border-dashed border-blue-900/30 flex items-center justify-center relative overflow-hidden">
              {payImg ? <div className="w-full h-full relative"><img src={payImg} className="w-full h-full object-contain" /><button onClick={()=>setPayImg("")} className="absolute top-4 right-4 bg-red-500 p-1 rounded-full"><X size={16}/></button></div> : 
              <label className="cursor-pointer flex flex-col items-center text-blue-500"><ImageIcon size={32}/><span className="text-[9px] font-black mt-2 uppercase">Upload Screenshot</span><input type="file" className="hidden" onChange={async e => {
                setLoading(true); const fd = new FormData(); fd.append("image", e.target.files[0]);
                const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: fd });
                const d = await res.json(); if(d.success) setPayImg(d.data.url); setLoading(false);
              }} /></label>}
            </div></div>
            <button onClick={handleOrder} disabled={loading || !payImg || !selectedPayment} className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white shadow-2xl active:scale-95">{loading ? <Loader2 className="animate-spin mx-auto" /> : "CONFIRM ORDER"}</button>
          <BottomNav /></div>
        )}

        {view === 'admin_dash' && profile?.role === 'admin' && (
          <div className="p-6 pb-40"><MainHeader /><div className="flex justify-between items-center my-8"><h2 className="text-xl font-black uppercase tracking-tighter">Admin Dash</h2><div className="flex bg-[#112240] p-1 rounded-2xl"><button onClick={() => setAdminTab('orders')} className={`px-4 py-2 rounded-xl text-[10px] font-black ${adminTab === 'orders' ? 'bg-blue-600 shadow-lg' : 'text-slate-500'}`}>ORDERS</button><button onClick={() => setAdminTab('members')} className={`px-4 py-2 rounded-xl text-[10px] font-black ${adminTab === 'members' ? 'bg-blue-600 shadow-lg' : 'text-slate-500'}`}>USERS</button></div></div>
            <div className="space-y-4 overflow-y-auto no-scrollbar">
              {adminTab === 'orders' ? allOrders.map(o => (
                <div key={o.id} className="bg-[#112240] p-6 rounded-[2.5rem] border border-blue-900/30">
                  <div className="flex justify-between items-start mb-2"><h4 className="font-black text-xs uppercase text-white">{o.product}</h4><span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${o.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{o.status}</span></div>
                  <div className="bg-black/20 p-4 rounded-2xl text-[11px] text-slate-300 mb-4 whitespace-pre-wrap border border-blue-900/10"><b>{o.userName}</b> ({o.userGmail})<br/>{o.contact}</div>
                  <div className="flex gap-2 mb-4">{o.payImage && <a href={o.payImage} target="_blank" rel="noreferrer" className="flex-1 bg-green-600/10 p-2 rounded-xl text-center text-[9px] font-black text-green-500 border border-green-500/20">Receipt</a>}{o.techImages?.map((img, i) => <a key={i} href={img} target="_blank" rel="noreferrer" className="w-10 h-10 bg-blue-600/10 rounded-xl overflow-hidden shrink-0"><img src={img} className="w-full h-full object-cover" /></a>)}</div>
                  {o.status === 'Pending' && (
                    <div className="flex flex-col gap-2">
                      {/* အစ်ကိုပြောတဲ့ Enter ခေါက်လို့ရတဲ့ Textarea အကွက် */}
                      <textarea rows="3" placeholder="Deliver details (Gmail, Pass, Notes)..." className="w-full bg-[#0a192f] p-3 rounded-xl text-[11px] outline-none border border-blue-900/30" value={deliveryInputs[o.id] || ''} onChange={e => setDeliveryInputs({...deliveryInputs, [o.id]: e.target.value})} />
                      <button onClick={async () => { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', o.id), { status: 'Completed', result: deliveryInputs[o.id] }); alert("Done!"); }} className="w-full bg-blue-600 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95">CONFIRM DELIVERY</button>
                    </div>
                  )}
                </div>
              )) : allMembers.map(m => (
                <div key={m.uid} className="bg-[#112240] p-4 rounded-3xl flex items-center justify-between border border-blue-900/10 shadow-lg"><div className="flex items-center gap-3"><img src={m.photoURL || LOGO_URL} className="w-10 h-10 rounded-xl object-cover" /><div><p className="text-[10px] font-black">{m.name}</p><p className="text-[8px] text-blue-500 font-bold uppercase">{m.tier}</p></div></div><div className="flex gap-1 bg-[#0a192f] p-1 rounded-xl">{['Standard', 'VIP', 'Reseller'].map(t => (<button key={t} onClick={async () => { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', m.uid), { tier: t }); await updateDoc(doc(db, 'artifacts', appId, 'users', m.uid, 'profile', 'data'), { tier: t }); alert("Tier Updated!"); }} className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${m.tier === t ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>{t[0]}</button>))}</div></div>
              ))}
            </div><BottomNav /></div>
        )}

        {view === 'customer_dash' && <div className="p-6 pb-40"><MainHeader /><h2 className="text-xl font-black mt-6 mb-8 uppercase tracking-tighter">History</h2><div className="space-y-4">{myOrders.length === 0 ? <p className="text-center py-20 text-xs italic text-slate-500">No orders yet</p> : myOrders.map(o => (<div key={o.id} className="bg-[#112240] p-6 rounded-3xl border border-blue-900/20 shadow-xl"><div className="flex justify-between items-start mb-2"><div><h4 className="font-black text-[12px] uppercase text-white">{o.product}</h4><p className="text-blue-500 text-[10px] font-black uppercase">{o.plan} • {o.price} Ks</p></div><span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${o.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{o.status}</span></div>{o.result && <div className="mt-4 p-4 bg-green-500/5 border border-green-500/10 rounded-2xl flex items-center justify-between gap-3 shadow-inner"><code className="text-[11px] font-bold text-green-400 break-all whitespace-pre-wrap">{o.result}</code><button onClick={()=>{navigator.clipboard.writeText(o.result); alert("Copied!");}} className="bg-green-600 p-2 rounded-lg text-white shadow-xl active:scale-90"><Save size={14}/></button></div>}<p className="text-[8px] text-slate-600 mt-4 uppercase font-bold">{o.date}</p></div>))}</div><BottomNav /></div>}

        {view === 'order_success' && <div className="flex-1 flex flex-col items-center justify-center p-12 text-center"><CheckCircle2 size={100} className="text-green-500 mb-8 animate-in zoom-in" /><h2 className="text-4xl font-black mb-4 uppercase tracking-tighter">Success!</h2><p className="text-slate-400 text-sm mb-12 uppercase tracking-widest font-bold">Ordered Successfully</p><button onClick={() => setView('customer_dash')} className="w-full bg-blue-600 py-5 rounded-3xl font-black text-white shadow-2xl active:scale-95 uppercase tracking-widest">Go to History</button></div>}

        {view === 'profile' && <div className="p-10 flex flex-col flex-1 items-center justify-center pb-40"><MainHeader /><img src={profile?.photoURL || LOGO_URL} className="w-24 h-24 rounded-[2.5rem] border-4 border-blue-600/20 mb-6 shadow-2xl" /><h3 className="text-2xl font-black uppercase mb-1 tracking-tighter">{profile?.name}</h3><p className="text-blue-500 font-black uppercase text-[11px] mb-12 tracking-widest">{profile?.tier} Account</p><button onClick={() => auth.signOut()} className="flex items-center gap-2 text-red-500 font-black text-sm active:scale-95"><LogOut size={20}/> Sign Out</button><BottomNav /></div>}

      </div>
    </div>
  );
}
