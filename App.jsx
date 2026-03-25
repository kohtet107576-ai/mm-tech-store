import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, setPersistence, browserLocalPersistence, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, updateDoc, query, orderBy } from 'firebase/firestore';
import { ShoppingBag, Gamepad2, Smartphone, ChevronRight, ArrowLeft, CheckCircle2, Loader2, User, ShieldCheck, LogOut, Send, Save, Layers, Image as ImageIcon, History, Plus, X, Search, Facebook, MessageSquare, Youtube, Video, Share2, Trash2, ShoppingCart } from 'lucide-react';

// --- (၁) CONFIGURATION ---
const LOGO_URL = "https://drive.google.com/thumbnail?id=1Lh-nHgyLMSr3rBVe4OGnjEvEspuMokd6&sz=w1000"; 
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxNJ9gsmsGyHSNJgMEjyhM2FEFxvjEmGM9I2iyCbjFfHvzbnsaukV6s4vEuxZkRJEfc/exec";
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

// Google Script ကို လှမ်းချိတ်မယ့် Noti Function အသစ်
const sendTelegramNoti = async (orderData) => {
  // အစ်ကို့ရဲ့ ကိုယ်ပိုင် Google Apps Script URL ပါ
  const scriptURL = "https://script.google.com/macros/s/AKfycbxNJ9gsmsGyHSNJgMEjyhM2FEFxvjEmGM9I2iyCbjFfHvzbnsaukV6s4vEuxZkRJEfc/exec"; 
  
  try {
    const response = await fetch(scriptURL, {
      method: 'POST',
      // CORS Error လုံးဝ မတက်အောင် text/plain နဲ့ ပြောင်းပို့ထားပါတယ်
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
      body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    if(result.status === "success") {
      console.log("Telegram သို့ Noti ပို့ခြင်း အောင်မြင်ပါသည်");
    } else {
      console.error("Script Error:", result.message);
    }
  } catch (e) { 
    console.error("Network Error:", e);
  }
};

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

  // --- (၃) Admin Functions ---
  const updateOrderStatus = async (orderId, newStatus, resultData = "") => {
    try {
      const orderRef = doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus, result: resultData });
      alert("Order Updated Successfully!");
    } catch (e) { alert("Error updating order: " + e.message); }
  };

  const updateMemberTier = async (uid, newTier) => {
    try {
      const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'members', uid);
      const userRef = doc(db, 'artifacts', appId, 'users', uid, 'profile', 'data');
      await updateDoc(memberRef, { tier: newTier });
      await updateDoc(userRef, { tier: newTier });
      alert("User Tier Updated!");
    } catch (e) { alert("Error updating user: " + e.message); }
  };

  // --- (၄) Firebase & Data Logic ---
  const syncProfile = useCallback(async (u) => {
    const docRef = doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data');
    const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'members', u.uid);
    try {
      const docSnap = await getDoc(docRef);
      let pData;
      if (docSnap.exists()) {
        pData = docSnap.data();
        if (ADMIN_EMAILS.includes(u.email) && pData.role !== 'admin') {
          pData.role = 'admin'; pData.tier = 'Admin';
        }
      } else {
        pData = {
          name: u.displayName || "User", email: u.email, 
          tier: ADMIN_EMAILS.includes(u.email) ? 'Admin' : 'Standard',
          role: ADMIN_EMAILS.includes(u.email) ? 'admin' : 'user', 
          uid: u.uid, photoURL: u.photoURL, createdAt: new Date().toISOString()
        };
      }
      await setDoc(docRef, pData, { merge: true });
      await setDoc(memberRef, pData, { merge: true });
      setProfile(pData);
    } catch (e) { console.error(e); }
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
    } catch (e) { alert("Upload error."); } finally { setLoading(false); }
  };

  const getDisplayPrice = (plan) => {
    const tier = profile?.tier || 'Standard';
    return getPProp(plan, `Price_${tier}`) || getPProp(plan, 'Price') || 0;
  };

  const handleOrder = async () => {
    if (cart.length === 0 || !editContact.trim() || !payImg || !selectedPayment) return alert("အချက်အလက်အားလုံး (Cart, ငွေလွှဲပုံ, Payment) ဖြည့်ပေးပါဗျ");
    setLoading(true);
    const orderData = {
      userId: user.uid, userName: profile?.name,
      product: cart.map(i => getPProp(i, 'Name')).join(", "),
      plan: cart.map(i => getPProp(i, 'Plan')).join(", "),
      price: cart.reduce((s, i) => s + parseInt(getDisplayPrice(i)), 0),
      contact: editContact, paymentMethod: selectedPayment.name,
      techImages: techImages.filter(img => img !== null), payImage: payImg, 
      status: 'Pending', timestamp: Date.now(), date: new Date().toLocaleString('en-GB')
    };
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderData);
      
      // Send to Google Sheet
      fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(orderData) });
      
      // Send to Telegram Group via Google Apps Script
      await sendTelegramNoti(orderData);

      setCart([]); setTechImages([null, null, null]); setPayImg(""); setEditContact(""); setView('order_success');
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const dynamicCategories = useMemo(() => {
    const uniqueCats = [...new Set(products.map(p => getPProp(p, 'Category')).filter(Boolean))];
    return uniqueCats.map(cat => ({ id: cat, name: cat, icon: <Layers size={16}/> }));
  }, [products]);

  const groupedProducts = useMemo(() => {
    const groups = {};
    products.forEach(p => {
      const name = getPProp(p, 'Name');
      if (name && (name.toLowerCase().includes(searchTerm.toLowerCase()))) {
        if (!groups[name]) groups[name] = { name, category: getPProp(p, 'Category'), image: getPProp(p, 'Link'), plans: [] };
        groups[name].plans.push(p);
      }
    });
    return Object.values(groups);
  }, [products, searchTerm]);

  // --- (၅) UI COMPONENTS ---
  const MainHeader = () => (
    <div className="flex items-center justify-between p-4 bg-[#0a192f]/80 backdrop-blur-md border-b border-blue-900/20 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <img src={LOGO_URL} className="w-8 h-8 rounded-lg" alt="L" />
        <h2 className="text-md font-black text-white uppercase tracking-tighter">MM Tech</h2>
      </div>
      <div className="flex gap-4 items-center">
        <div className="relative cursor-pointer" onClick={() => setView('cart_view')}>
          <ShoppingCart size={22} className="text-blue-500 hover:text-blue-400 transition-colors" />
          {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">{cart.length}</span>}
        </div>
        <History size={20} className="text-slate-400 cursor-pointer hover:text-blue-500 hidden md:block" onClick={() => setView('customer_dash')} />
        <User size={20} className="text-slate-400 cursor-pointer hover:text-blue-500 hidden md:block" onClick={() => setView('profile')} />
      </div>
    </div>
  );

  const BottomNav = () => (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-5xl bg-[#0a192f]/95 border-t border-blue-900/10 p-5 flex justify-around items-center z-50 rounded-t-[2.5rem] shadow-2xl backdrop-blur-md">
      <button onClick={() => setView('home')} className={view === 'home' ? 'text-blue-500 scale-110' : 'text-slate-500'}><ShoppingBag size={24}/></button>
      <button onClick={() => setView('customer_dash')} className={view === 'customer_dash' ? 'text-blue-500 scale-110' : 'text-slate-500'}><History size={24}/></button>
      {profile?.role === 'admin' && <button onClick={() => setView('admin_dash')} className={view === 'admin_dash' ? 'text-blue-500 scale-110' : 'text-slate-500'}><ShieldCheck size={24}/></button>}
      <button onClick={() => setView('profile')} className={view === 'profile' ? 'text-blue-500 scale-110' : 'text-slate-500'}><User size={24}/></button>
    </nav>
  );

  if (view === 'initializing') return <div className="min-h-screen bg-[#050d1a] flex items-center justify-center text-white"><Loader2 className="animate-spin text-blue-500" size={40}/></div>;

  return (
    <div className="bg-[#050d1a] min-h-screen text-white font-sans flex items-center justify-center">
      <div className="w-full max-w-md md:max-w-5xl lg:max-w-screen-2xl mx-auto min-h-screen flex flex-col relative bg-[#0a192f] border-x border-blue-900/10 shadow-2xl overflow-x-hidden">
        
        {view === 'welcome' && (
          <div className="flex flex-col flex-1 items-center justify-center p-10 text-center animate-in fade-in duration-700">
            <img src={LOGO_URL} className="w-24 h-24 mb-6 rounded-3xl shadow-2xl" alt="L" />
            <h1 className="text-4xl font-black mb-10 tracking-tighter uppercase">MM Tech</h1>
            <button onClick={handleLogin} className="w-full max-w-xs bg-white text-black py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all">Login with Google</button>
          </div>
        )}

        {view === 'home' && (
          <>
            <MainHeader />
            <div className="p-6 pb-40 text-left">
              <h1 className="text-3xl font-black mb-4">Store</h1>
              
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  className="w-full bg-[#112240] border border-blue-900/20 py-4 pl-12 pr-4 rounded-2xl text-sm outline-none focus:border-blue-500 transition-all shadow-inner"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6">
                <button onClick={() => setSelectedCat(null)} className={`px-5 py-2 rounded-full text-[11px] font-black border ${!selectedCat ? 'bg-blue-600 border-blue-500 shadow-lg' : 'bg-[#112240] border-blue-900/30'}`}>All</button>
                {dynamicCategories.map(c => (
                  <button key={c.id} onClick={() => setSelectedCat(c.id)} className={`px-5 py-2 rounded-full text-[11px] font-black border whitespace-nowrap ${selectedCat === c.id ? 'bg-blue-600 border-blue-400 shadow-lg' : 'bg-[#112240] border-blue-900/30'}`}>{c.name}</button>
                ))}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                {groupedProducts.filter(g => !selectedCat || g.category === selectedCat).map(group => (
                  <div key={group.name} onClick={() => { setSelectedGroup(group); setView('group_details'); }} className="bg-[#112240]/40 p-3 rounded-2xl border border-blue-900/10 active:scale-95 transition-all cursor-pointer hover:border-blue-500/30 group">
                    <div className="aspect-square bg-[#0a192f] rounded-xl overflow-hidden mb-3"><img src={formatImg(group.image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="I" /></div>
                    <h4 className="text-[11px] font-black truncate text-white uppercase">{group.name}</h4>
                  </div>
                ))}
              </div>
            </div>
            <BottomNav />
          </>
        )}

        {/* --- PLAN LIST VIEW --- */}
        {view === 'group_details' && (
          <div className="flex-1 max-w-4xl mx-auto w-full p-6 pb-40">
            <MainHeader />
            <button onClick={() => setView('home')} className="p-2 bg-[#112240] rounded-xl my-6 border border-blue-900/20"><ArrowLeft size={20}/></button>
            <h2 className="text-2xl font-black mb-8 uppercase tracking-tight">{selectedGroup?.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedGroup?.plans.map((p, i) => (
                <div key={i} onClick={() => { setSelectedPlan(p); setView('plan_details'); }} className="w-full bg-[#112240] p-6 rounded-[2rem] border border-blue-900/20 flex items-center justify-between cursor-pointer hover:border-blue-500/40 active:scale-[0.98] transition-all">
                  <div className="text-left">
                    <h4 className="text-sm font-black text-white">{getPProp(p, 'Plan')}</h4>
                    <p className="text-blue-500 font-black">{getDisplayPrice(p)} Ks</p>
                  </div>
                  <ChevronRight size={20} className="text-slate-500" />
                </div>
              ))}
            </div>
            <BottomNav />
          </div>
        )}

        {/* --- PLAN DETAIL VIEW --- */}
        {view === 'plan_details' && selectedPlan && (
          <div className="flex-1 max-w-4xl mx-auto w-full p-6 pb-40 overflow-y-auto no-scrollbar">
            <MainHeader />
            <button onClick={() => setView('group_details')} className="p-2 bg-[#112240] rounded-xl my-6 border border-blue-900/20"><ArrowLeft size={20}/></button>
            
            <div className="bg-[#112240] p-6 rounded-[2.5rem] border border-blue-900/30 text-center mb-8 shadow-xl">
              <img src={formatImg(getPProp(selectedPlan, 'Link'))} className="w-32 h-32 mx-auto mb-6 rounded-3xl object-cover shadow-2xl" alt="P"/>
              <h2 className="text-2xl font-black uppercase text-white mb-2">{getPProp(selectedPlan, 'Name')}</h2>
              <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">{getPProp(selectedPlan, 'Plan')}</h3>
              <p className="text-blue-500 text-3xl font-black mb-6">{getDisplayPrice(selectedPlan)} Ks</p>

              {getPProp(selectedPlan, 'Des') && (
                <div className="p-5 bg-black/20 rounded-2xl text-[13px] text-slate-300 text-left whitespace-pre-wrap leading-relaxed border border-blue-900/10 mb-8">
                  {getPProp(selectedPlan, 'Des')}
                </div>
              )}

              <div className="flex flex-col gap-4 mt-4">
                <button onClick={() => {
                  const alreadyInCart = cart.some(item => getPProp(item, 'Plan') === getPProp(selectedPlan, 'Plan') && getPProp(item, 'Name') === getPProp(selectedPlan, 'Name'));
                  if (!alreadyInCart) setCart([...cart, selectedPlan]);
                  setView('checkout');
                }} className="w-full bg-blue-600 py-4 rounded-2xl font-black text-white shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                  <ShoppingBag size={20}/> ချက်ချင်းဝယ်မည် (Buy Now)
                </button>

                <button onClick={() => {
                  setCart([...cart, selectedPlan]);
                  alert("ခြင်းတောင်းထဲသို့ ထည့်ပြီးပါပြီ!");
                }} className="w-full bg-transparent border-2 border-blue-600 text-blue-500 py-4 rounded-2xl font-black active:scale-95 transition-all flex items-center justify-center gap-2">
                  <Plus size={20}/> ခြင်းတောင်းထဲထည့်မည် (Add to Cart)
                </button>
              </div>
            </div>
            <BottomNav />
          </div>
        )}

        {/* --- CART VIEW --- */}
        {view === 'cart_view' && (
          <div className="flex-1 max-w-4xl mx-auto w-full p-6 pb-40 flex flex-col">
            <MainHeader />
            <div className="flex justify-between items-center my-6">
               <button onClick={() => setView('home')} className="bg-[#112240] p-2 rounded-xl border border-blue-900/20"><ArrowLeft size={20}/></button>
               <h2 className="text-xl font-black uppercase tracking-tight">Shopping Cart</h2>
               <div className="w-10"></div>
            </div>
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-50 mt-20">
                <ShoppingCart size={60} className="mb-4" />
                <p className="font-bold uppercase text-xs">Empty Cart</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item, idx) => (
                  <div key={idx} className="bg-[#112240] p-4 rounded-3xl flex items-center justify-between border border-blue-900/10">
                    <div className="flex items-center gap-3 text-left">
                      <img src={formatImg(getPProp(item, 'Link'))} className="w-12 h-12 rounded-xl object-cover" alt="I" />
                      <div>
                        <p className="text-[12px] font-black uppercase truncate max-w-[150px]">{getPProp(item, 'Name')}</p>
                        <p className="text-[10px] text-blue-500 font-bold">{getPProp(item, 'Plan')} • {getDisplayPrice(item)} Ks</p>
                      </div>
                    </div>
                    <button onClick={() => {const up=[...cart]; up.splice(idx,1); setCart(up);}} className="text-red-500 p-2 hover:bg-red-500/10 rounded-lg"><Trash2 size={20}/></button>
                  </div>
                ))}
                <div className="mt-8 p-6 bg-[#112240] rounded-[2rem] border border-blue-500/10">
                  <div className="flex justify-between mb-6"><span className="text-xs font-bold text-slate-400 uppercase">Total Items: {cart.length}</span><span className="text-2xl text-blue-500 font-black">{cart.reduce((s,i)=>s+parseInt(getDisplayPrice(i)),0)} Ks</span></div>
                  <button onClick={() => setView('checkout')} className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white shadow-xl active:scale-95 transition-all">Proceed Checkout</button>
                </div>
              </div>
            )}
            <BottomNav />
          </div>
        )}

        {/* --- CHECKOUT VIEW --- */}
        {view === 'checkout' && (
          <div className="flex-1 max-w-4xl mx-auto w-full p-6 pb-40 overflow-y-auto no-scrollbar">
            <MainHeader />
            <button onClick={() => setView('cart_view')} className="p-2 bg-[#112240] rounded-xl my-4 border border-blue-900/20"><ArrowLeft size={20}/></button>
            
            <div className="bg-[#112240] p-6 rounded-[2.5rem] border border-blue-900/30 text-center mb-8">
              <h3 className="text-lg font-black mb-1 uppercase">Checkout Total</h3>
              <p className="text-blue-500 font-black text-2xl mb-4">{cart.reduce((s,i)=>s+parseInt(getDisplayPrice(i)),0)} Ks</p>
              <div className="bg-black/20 p-4 rounded-2xl text-left text-[11px] text-slate-300 font-bold border border-blue-900/10">
                {cart.map((i, idx) => <p key={idx}>• {getPProp(i, 'Name')} - {getPProp(i, 'Plan')}</p>)}
              </div>
            </div>

            <textarea rows="4" placeholder="ID, Password, Phone Number အကုန်ဒီမှာရေးပါ..." className="w-full bg-[#112240] p-5 rounded-2xl mb-8 text-sm outline-none border border-blue-900/20 focus:border-blue-500 transition-all shadow-inner" value={editContact} onChange={e => setEditContact(e.target.value)} />

            <div className="mb-8">
              <label className="block text-slate-500 text-[11px] font-black uppercase mb-3 ml-2 tracking-widest">Payment Methode</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'kpay', name: 'KBZ Pay', num: '09 402529376', user: 'Daw Khin Mar Wai', img: 'https://i.ibb.co/Jj3SFW3C/kpay-logo.png' },
                  { id: 'visa', name: 'VISA', num: '4052 6403 0832 7313', user: 'U Htet Wai Soe', img: 'https://i.ibb.co/HLR2TxPr/Untitled-1.png' },
                  { id: 'wave', name: 'Wave Money', num: '09 793655312', user: 'U Sai Khun Thet Hein', img: 'https://i.ibb.co/23yq59BX/wave-pay.png' },
                  { id: 'ayapay', name: 'UAB Pay', num: '09 2021942', user: 'U Htet Wai Soe', img: 'https://i.ibb.co/GQyyTxh2/uabpay.png' }
                ].map(m => (
                  <button key={m.id} onClick={() => setSelectedPayment(m)} className={`p-2 rounded-2xl border transition-all aspect-square flex items-center justify-center bg-white ${selectedPayment?.id === m.id ? 'border-blue-500 border-4 scale-95' : 'border-transparent'}`}>
                    <img src={m.img} className="w-full h-auto max-h-10 object-contain" alt={m.name}/>
                  </button>
                ))}
              </div>
              {selectedPayment && (
                <div className="mt-4 p-5 bg-blue-500/10 border border-blue-500/30 rounded-[2rem] animate-in fade-in zoom-in duration-300">
                  <p className="text-[10px] font-black text-blue-400 uppercase">{selectedPayment.name} Account:</p>
                  <h4 className="text-xl font-black text-white">{selectedPayment.num}</h4>
                  <p className="text-[11px] text-slate-400 font-bold mt-1">Name: {selectedPayment.user}</p>
                </div>
              )}
            </div>

            <div className="mb-8">
              <p className="text-[11px] font-black text-slate-500 uppercase mb-4 ml-2 tracking-widest">လိုအပ်သော ပုံများတင်ရန် (Optional)</p>
              <div className="grid grid-cols-3 gap-3">
                {techImages.map((img, idx) => (
                  <div key={idx} className="aspect-square bg-[#112240] rounded-2xl border-2 border-dashed border-blue-900/30 overflow-hidden flex items-center justify-center relative">
                    {img ? (
                      <div className="relative w-full h-full">
                        <img src={img} className="w-full h-full object-cover" alt="T"/>
                        <button onClick={() => {const up=[...techImages]; up[idx]=null; setTechImages(up);}} className="absolute top-1 right-1 bg-red-500 p-1 rounded-full"><X size={10}/></button>
                      </div>
                    ) : (
                      <label className="cursor-pointer w-full h-full flex items-center justify-center hover:bg-blue-500/5 transition-colors"><Plus className="text-blue-500" size={24}/><input type="file" className="hidden" onChange={e => handleImageUpload(e.target.files[0], idx, 'tech')}/></label>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <p className="text-[11px] font-black text-slate-500 uppercase mb-4 ml-2 tracking-widest">Payment Receipt (Required)</p>
              <div className="w-full aspect-video bg-[#112240] rounded-[2rem] border-2 border-dashed border-blue-900/30 flex items-center justify-center relative overflow-hidden group">
                {payImg ? (
                  <div className="w-full h-full relative"><img src={payImg} className="w-full h-full object-contain" alt="P"/><button onClick={() => setPayImg("")} className="absolute top-4 right-4 bg-red-500 p-2 rounded-full shadow-xl"><X size={16}/></button></div>
                ) : (
                  <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-blue-500 group-hover:bg-blue-500/5 transition-colors"><ImageIcon size={32}/><p className="text-[10px] font-black uppercase mt-2 tracking-widest">ငွေလွှဲ Screenshot တင်ရန်</p><input type="file" className="hidden" onChange={e => handleImageUpload(e.target.files[0], 0, 'pay')}/></label>
                )}
              </div>
            </div>

            <button onClick={handleOrder} disabled={loading || !payImg || !selectedPayment} className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:grayscale disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" /> : <><Send size={20}/> Confirm & Order</>}
            </button>
            <BottomNav />
          </div>
        )}

        {/* --- ADMIN DASHBOARD --- */}
        {view === 'admin_dash' && profile?.role === 'admin' && (
          <div className="flex-1 max-w-5xl mx-auto w-full p-8 pb-40">
            <MainHeader />
            <div className="flex justify-between items-center my-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Management</h2>
              <div className="flex bg-[#112240] p-1 rounded-2xl border border-blue-900/20">
                <button onClick={() => setAdminTab('orders')} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${adminTab === 'orders' ? 'bg-blue-600 shadow-lg' : 'text-slate-500'}`}>ORDERS</button>
                <button onClick={() => setAdminTab('members')} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${adminTab === 'members' ? 'bg-blue-600 shadow-lg' : 'text-slate-500'}`}>USERS</button>
              </div>
            </div>
            
            <div className="space-y-4 overflow-y-auto no-scrollbar">
              {adminTab === 'orders' ? allOrders.map(o => (
                <div key={o.id} className="bg-[#112240] p-6 rounded-[2.5rem] border border-blue-900/30">
                  <div className="flex justify-between items-start mb-4">
                    <div><h4 className="font-black text-sm uppercase">{o.product}</h4><p className="text-blue-500 text-[10px] font-black uppercase">{o.plan} • {o.price} Ks</p></div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${o.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{o.status}</span>
                  </div>
                  <div className="bg-black/20 p-4 rounded-2xl text-[12px] text-slate-300 mb-4 whitespace-pre-wrap border border-blue-900/10">Method: {o.paymentMethod}<br/><br/>{o.contact}</div>
                  <div className="flex gap-2 mb-4">
                    {o.payImage && <a href={o.payImage} target="_blank" rel="noreferrer" className="flex-1 bg-green-600/10 p-2 rounded-xl text-center text-[9px] font-black text-green-500 border border-green-500/20">Receipt</a>}
                    {o.techImages?.map((img, i) => <a key={i} href={img} target="_blank" rel="noreferrer" className="w-10 h-10 bg-blue-600/10 rounded-xl border border-blue-500/20 overflow-hidden shrink-0"><img src={img} className="w-full h-full object-cover" alt="T"/></a>)}
                  </div>
                  {o.status === 'Pending' && (
                    <div className="flex gap-2">
                      <input type="text" placeholder="Deliver Code..." className="flex-1 bg-[#0a192f] p-3 rounded-xl text-[11px] outline-none border border-blue-900/30" value={deliveryInputs[o.id] || ''} onChange={e => setDeliveryInputs({...deliveryInputs, [o.id]: e.target.value})} />
                      <button onClick={() => updateOrderStatus(o.id, 'Completed', deliveryInputs[o.id])} className="bg-blue-600 px-6 rounded-xl font-black text-[10px] uppercase">Done</button>
                    </div>
                  )}
                </div>
              )) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allMembers.map(m => (
                    <div key={m.uid} className="bg-[#112240] p-4 rounded-3xl flex items-center justify-between border border-blue-900/10 shadow-lg">
                      <div className="flex items-center gap-3">
                        <img src={m.photoURL || LOGO_URL} className="w-10 h-10 rounded-xl object-cover" alt="M"/>
                        <div><p className="text-[11px] font-black text-white">{m.name}</p><p className="text-[9px] text-blue-500 uppercase font-bold">{m.tier}</p></div>
                      </div>
                      <div className="flex gap-1 bg-[#0a192f] p-1 rounded-xl">
                        {['Standard', 'VIP', 'Reseller'].map(t => (
                          <button key={t} onClick={() => updateMemberTier(m.uid, t)} className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${m.tier === t ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>{t[0]}</button>
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

        {/* --- CUSTOMER DASHBOARD --- */}
        {view === 'customer_dash' && (
          <div className="flex-1 max-w-4xl mx-auto w-full p-8 pb-40">
            <MainHeader />
            <h2 className="text-3xl font-black my-8 tracking-tight uppercase">History</h2>
            <div className="space-y-4 overflow-y-auto no-scrollbar">
              {myOrders.length === 0 ? <p className="text-slate-600 text-center py-20 text-xs italic uppercase tracking-widest">No orders yet</p> : myOrders.map(o => (
                <div key={o.id} className="bg-[#112240] p-6 rounded-[2.5rem] border border-blue-900/30 shadow-xl">
                  <div className="flex justify-between items-start mb-2">
                    <div><h4 className="font-black text-[13px] uppercase text-white">{o.product}</h4><p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">{o.plan} • {o.price} Ks</p></div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${o.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{o.status}</span>
                  </div>
                  {o.result && (
                    <div className="mt-4 p-4 bg-green-500/5 border border-green-500/10 rounded-2xl flex items-center justify-between gap-3 shadow-inner">
                      <code className="text-xs font-bold text-green-400 break-all">{o.result}</code>
                      <button onClick={() => {navigator.clipboard.writeText(o.result); alert("Copied!");}} className="bg-green-600 p-2 rounded-lg text-white shadow-xl active:scale-90 transition-all"><Save size={14}/></button>
                    </div>
                  )}
                  <p className="text-[9px] text-slate-600 italic mt-4 uppercase">{o.date}</p>
                </div>
              ))}
            </div>
            <BottomNav />
          </div>
        )}

        {/* --- PROFILE VIEW --- */}
        {view === 'profile' && (
          <div className="p-10 flex flex-col flex-1 items-center justify-center pb-40">
            <MainHeader />
            <img src={profile?.photoURL || LOGO_URL} className="w-24 h-24 rounded-[2.5rem] border-4 border-blue-600/20 mb-6 shadow-2xl" alt="U"/>
            <h3 className="text-3xl font-black tracking-tighter uppercase">{profile?.name}</h3>
            <p className="text-blue-500 font-black uppercase tracking-widest text-[11px] mb-12">{profile?.tier} Account</p>
            <button onClick={() => auth.signOut()} className="flex items-center gap-2 text-red-500 font-black text-sm active:scale-95 transition-all hover:opacity-80"><LogOut size={20}/> Sign Out Account</button>
            <BottomNav />
          </div>
        )}

        {/* --- ORDER SUCCESS --- */}
        {view === 'order_success' && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in zoom-in duration-500">
            <CheckCircle2 size={100} className="text-green-500 mb-8" />
            <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter">Ordered!</h2>
            <p className="text-slate-400 text-sm mb-12 uppercase tracking-widest font-bold">Thank you for choosing MM Tech</p>
            <button onClick={() => setView('customer_dash')} className="w-full max-w-xs bg-blue-600 py-5 rounded-3xl font-black text-white shadow-2xl active:scale-95 transition-all uppercase tracking-widest">Go to History</button>
          </div>
        )}

      </div>
    </div>
  );
}
