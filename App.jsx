import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, updateDoc, query, orderBy } from 'firebase/firestore';
import { ShoppingBag, ArrowLeft, CheckCircle2, Loader2, User, ShieldCheck, LogOut, Send, Save, Layers, Image as ImageIcon, History, Plus, X, Search, ShoppingCart, LogIn, Facebook, Share2, MessageCircle, ChevronRight, Trash2, Wallet, FileText, AlertCircle, Eye } from 'lucide-react';

// --- (၁) CONFIGURATION ---
const LOGO_URL = "https://drive.google.com/thumbnail?id=1Lh-nHgyLMSr3rBVe4OGnjEvEspuMokd6&sz=w1000"; 
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby538xir03xxxyEFn0Mb_XQC5EqOobCYBYsQWJRJaAHIJOip9tHg_sAeo8Ov8_fAola/exec";
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
  const [sysLogs, setSysLogs] = useState([]); 
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [editContact, setEditContact] = useState('');
  const [adminTab, setAdminTab] = useState('orders'); 
  const [deliveryInputs, setDeliveryInputs] = useState({});
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [payImg, setPayImg] = useState("");
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [isSocialOpen, setIsSocialOpen] = useState(false);

  // Customer Detail Modal States
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // --- (၃) CORE LOGIC ---
  const syncProfile = useCallback(async (u) => {
    const docRef = doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data');
    const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'members', u.uid);
    try {
      const docSnap = await getDoc(docRef);
      let pData = docSnap.exists() ? docSnap.data() : {
        name: u.displayName, email: u.email, tier: ADMIN_EMAILS.includes(u.email) ? 'Admin' : 'Standard',
        role: ADMIN_EMAILS.includes(u.email) ? 'admin' : 'user', uid: u.uid, photoURL: u.photoURL, balance: 0
      };
      if (pData.balance === undefined) pData.balance = 0; 

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
      setAllOrders(docs); setMyOrders(docs.filter(o => o && o.userId === user.uid));
    });
    
    const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    onSnapshot(userRef, (docSnap) => { if(docSnap.exists()) setProfile(docSnap.data()); });

    if (profile?.role === 'admin') {
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'members'), (sn) => setAllMembers(sn.docs.map(d => ({ id: d.id, ...d.data() }))));
      onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), orderBy('timestamp', 'desc')), (sn) => {
        setSysLogs(sn.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
  }, [user, profile?.role]);

  const handleOrder = async () => {
    if (!user) return setView('welcome');
    
    const isCrd = selectedPayment?.id === 'crd';
    const totalPrice = cart.reduce((s, i) => s + parseInt(getDisplayPrice(i)), 0);
    const currentBalance = profile?.balance || 0;

    if (cart.length === 0 || !editContact.trim() || (!payImg && !isCrd) || !selectedPayment) {
      return alert("အချက်အလက်များ ပြည့်စုံစွာ ဖြည့်ပေးပါဗျ။");
    }

    if (isCrd && currentBalance < totalPrice) {
      return alert(`❌ လက်ကျန်ငွေ မလုံလောက်ပါ။\n\nကျသင့်ငွေ: ${totalPrice} Ks\nသင့်လက်ကျန်ငွေ: ${currentBalance} Ks\n\nကျေးဇူးပြု၍ Admin ထံမှ Balance အရင်ဖြည့်သွင်းပေးပါခင်ဗျာ/ရှင်။`);
    }

    setLoading(true);

    const orderData = {
      userId: user.uid,
      userGmail: user.email,
      userName: profile?.name,
      product: cart.map(i => getPProp(i, 'Name')).join(", "),
      plan: cart.map(i => getPProp(i, 'Plan')).join(", "),
      price: totalPrice,
      contact: editContact,
      paymentMethod: selectedPayment.name,
      payImage: isCrd ? "" : payImg, 
      items: cart.map(i => ({ Name: getPProp(i, 'Name'), Plan: getPProp(i, 'Plan') })),
      date: new Date().toLocaleString('en-GB')
    };

    try {
      if (isCrd) {
        const newBalance = currentBalance - totalPrice;
        const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
        const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'members', user.uid);
        await updateDoc(profileRef, { balance: newBalance });
        await updateDoc(memberRef, { balance: newBalance });
        
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), {
          type: 'Purchase',
          targetUser: profile.name,
          targetGmail: profile.email,
          amount: -totalPrice,
          oldBalance: currentBalance,
          newBalance: newBalance,
          detail: orderData.product,
          date: orderData.date,
          timestamp: Date.now()
        });
        
        alert(`✅ CRD ဖြင့် အော်ဒါတင်ခြင်း အောင်မြင်ပါသည်။\n\n💸 ဖြတ်တောက်ငွေ: -${totalPrice} Ks\n💰 လက်ကျန်ငွေ: ${newBalance} Ks`);
      }

      const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), { 
        ...orderData, 
        status: 'Pending', 
        timestamp: Date.now() 
      });

      await fetch(SCRIPT_URL, { 
        method: "POST", 
        mode: "no-cors", 
        body: JSON.stringify({ 
          ...orderData, 
          type: "new_order", 
          orderId: docRef.id 
        }) 
      });

      setCart([]); 
      setPayImg(""); 
      setView('order_success');
      
    } catch (e) { 
      console.error(e);
      alert("Error occurred. Please try again."); 
    } finally { 
      setLoading(false); 
    }
  };

  const updateOrderStatus = async (orderId, newStatus, resultData = "") => {
    try {
      setLoading(true);
      const orderRef = doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus, result: resultData });

      if (newStatus === 'Completed' || newStatus === 'Failed') {
        await fetch(SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          body: JSON.stringify({
            type: "update_order",
            orderId: orderId,
            status: newStatus,
            resultData: resultData
          })
        });
      }
      alert(newStatus === 'Completed' ? "Delivery Confirmed & Sheet Updated!" : "Order marked as Failed and notified!");
    } catch (e) { 
      alert(e.message); 
    } finally { 
      setLoading(false); 
    }
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
    <div className="flex items-center justify-between p-4 bg-[#0a192f]/95 backdrop-blur-md sticky top-0 z-40 border-b border-blue-900/20">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}><img src={LOGO_URL} className="w-8 h-8 rounded-lg" alt="L" /><h2 className="text-sm font-black text-white uppercase tracking-tighter">MM Tech</h2></div>
      <div className="flex items-center gap-3">
        <div className="relative cursor-pointer mr-1" onClick={() => setView('cart_view')}><ShoppingCart size={22} className="text-blue-500" />{cart.length > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{cart.length}</span>}</div>
        {user ? <img src={profile?.photoURL || LOGO_URL} className="w-8 h-8 rounded-full border border-blue-500/50 cursor-pointer object-cover" onClick={() => setView('profile')} alt="U" /> : 
        <button onClick={() => setView('welcome')} className="bg-blue-600/20 text-blue-500 px-3 py-1.5 rounded-full text-[9px] font-black flex items-center gap-1.5 border border-blue-500/30 active:scale-95 transition-all"><LogIn size={12}/> LOGIN</button>}
      </div>
    </div>
  );

  const SocialPopup = () => (
    <div className="fixed right-6 bottom-32 z-[100] flex flex-col items-end gap-3">
      {isSocialOpen && (
        <div className="flex flex-col gap-3 mb-2 animate-in slide-in-from-bottom-5 duration-300">
          <a href="https://www.facebook.com/share/188Uv3Fdkq/" target="_blank" rel="noreferrer" className="bg-blue-600 p-3 rounded-full shadow-2xl text-white hover:scale-110 transition-transform"><Facebook size={20}/></a>
          <a href="https://t.me/mmtech19" target="_blank" rel="noreferrer" className="bg-blue-400 p-3 rounded-full shadow-2xl text-white hover:scale-110 transition-transform"><Send size={20}/></a>
          <a href="viber://chat?number=%2B959976659997" target="_blank" rel="noreferrer" className="bg-purple-600 p-3 rounded-full shadow-2xl text-white hover:scale-110 transition-transform"><MessageCircle size={20}/></a>
        </div>
      )}
      <button onClick={() => setIsSocialOpen(!isSocialOpen)} className={`${isSocialOpen ? 'bg-red-500' : 'bg-blue-600'} p-4 rounded-full shadow-2xl text-white transition-all transform active:scale-90`}><Share2 size={24}/></button>
    </div>
  );

  const BottomNav = () => (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-5xl lg:max-w-screen-2xl bg-[#0a192f]/95 p-5 flex justify-around items-center z-50 rounded-t-3xl border-t border-blue-900/10 shadow-2xl backdrop-blur-md">
      <button onClick={() => setView('home')} className={view === 'home' ? 'text-blue-500 scale-110' : 'text-slate-500'}><ShoppingBag size={24}/></button>
      <button onClick={() => user ? setView('customer_dash') : setView('welcome')} className={view === 'customer_dash' ? 'text-blue-500 scale-110' : 'text-slate-500'}><History size={24}/></button>
      {profile?.role === 'admin' && <button onClick={() => setView('admin_dash')} className={view === 'admin_dash' ? 'text-blue-500 scale-110' : 'text-slate-500'}><ShieldCheck size={24}/></button>}
      <button onClick={() => user ? setView('profile') : setView('welcome')} className={view === 'profile' ? 'text-blue-500 scale-110' : 'text-slate-500'}><User size={24}/></button>
    </nav>
  );

  if (view === 'initializing') return <div className="min-h-screen bg-[#050d1a] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40}/></div>;

  return (
    <div className="bg-[#050d1a] min-h-screen text-white font-sans flex items-center justify-center p-0 md:p-4">
      <div className="w-full max-w-md md:max-w-5xl lg:max-w-screen-2xl mx-auto min-h-[100dvh] md:min-h-[90vh] flex flex-col relative bg-[#0a192f] md:rounded-[3rem] border-x border-blue-900/10 shadow-2xl overflow-x-hidden md:border-y">
        <SocialPopup />
        
        {view === 'welcome' && (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-[#0a192f] z-[60]">
            <img src={LOGO_URL} className="w-20 h-20 mb-6 rounded-2xl shadow-xl" alt="L" />
            <h1 className="text-3xl font-black mb-2 tracking-tighter uppercase">MM Tech</h1>
            <p className="text-slate-400 text-xs mb-10 font-bold uppercase tracking-widest">Sign in to complete order</p>
            <button onClick={() => signInWithPopup(auth, googleProvider)} className="w-full max-w-xs bg-white text-black py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all">Continue with Google</button>
            <button onClick={() => setView('home')} className="mt-6 text-blue-500 text-[10px] font-black uppercase tracking-widest">Back to Store</button>
          </div>
        )}

        {view === 'home' && (
          <><MainHeader /><div className="p-6 pb-40">
            <div className="relative mb-6"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} /><input type="text" placeholder="Search products..." className="w-full bg-[#112240] border border-blue-900/20 py-4 pl-12 pr-4 rounded-2xl text-sm outline-none focus:border-blue-500 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
              <button onClick={() => setSelectedCat(null)} className={`px-5 py-2 rounded-full text-[10px] font-black border ${!selectedCat ? 'bg-blue-600 border-blue-500 shadow-lg' : 'bg-[#112240] border-blue-900/20'}`}>All</button>
              {[...new Set(products.map(p => getPProp(p, 'Category')).filter(Boolean))].map(c => <button key={c} onClick={() => setSelectedCat(c)} className={`px-5 py-2 rounded-full text-[10px] font-black border whitespace-nowrap ${selectedCat === c ? 'bg-blue-600 border-blue-400' : 'bg-[#112240] border-blue-900/20'}`}>{c}</button>)}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">{groupedProducts.map(group => (<div key={group.name} onClick={() => { setSelectedGroup(group); setView('group_details'); }} className="bg-[#112240]/40 p-3 rounded-2xl border border-blue-900/10 active:scale-95 transition-all hover:border-blue-500/30 group cursor-pointer"><div className="aspect-square bg-[#0a192f] rounded-xl overflow-hidden mb-3"><img src={formatImg(group.image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="I" /></div><h4 className="text-[10px] font-black truncate text-white uppercase">{group.name}</h4></div>))}</div>
          </div><BottomNav /></>
        )}

        {view === 'group_details' && (
          <div className="p-6 pb-40"><MainHeader /><button onClick={() => setView('home')} className="mt-6 mb-6 bg-[#112240] p-2 rounded-xl border border-blue-900/20 active:scale-90"><ArrowLeft size={20}/></button>
            <h2 className="text-xl font-black mb-8 uppercase tracking-tighter">{selectedGroup?.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{selectedGroup?.plans.map((p, i) => (<div key={i} onClick={() => { setSelectedPlan(p); setView('plan_details'); }} className="bg-[#112240] p-5 rounded-3xl border border-blue-900/20 flex justify-between items-center active:scale-[0.98] transition-all hover:border-blue-500/30 cursor-pointer"><div className="text-left"><p className="text-sm font-black">{getPProp(p, 'Plan')}</p><p className="text-blue-500 font-black">{getDisplayPrice(p)} Ks</p></div><ChevronRight className="text-slate-500" size={18}/></div>))}</div><BottomNav /></div>
        )}

        {view === 'plan_details' && selectedPlan && (
          <div className="p-6 pb-40"><MainHeader /><button onClick={() => setView('group_details')} className="mt-6 mb-6 bg-[#112240] p-2 rounded-xl border border-blue-900/20"><ArrowLeft size={20}/></button>
            <div className="max-w-2xl mx-auto bg-[#112240] p-8 rounded-[2.5rem] border border-blue-900/30 text-center mb-8 shadow-xl">
              <img src={formatImg(getPProp(selectedPlan, 'Link'))} className="w-32 h-32 mx-auto mb-6 rounded-3xl shadow-2xl object-cover" alt="P" /><h2 className="text-2xl font-black uppercase mb-1">{getPProp(selectedPlan, 'Name')}</h2><p className="text-blue-500 text-3xl font-black mb-6">{getDisplayPrice(selectedPlan)} Ks</p>
              {getPProp(selectedPlan, 'Des') && <div className="p-5 bg-black/20 rounded-2xl text-[12px] text-slate-300 text-left mb-8 whitespace-pre-wrap leading-relaxed border border-blue-900/10">{getPProp(selectedPlan, 'Des')}</div>}
              <button onClick={() => { if (!user) return setView('welcome'); setCart([...cart, selectedPlan]); setView('cart_view'); }} className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white active:scale-95 transition-all shadow-xl">ADD TO CART</button>
            </div><BottomNav /></div>
        )}

        {view === 'cart_view' && (
          <div className="p-6 pb-40 flex flex-col flex-1"><MainHeader /><div className="flex justify-between items-center my-6"><button onClick={() => setView('home')} className="bg-[#112240] p-2 rounded-xl border border-blue-900/20"><ArrowLeft size={20}/></button><h2 className="text-lg font-black uppercase">Your Cart</h2><div className="w-10"></div></div>
            {cart.length === 0 ? <div className="mt-20 text-center opacity-30"><ShoppingCart size={60} className="mx-auto mb-4"/><p className="font-bold uppercase text-xs">Empty Cart</p></div> : 
            <div className="max-w-2xl mx-auto w-full space-y-4">{cart.map((item, idx) => (<div key={idx} className="bg-[#112240] p-4 rounded-3xl flex items-center justify-between border border-blue-900/10"><div className="flex items-center gap-3"><img src={formatImg(getPProp(item, 'Link'))} className="w-12 h-12 rounded-xl object-cover" alt="I" /><div><p className="text-[11px] font-black uppercase truncate max-w-[150px]">{getPProp(item, 'Name')}</p><p className="text-[10px] text-blue-500 font-bold">{getPProp(item, 'Plan')} • {getDisplayPrice(item)} Ks</p></div></div><button onClick={()=>{const up=[...cart]; up.splice(idx,1); setCart(up);}} className="text-red-500 p-2 hover:bg-red-500/10 rounded-xl"><Trash2 size={20}/></button></div>))}
            <div className="mt-10 p-6 bg-[#112240] rounded-[2rem] border border-blue-500/10 shadow-xl"><div className="flex justify-between mb-6"><span className="text-xs font-bold text-slate-400 uppercase">Total Items: {cart.length}</span><span className="text-2xl text-blue-500 font-black">{cart.reduce((s,i)=>s+parseInt(getDisplayPrice(i)),0)} Ks</span></div><button onClick={() => user ? setView('checkout') : setView('welcome')} className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white shadow-xl active:scale-95 transition-all">Proceed to Checkout</button></div></div>}<BottomNav /></div>
        )}

        {view === 'checkout' && (
          <div className="p-6 pb-40 overflow-y-auto no-scrollbar"><MainHeader /><button onClick={() => setView('cart_view')} className="mt-6 mb-6 bg-[#112240] p-2 rounded-xl border border-blue-900/20"><ArrowLeft size={20}/></button>
            <div className="max-w-xl mx-auto"><div className="bg-[#112240] p-6 rounded-[2.5rem] border border-blue-900/30 text-center mb-8"><h3 className="text-lg font-black mb-1 uppercase tracking-tighter">Total Checkout</h3><p className="text-blue-500 font-black text-3xl">{cart.reduce((s,i)=>s+parseInt(getDisplayPrice(i)),0)} Ks</p></div>
            <textarea rows="4" placeholder="ID, Password, Phone Number အစရှိသည့် လိုအပ်သော အချက်အလက်များ အကုန်ဒီမှာရေးပေးပါ..." className="w-full bg-[#112240] p-5 rounded-2xl mb-8 text-sm outline-none border border-blue-900/20 focus:border-blue-500 transition-all shadow-inner" value={editContact} onChange={e => setEditContact(e.target.value)} />
            <div className="mb-8"><p className="text-[10px] font-black text-slate-500 uppercase mb-3 ml-2 tracking-widest">Payment Method</p><div className="grid grid-cols-5 md:grid-cols-5 gap-2">
              {[ 
                { id: 'crd', name: 'Credit (CRD)', num: 'Pay with Balance', user: `Balance: ${profile?.balance || 0} Ks`, img: 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png' }, 
                { id: 'kpay', name: 'KBZ Pay', num: '09 402529376', user: 'Daw Khin Mar Wai', img: 'https://i.ibb.co/Jj3SFW3C/kpay-logo.png' }, 
                { id: 'visa', name: 'VISA', num: '4052 6403 0832 7313', user: 'U Htet Wai Soe', img: 'https://i.ibb.co/HLR2TxPr/Untitled-1.png' }, 
                { id: 'wave', name: 'Wave Money', num: '09 793655312', user: 'U Sai Khun Thet Hein', img: 'https://i.ibb.co/23yq59BX/wave-pay.png' }, 
                { id: 'ayapay', name: 'UAB Pay', num: '09 2021942', user: 'U Htet Wai Soe', img: 'https://i.ibb.co/GQyyTxh2/uabpay.png' } 
              ].map(m => (
                <button key={m.id} onClick={() => setSelectedPayment(m)} className={`p-2 rounded-xl border bg-white aspect-square flex flex-col items-center justify-center transition-all ${selectedPayment?.id === m.id ? 'border-blue-500 border-4 scale-95' : 'border-transparent'}`}><img src={m.img} className="w-full h-auto max-h-8 object-contain mb-1" alt={m.name}/><span className="text-[8px] font-bold text-slate-800 leading-tight">{m.name === 'Credit (CRD)' ? 'CRD' : ''}</span></button>
              ))}
            </div>{selectedPayment && <div className="mt-4 p-5 bg-blue-500/10 rounded-[2rem] border border-blue-500/20 animate-in zoom-in duration-300"><p className="text-[10px] font-black text-blue-400 uppercase">{selectedPayment.name}</p><h4 className="text-xl font-black text-white">{selectedPayment.num}</h4><p className="text-[11px] text-slate-400 font-bold">{selectedPayment.id === 'crd' ? selectedPayment.user : `Name: ${selectedPayment.user}`}</p></div>}</div>
            
            {selectedPayment?.id !== 'crd' && (
              <div className="mb-10"><p className="text-[10px] font-black text-slate-500 uppercase mb-3 ml-2 tracking-widest">Payment Receipt</p><div className="w-full aspect-video bg-[#112240] rounded-[2rem] border-2 border-dashed border-blue-900/30 flex items-center justify-center relative overflow-hidden group">
                {payImg ? <div className="w-full h-full relative"><img src={payImg} className="w-full h-full object-contain" alt="P"/><button onClick={()=>setPayImg("")} className="absolute top-4 right-4 bg-red-500 p-2 rounded-full shadow-lg active:scale-90 transition-all"><X size={16}/></button></div> : 
                <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-blue-500 group-hover:bg-blue-500/5 transition-colors"><ImageIcon size={32}/><span className="text-[10px] font-black mt-2 uppercase tracking-widest">Upload Screenshot</span><input type="file" className="hidden" onChange={async e => {
                  if (!e.target.files[0]) return;
                  setLoading(true); const fd = new FormData(); fd.append("image", e.target.files[0]);
                  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: fd });
                  const d = await res.json(); if(d.success) setPayImg(d.data.url); setLoading(false);
                }} /></label>}
              </div></div>
            )}

            <button onClick={handleOrder} disabled={loading || (!payImg && selectedPayment?.id !== 'crd') || !selectedPayment} className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
              {loading ? <Loader2 className="animate-spin" /> : <><Send size={20}/> CONFIRM ORDER</>}
            </button></div><BottomNav /></div>
        )}

        {view === 'order_success' && (
          <div className="p-10 pb-40 flex-1 flex flex-col items-center justify-center text-center">
            <CheckCircle2 size={80} className="text-green-500 mb-6 animate-bounce" />
            <h2 className="text-2xl font-black uppercase mb-2">Order Successful!</h2>
            <p className="text-slate-400 text-xs mb-8">သင့်အော်ဒါတင်ခြင်း အောင်မြင်ပါသည်။ Admin မှ စစ်ဆေးပြီး အမြန်ဆုံး ဆောင်ရွက်ပေးပါမည်။</p>
            <button onClick={() => setView('home')} className="w-full max-w-xs bg-blue-600 py-4 rounded-2xl font-black text-white shadow-xl">Back to Home</button>
            <BottomNav />
          </div>
        )}

        {view === 'customer_dash' && (
          <div className="p-6 pb-40 flex-1 flex flex-col"><MainHeader />
            <h2 className="text-xl font-black uppercase my-6 tracking-tighter">My Orders History</h2>
            <div className="space-y-4 overflow-y-auto no-scrollbar flex-1">
              {myOrders.length === 0 ? <p className="text-center text-slate-500 text-xs mt-20">No orders found.</p> :
              myOrders.map(o => (
                <div key={o.id} className="bg-[#112240] p-5 rounded-3xl border border-blue-900/20 shadow-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-black uppercase">{o.product}</h4>
                    <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${o.status === 'Completed' ? 'bg-green-500/10 text-green-500' : o.status === 'Failed' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{o.status}</span>
                  </div>
                  <p className="text-[10px] text-blue-500 font-bold mb-2">{o.plan} • {o.price} Ks</p>
                  <p className="text-[10px] text-slate-400">Date: {o.date}</p>
                  {o.status === 'Failed' && o.result && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-400 whitespace-pre-wrap">
                      <b>❌ မအောင်မြင်ရသည့် အကြောင်းရင်း:</b><br/>{o.result}
                    </div>
                  )}
                  {o.status === 'Completed' && o.result && (
                    <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-[11px] text-green-400 whitespace-pre-wrap">
                      <b>Result / Details:</b><br/>{o.result}
                    </div>
                  )}
                </div>
              ))}
            </div><BottomNav />
          </div>
        )}

        {view === 'profile' && user && (
          <div className="p-6 pb-40 flex-1 flex flex-col items-center"><MainHeader />
            <div className="w-full max-w-md bg-[#112240] p-8 rounded-[2.5rem] border border-blue-900/30 text-center my-auto shadow-2xl">
              <img src={profile?.photoURL || user.photoURL || LOGO_URL} className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-blue-500 object-cover shadow-xl" alt="Profile" />
              <h2 className="text-xl font-black mb-1">{profile?.name || user.displayName}</h2>
              <p className="text-slate-400 text-xs mb-4">{user.email}</p>
              <div className="flex justify-center gap-2 mb-6">
                <span className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-black rounded-full uppercase">{profile?.tier || 'Standard'}</span>
                <span className="px-3 py-1 bg-green-600/20 border border-green-500/30 text-green-400 text-[10px] font-black rounded-full uppercase">Balance: {profile?.balance || 0} Ks</span>
              </div>
              <button onClick={() => { signOut(auth); setView('home'); }} className="w-full bg-red-600/20 border border-red-500/30 text-red-500 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"><LogOut size={16}/> Sign Out</button>
            </div><BottomNav />
          </div>
        )}

        {view === 'admin_dash' && profile?.role === 'admin' && (
          <div className="p-6 pb-40 flex-1 flex flex-col"><MainHeader /><div className="flex justify-between items-center my-8"><h2 className="text-2xl font-black uppercase tracking-tighter">Management</h2>
          <div className="flex bg-[#112240] p-1 rounded-2xl border border-blue-900/20">
            <button onClick={() => setAdminTab('orders')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${adminTab === 'orders' ? 'bg-blue-600 shadow-lg' : 'text-slate-500'}`}>ORDERS</button>
            <button onClick={() => setAdminTab('members')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${adminTab === 'members' ? 'bg-blue-600 shadow-lg' : 'text-slate-500'}`}>USERS</button>
            <button onClick={() => setAdminTab('logs')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${adminTab === 'logs' ? 'bg-blue-600 shadow-lg' : 'text-slate-500'}`}>LOGS</button>
          </div>
          </div>
            <div className="space-y-4 overflow-y-auto no-scrollbar max-w-4xl mx-auto w-full flex-1">
              {/* ORDERS TAB */}
              {adminTab === 'orders' && allOrders.map(o => (
                <div key={o.id} className="bg-[#112240] p-6 rounded-[2.5rem] border border-blue-900/30 shadow-xl">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-black text-sm uppercase text-white">{o.product}</h4>
                      <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">{o.plan} • {o.price} Ks</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${o.status === 'Completed' ? 'bg-green-500/10 text-green-500' : o.status === 'Failed' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{o.status}</span>
                  </div>
                  <div className="bg-black/20 p-5 rounded-2xl text-[12px] text-slate-300 mb-4 whitespace-pre-wrap border border-blue-900/10 font-medium"><b>Customer:</b> {o.userName} ({o.userGmail})<br/><b>Payment:</b> <span className={o.paymentMethod === 'Credit (CRD)' ? 'text-blue-400' : 'text-slate-300'}>{o.paymentMethod || 'Manual'}</span><br/><br/><b>Details:</b><br/>{o.contact}</div>
                  <div className="flex gap-2 mb-4">{o.payImage && <a href={o.payImage} target="_blank" rel="noreferrer" className="flex-1 bg-green-600/10 p-2 rounded-xl text-center text-[9px] font-black text-green-500 border border-green-500/20 hover:bg-green-600/20 transition-all">View Receipt</a>}{o.techImages?.map((img, i) => <a key={i} href={img} target="_blank" rel="noreferrer" className="w-12 h-12 bg-blue-600/10 rounded-xl overflow-hidden shrink-0 border border-blue-500/20 hover:scale-105 transition-transform"><img src={img} className="w-full h-full object-cover" alt="T" /></a>)}</div>
                  {o.status === 'Pending' && (
                    <div className="flex flex-col gap-3">
                      <textarea rows="3" placeholder="Deliver details (Gmail, Pass, Codes) OR failure reason..." className="w-full bg-[#0a192f] p-4 rounded-2xl text-[11px] outline-none border border-blue-900/30 focus:border-blue-500 text-white" value={deliveryInputs[o.id] || ''} onChange={e => setDeliveryInputs({...deliveryInputs, [o.id]: e.target.value})} />
                      <div className="flex gap-2">
                        <button onClick={() => updateOrderStatus(o.id, 'Completed', deliveryInputs[o.id])} className="flex-1 bg-blue-600 py-3 rounded-xl font-black text-[11px] uppercase shadow-lg active:scale-95 transition-all hover:bg-blue-500 flex items-center justify-center gap-1"><CheckCircle2 size={14}/> CONFIRM & SEND</button>
                        <button onClick={() => {
                          const reason = deliveryInputs[o.id] || "အချက်အလက် မမှန်ကန်ခြင်း သို့မဟုတ် ငွေလွှဲလက်ခံမှု မရှိခြင်းကြောင့် အော်ဒါမအောင်မြင်ပါ။";
                          updateOrderStatus(o.id, 'Failed', reason);
                        }} className="flex-1 bg-red-600 py-3 rounded-xl font-black text-[11px] uppercase shadow-lg active:scale-95 transition-all hover:bg-red-500 flex items-center justify-center gap-1"><X size={14}/> MARK AS FAILED</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* USERS TAB */}
              {adminTab === 'members' && <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">{allMembers.map(m => (
                <div key={m.uid} className="bg-[#112240] p-4 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between border border-blue-900/10 shadow-lg gap-4">
                  <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setSelectedCustomer(m); setIsCustomerModalOpen(true); }}>
                    <img src={m.photoURL || LOGO_URL} className="w-12 h-12 rounded-xl object-cover border border-blue-500/30 group-hover:scale-105 transition-transform" alt="M" />
                    <div>
                      <p className="text-[12px] font-black text-white flex items-center gap-1">{m.name} <Eye size={12} className="text-blue-400"/></p>
                      <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest">{m.tier} • BAL: {m.balance || 0} Ks</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={async () => {
                      const amt = prompt(`[${m.name}] သို့ ငွေသွင်းမည့် ပမာဏကို ရိုက်ထည့်ပါ:`);
                      if(amt && !isNaN(amt)) {
                        const newBal = (m.balance || 0) + parseInt(amt);
                        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', m.uid), { balance: newBal });
                        await updateDoc(doc(db, 'artifacts', appId, 'users', m.uid, 'profile', 'data'), { balance: newBal });
                        
                        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), {
                          type: 'Topup',
                          targetUser: m.name,
                          targetGmail: m.email,
                          amount: parseInt(amt),
                          oldBalance: m.balance || 0,
                          newBalance: newBal,
                          detail: 'Admin Topup',
                          date: new Date().toLocaleString('en-GB'),
                          timestamp: Date.now()
                        });
                        alert(`အောင်မြင်ပါသည်။ ${m.name} ၏ လက်ကျန်ငွေအသစ်မှာ ${newBal} Ks ဖြစ်ပါသည်။`);
                      }
                    }} className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all bg-green-600 text-white shadow-md flex items-center gap-1"><Plus size={12}/> BAL</button>
                    <div className="flex gap-1 bg-[#0a192f] p-1 rounded-xl">
                      {['Standard', 'VIP', 'Reseller'].map(t => (<button key={t} onClick={async () => { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', m.uid), { tier: t }); await updateDoc(doc(db, 'artifacts', appId, 'users', m.uid, 'profile', 'data'), { tier: t }); alert("Tier Updated Successfully!"); }} className={`px-2 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${m.tier === t ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}>{t[0]}</button>))}
                    </div>
                  </div>
                </div>
              ))}</div>}

              {/* LOGS TAB */}
              {adminTab === 'logs' && <div className="space-y-3 w-full">
                {sysLogs.length === 0 ? <p className="text-center text-slate-500 text-xs mt-10">No logs found.</p> :
                sysLogs.map(log => (
                  <div key={log.id} className="bg-[#112240] p-4 rounded-2xl border border-blue-900/20 text-xs flex justify-between items-center">
                    <div>
                      <p className="font-black text-blue-400 uppercase">{log.type} - {log.targetUser}</p>
                      <p className="text-slate-300 text-[11px]">{log.detail} (Old: {log.oldBalance} ➔ New: {log.newBalance} Ks)</p>
                      <span className="text-[9px] text-slate-500">{log.date}</span>
                    </div>
                    <span className={`font-black ${log.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>{log.amount > 0 ? `+${log.amount}` : log.amount} Ks</span>
                  </div>
                ))}
              </div>}
            </div>
          <BottomNav /></div>
        )}

        {/* CUSTOMER DETAIL MODAL */}
        {isCustomerModalOpen && selectedCustomer && (
          <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#112240] w-full max-w-lg p-6 rounded-[2.5rem] border border-blue-500/30 shadow-2xl relative animate-in zoom-in duration-200">
              <button onClick={() => { setIsCustomerModalOpen(false); setSelectedCustomer(null); }} className="absolute top-6 right-6 bg-red-500/20 text-red-500 p-2 rounded-full hover:bg-red-500 hover:text-white transition-all"><X size={18}/></button>
              <div className="flex items-center gap-4 mb-6">
                <img src={selectedCustomer.photoURL || LOGO_URL} className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500" alt="Avatar"/>
                <div>
                  <h3 className="text-lg font-black text-white">{selectedCustomer.name}</h3>
                  <p className="text-xs text-slate-400">{selectedCustomer.email || "No Email Provided"}</p>
                  <span className="inline-block mt-1 px-3 py-0.5 bg-blue-600/20 text-blue-400 text-[9px] font-black rounded-full uppercase border border-blue-500/30">{selectedCustomer.tier || 'Standard'}</span>
                </div>
              </div>
              
              <div className="space-y-3 bg-[#0a192f] p-4 rounded-2xl border border-blue-900/20 text-xs mb-6">
                <div className="flex justify-between border-b border-blue-900/20 pb-2">
                  <span className="text-slate-400">User UID:</span>
                  <span className="font-mono text-slate-200">{selectedCustomer.uid}</span>
                </div>
                <div className="flex justify-between border-b border-blue-900/20 pb-2">
                  <span className="text-slate-400">Current Balance:</span>
                  <span className="font-black text-green-400">{selectedCustomer.balance || 0} Ks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Account Role:</span>
                  <span className="font-black uppercase text-blue-400">{selectedCustomer.role || 'user'}</span>
                </div>
              </div>

              <h4 className="text-[11px] font-black uppercase text-slate-400 mb-3 tracking-widest">Customer Orders History</h4>
              <div className="max-h-48 overflow-y-auto no-scrollbar space-y-2 mb-6">
                {allOrders.filter(o => o && o.userId === selectedCustomer?.uid).length === 0 ? (
                  <p className="text-center text-slate-500 text-[11px] py-4">This customer has no orders yet.</p>
                ) : (
                  allOrders.filter(o => o && o.userId === selectedCustomer?.uid).map(order => (
                    <div key={order.id} className="bg-[#0a192f] p-3 rounded-xl border border-blue-900/10 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white uppercase text-[11px]">{order.product} ({order.plan})</p>
                        <span className="text-[9px] text-slate-400">{order.date} • {order.price} Ks</span>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${order.status === 'Completed' ? 'bg-green-500/10 text-green-500' : order.status === 'Failed' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{order.status}</span>
                    </div>
                  ))
                )}
              </div>

              <button onClick={() => { setIsCustomerModalOpen(false); setSelectedCustomer(null); }} className="w-full bg-blue-600 py-3 rounded-xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">Close</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
