import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, setPersistence, browserLocalPersistence, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, updateDoc, query, orderBy } from 'firebase/firestore';
import { ShoppingBag, Gamepad2, Smartphone, ChevronRight, ArrowLeft, CheckCircle2, Loader2, User, ShieldCheck, LogOut, Send, Save, Layers, Image as ImageIcon, History, Plus, X, Search, Facebook, MessageSquare, Youtube, Video, Share2, Trash2, ShoppingCart } from 'lucide-react';

// --- (၁) CONFIGURATION ---
const LOGO_URL = "https://drive.google.com/thumbnail?id=1Lh-nHgyLMSr3rBVe4OGnjEvEspuMokd6&sz=w1000"; 
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw9-jvz928_Hd46Wo3Gs3JZnoywR79wEq0ax-qS_zOB-7tIsekn-tJO0zPgFMv_ruGx/exec";
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
  const [editContact, setEditContact] = useState('');
  const [adminTab, setAdminTab] = useState('orders');
  const [deliveryInputs, setDeliveryInputs] = useState({});
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [techImages, setTechImages] = useState([null, null, null]);
  const [payImg, setPayImg] = useState("");
  const [searchTerm, setSearchTerm] = useState(''); 
  const [cart, setCart] = useState([]); // Shopping Cart

  // --- (၃) Rose AI Chat Agent ---
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://mmtechmdy.app.n8n.cloud/assets/chat.js'; 
    script.async = true;
    script.onload = () => {
      if (window.createChat) {
        window.createChat({
          webhookUrl: 'https://mmtechmdy.app.n8n.cloud/webhook/0855a5bd-760c-40cf-a84e-9700769434ec/chat',
          title: 'MM Tech Support (Rose)',
          welcomeMessage: 'မင်္ဂလာပါရှင်၊ MM Tech မှ Rose ပါ။ ဘာကူညီပေးရမလဲရှင့်?',
          avatarUrl: LOGO_URL,
          backgroundColor: '#0a192f',
          onboarding: true,
          iFrameStyle: 'position: fixed; bottom: 85px; right: 20px; z-index: 999; border: none; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);'
        });
      }
    };
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  // --- (၄) Admin Functions ---
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

  // --- (၅) Firebase & Data Logic ---
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
      fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(orderData) });
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

  // --- (၆) UI COMPONENTS ---
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

  const SocialLinks = () => (
    <div className="flex justify-center gap-5 my-6 p-4 bg-[#112240]/50 rounded-3xl border border-blue-900/20 mx-6">
      <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-blue-500 hover:scale-110 transition-transform"><Facebook size={24}/></a>
      <a href="https://t.me/mmtech" target="_blank" rel="noreferrer" className="text-blue-400 hover:scale-110 transition-transform"><Send size={24}/></a>
      <a href="https://wa.me/yourphone" target="_blank" rel="noreferrer" className="text-green-500 hover:scale-110 transition-transform"><MessageSquare size={24}/></a>
      <a href="https://youtube.com" target="_blank" rel="noreferrer" className="text-red-500 hover:scale-110 transition-transform"><Youtube size={24}/></a>
      <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="text-white hover:scale-110 transition-transform"><Video size={24}/></a>
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

              <SocialLinks />

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

        {view === 'group_details' && (
          <div className="flex-1 max-w-4xl mx-auto w-full p-6 pb-40">
            <MainHeader />
            <button onClick={() => setView('home')} className="p-2 bg-[#112240] rounded-xl my-6 border border-blue-900/20"><ArrowLeft size={20}/></button>
            <h2 className="text-2xl font-black mb-8 uppercase tracking-tight">{selectedGroup?.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedGroup?.plans.map((p, i) => (
                <div key={i} className="w-full bg-[#112240] p-6 rounded-[2rem] border border-blue-900/20 flex items-center justify-between hover:border-blue-500/40">
                  <div className="text-left">
                    <h4 className="text-sm font-black text-white">{getPProp(p, 'Plan')}</h4>
                    <p className="text-blue-500 font-black">{getDisplayPrice(p)} Ks</p>
                    {getPProp(p, 'Des') && <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{getPProp(p, 'Des')}</p>}
                  </div>
                  <button onClick={() => {setCart([...cart, p]); alert("ခြင်းတောင်းထဲထည့်ပြီးပါပြီ");}} className="bg-blue-600 p-3 rounded-xl text-[10px] font-black active:scale-90 flex-shrink-0"><Plus size={18} className="text-white"/></button>
                </div>
              ))}
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
            
            <div className="bg-[#112240] p-6
