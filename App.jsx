import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, setPersistence, browserLocalPersistence, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, updateDoc, query, orderBy } from 'firebase/firestore';
import { ShoppingBag, Gamepad2, Smartphone, ChevronRight, ArrowLeft, CheckCircle2, Loader2, User, ShieldCheck, LogOut, Send, Save, Layers, Image as ImageIcon, History, Plus, X, Search, Facebook, MessageSquare, Youtube, Video, Share2, Trash2, ShoppingCart } from 'lucide-react';

// --- (၁) CONFIGURATION ---
const LOGO_URL = "https://drive.google.com/thumbnail?id=1Lh-nHgyLMSr3rBVe4OGnjEvEspuMokd6&sz=w1000"; 
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyLEW9hAzeMYuhYz50_bIDOsiNwVRxDENSjsgL3qoddlgqZAD5DV95I1jKaqJVim9wI/exec";
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
  const [editContact, setEditContact] = useState('');
  const [adminTab, setAdminTab] = useState('orders');
  const [deliveryInputs, setDeliveryInputs] = useState({});
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [techImages, setTechImages] = useState([null, null, null]);
  const [payImg, setPayImg] = useState("");
  const [searchTerm, setSearchTerm] = useState('');
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  
  // --- (၃) SHOPPING CART STATE ---
  const [cart, setCart] = useState([]);

  // --- (၄) CART FUNCTIONS ---
  const addToCart = (plan) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === plan.id || (getPProp(item, 'Name') === getPProp(plan, 'Name') && getPProp(item, 'Plan') === getPProp(plan, 'Plan')));
      if (exists) return prev; // ရှိပြီးသားဆိုရင် ထပ်မထည့်တော့ဘူး
      return [...prev, plan];
    });
    alert("ခြင်းတောင်းထဲသို့ ထည့်လိုက်ပါပြီ!");
  };

  const removeFromCart = (index) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + parseInt(getDisplayPrice(item) || 0), 0);
  }, [cart, profile]);

  // --- (၅) ADMIN & DATA LOGIC ---
  const updateOrderStatus = async (id, status, res) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', id), { status, result: res });
    alert("Updated!");
  };

  const updateMemberTier = async (uid, tier) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', uid), { tier });
    await updateDoc(doc(db, 'artifacts', appId, 'users', uid, 'profile', 'data'), { tier });
    alert("Tier Updated!");
  };

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
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) { setUser(u); await syncProfile(u); setView('home'); } 
      else { setView('welcome'); }
    });
    return () => unsubscribe();
  }, [syncProfile]);

  useEffect(() => {
    fetch(SCRIPT_URL).then(res => res.json()).then(data => { if (Array.isArray(data)) setProducts(data); });
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubOrders = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderBy('timestamp', 'desc')), (sn) => {
      const docs = sn.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllOrders(docs); setMyOrders(docs.filter(o => o.userId === user.uid));
    });
    let unsubMem = () => {};
    if (profile?.role === 'admin') {
      unsubMem = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'members'), (sn) => {
        setAllMembers(sn.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
    return () => { unsubOrders(); unsubMem(); };
  }, [user, profile]);

  const handleImageUpload = async (file, index, type) => {
    if (!file) return;
    setLoading(true);
    const fd = new FormData(); fd.append("image", file);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: fd });
    const d = await res.json();
    if (d.success) {
      if (type === 'tech') {
        const up = [...techImages]; up[index] = d.data.url; setTechImages(up);
      } else { setPayImg(d.data.url); }
    }
    setLoading(false);
  };

  const getDisplayPrice = (plan) => {
    const tier = profile?.tier || 'Standard';
    return getPProp(plan, `Price_${tier}`) || getPProp(plan, 'Price');
  };

  const handleOrder = async () => {
    if (cart.length === 0 || !payImg || !editContact) return alert("Fill all info");
    setLoading(true);
    const orderData = {
      userId: user.uid, userName: profile?.name,
      product: cart.map(i => getPProp(i, 'Name')).join(", "),
      plan: cart.map(i => getPProp(i, 'Plan')).join(", "),
      price: cartTotal,
      contact: editContact, status: 'Pending', timestamp: Date.now(),
      payImage: payImg, techImages: techImages.filter(i => i !== null), date: new Date().toLocaleString()
    };
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderData);
    fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(orderData) });
    setCart([]); setPayImg(""); setTechImages([null, null, null]); setView('order_success');
    setLoading(false);
  };

  const filteredProducts = useMemo(() => {
    const groups = {};
    products.forEach(p => {
      const name = getPProp(p, 'Name');
      if (name && name.toLowerCase().includes(searchTerm.toLowerCase())) {
        if (!groups[name]) groups[name] = { name, category: getPProp(p, 'Category'), image: getPProp(p, 'Link'), plans: [] };
        groups[name].plans.push(p);
      }
    });
    return Object.values(groups);
  }, [products, searchTerm]);

  // --- (၆) UI COMPONENTS ---
  const MainHeader = () => (
    <div className="flex items-center justify-between p-4 bg-[#0a192f]/90 backdrop-blur-md sticky top-0 z-40 border-b border-blue-900/20">
      <div className="flex items-center gap-2">
        <img src={LOGO_URL} className="w-8 h-8 rounded-lg" alt="L" />
        <h2 className="text-sm font-black text-white uppercase tracking-tighter">MM Tech</h2>
      </div>
      <div className="relative cursor-pointer" onClick={() => setView('cart_view')}>
        <ShoppingCart size={22} className="text-blue-500" />
        {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce">{cart.length}</span>}
      </div>
    </div>
  );

  const BottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#0a192f]/95 p-5 flex justify-around items-center z-50 rounded-t-3xl border-t border-blue-900/10">
      <button onClick={() => setView('home')} className={view === 'home' ? 'text-blue-500' : 'text-slate-500'}><ShoppingBag size={24}/></button>
      <button onClick={() => setView('customer_dash')} className={view === 'customer_dash' ? 'text-blue-500' : 'text-slate-500'}><History size={24}/></button>
      {profile?.role === 'admin' && <button onClick={() => setView('admin_dash')} className={view === 'admin_dash' ? 'text-blue-500' : 'text-slate-500'}><ShieldCheck size={24}/></button>}
      <button onClick={() => setView('profile')} className={view === 'profile' ? 'text-blue-500' : 'text-slate-500'}><User size={24}/></button>
    </nav>
  );

  const SocialPopup = () => (
    <div className="fixed right-4 bottom-28 z-[100] flex flex-col items-end gap-3">
      {isSocialOpen && (
        <div className="flex flex-col gap-3 mb-2 animate-in slide-in-from-bottom-5">
          <a href="https://facebook.com" className="bg-blue-600 p-3 rounded-full text-white"><Facebook size={20}/></a>
          <a href="https://t.me" className="bg-blue-400 p-3 rounded-full text-white"><Send size={20}/></a>
          <a href="https://wa.me" className="bg-green-500 p-3 rounded-full text-white"><MessageSquare size={20}/></a>
          <a href="https://youtube.com" className="bg-red-600 p-3 rounded-full text-white"><Youtube size={20}/></a>
        </div>
      )}
      <button onClick={() => setIsSocialOpen(!isSocialOpen)} className={`${isSocialOpen ? 'bg-red-500' : 'bg-blue-600'} p-4 rounded-full text-white shadow-2xl`}>
        {isSocialOpen ? <X size={24}/> : <Share2 size={24}/>}
      </button>
    </div>
  );

  if (view === 'initializing') return <div className="min-h-screen bg-[#050d1a] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40}/></div>;

  return (
    <div className="bg-[#050d1a] min-h-screen text-white font-sans flex justify-center">
      <div className="w-full max-w-md min-h-screen flex flex-col relative bg-[#0a192f] shadow-2xl overflow-x-hidden">
        
        <SocialPopup />

        {view === 'welcome' && (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <img src={LOGO_URL} className="w-20 h-20 mb-6 rounded-2xl" alt="L" />
            <h1 className="text-3xl font-black mb-10 tracking-tighter">MM TECH STORE</h1>
            <button onClick={() => signInWithPopup(auth, googleProvider)} className="w-full bg-white text-black py-4 rounded-2xl font-black shadow-xl">Login with Google</button>
          </div>
        )}

        {view === 'home' && (
          <>
            <MainHeader />
            <div className="p-6 pb-40">
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" placeholder="Search products..." 
                  className="w-full bg-[#112240] border border-blue-900/20 py-4 pl-12 pr-4 rounded-2xl text-sm outline-none focus:border-blue-500 transition-all"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {filteredProducts.map(group => (
                  <div key={group.name} onClick={() => { setSelectedGroup(group); setView('group_details'); }} className="bg-[#112240]/40 p-3 rounded-2xl border border-blue-900/10 active:scale-95 transition-all">
                    <div className="aspect-square bg-[#0a192f] rounded-xl overflow-hidden mb-3"><img src={formatImg(group.image)} className="w-full h-full object-cover" /></div>
                    <h4 className="text-[10px] font-black truncate uppercase">{group.name}</h4>
                  </div>
                ))}
              </div>
            </div>
            <BottomNav />
          </>
        )}

        {view === 'group_details' && (
          <div className="p-6 pb-40">
            <button onClick={() => setView('home')} className="mb-6 bg-[#112240] p-2 rounded-xl"><ArrowLeft size={20}/></button>
            <h2 className="text-xl font-black mb-6 uppercase tracking-tight">{selectedGroup?.name}</h2>
            <div className="space-y-4">
              {selectedGroup?.plans.map((p, i) => (
                <div key={i} className="bg-[#112240] p-6 rounded-3xl border border-blue-900/20 flex justify-between items-center">
                  <div className="text-left">
                    <p className="text-sm font-black text-white">{getPProp(p, 'Plan')}</p>
                    <p className="text-blue-500 font-black">{getDisplayPrice(p)} Ks</p>
                  </div>
                  <button onClick={() => addToCart(p)} className="bg-blue-600 px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 active:scale-90"><Plus size={14}/> Add</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- SHOPPING CART VIEW --- */}
        {view === 'cart_view' && (
          <div className="p-6 pb-40 flex flex-col flex-1 overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
               <button onClick={() => setView('home')} className="bg-[#112240] p-2 rounded-xl"><ArrowLeft size={20}/></button>
               <h2 className="text-xl font-black uppercase">Your Cart</h2>
               <div className="w-10"></div>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                <ShoppingCart size={60} className="mb-4 opacity-20" />
                <p className="font-bold">ခြင်းတောင်းထဲမှာ ဘာမှမရှိသေးပါ</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 flex-1">
                  {cart.map((item, idx) => (
                    <div key={idx} className="bg-[#112240] p-4 rounded-2xl flex items-center justify-between border border-blue-900/10 animate-in fade-in">
                      <div className="flex items-center gap-3 text-left">
                        <img src={formatImg(getPProp(item, 'Link'))} className="w-12 h-12 rounded-xl" />
                        <div>
                          <p className="text-[11px] font-black uppercase truncate max-w-[150px]">{getPProp(item, 'Name')}</p>
                          <p className="text-[10px] text-blue-500 font-bold">{getPProp(item, 'Plan')} • {getDisplayPrice(item)} Ks</p>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(idx)} className="text-red-500 p-2 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={18}/></button>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-[#112240] rounded-3xl border-t border-blue-500/20 shadow-2xl">
                  <div className="flex justify-between mb-6">
                    <span className="text-slate-400 font-bold uppercase text-xs">Total Amount</span>
                    <span className="text-xl font-black text-white">{cartTotal} Ks</span>
                  </div>
                  <button onClick={() => setView('checkout')} className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                    Proceed to Checkout <ChevronRight size={18}/>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {view === 'checkout' && (
          <div className="p-6 pb-40 overflow-y-auto no-scrollbar">
            <button onClick={() => setView('cart_view')} className="mb-6 bg-[#112240] p-2 rounded-xl"><ArrowLeft size={20}/></button>
            <div className="bg-[#112240] p-6 rounded-[2rem] border border-blue-900/30 text-center mb-8">
              <h3 className="text-lg font-black mb-1 uppercase">Checkout Order</h3>
              <p className="text-blue-500 font-black text-2xl mb-4">{cartTotal} Ks</p>
              <div className="text-[10px] text-slate-400 font-bold bg-black/20 p-4 rounded-2xl text-left border border-blue-900/10">
                <p className="mb-2 text-blue-400 underline">Selected Items:</p>
                {cart.map((i, idx) => <p key={idx}>• {getPProp(i, 'Name')} ({getPProp(i, 'Plan')})</p>)}
              </div>
            </div>

            <textarea rows="4" placeholder="လိုအပ်သော အချက်အလက်များ (ID, Pass, Phone)..." className="w-full bg-[#112240] p-5 rounded-2xl mb-8 text-sm outline-none border border-blue-900/20 focus:border-blue-500 shadow-inner" value={editContact} onChange={e => setEditContact(e.target.value)} />

            <div className="mb-8">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-3 ml-2 tracking-widest">လိုအပ်သော ပုံများတင်ရန် (ရှိလျှင်)</p>
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="aspect-square bg-[#112240] rounded-2xl border-2 border-dashed border-blue-900/20 flex items-center justify-center relative overflow-hidden">
                    {techImages[idx] ? <img src={techImages[idx]} className="w-full h-full object-cover" /> : (
                      <label className="cursor-pointer w-full h-full flex items-center justify-center"><Plus className="text-blue-500/50"/><input type="file" className="hidden" onChange={e => handleImageUpload(e.target.files[0], idx, 'tech')}/></label>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-3 ml-2 tracking-widest">Payment Screenshot (ခြင်းတောင်းတစ်ခုလုံးစာ)</p>
              <div className="w-full aspect-video bg-[#112240] rounded-3xl border-2 border-dashed border-blue-900/30 flex items-center justify-center overflow-hidden relative">
                {payImg ? <img src={payImg} className="w-full h-full object-contain" /> : (
                  <label className="cursor-pointer flex flex-col items-center text-blue-500">
                    <ImageIcon size={32}/><span className="text-[9px] font-black mt-2">UPLOAD RECEIPT</span>
                    <input type="file" className="hidden" onChange={e => handleImageUpload(e.target.files[0], 0, 'pay')}/>
                  </label>
                )}
              </div>
            </div>

            <button onClick={handleOrder} disabled={loading || !payImg} className="w-full bg-blue-600 py-6 rounded-2xl font-black text-white shadow-2xl active:scale-95 transition-all">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : "CONFIRM & PAY"}
            </button>
          </div>
        )}

        {/* --- Admin, History, Profile Views (Remain same logic as before) --- */}
        {view === 'admin_dash' && profile?.role === 'admin' && (
          <div className="p-6 pb-40">
            <h2 className="text-xl font-black mb-8 uppercase tracking-tighter">Admin Panel</h2>
            <div className="flex bg-[#112240] p-1 rounded-xl mb-6">
              <button onClick={() => setAdminTab('orders')} className={`flex-1 py-2 rounded-lg text-[10px] font-black ${adminTab === 'orders' ? 'bg-blue-600' : ''}`}>ORDERS</button>
              <button onClick={() => setAdminTab('members')} className={`flex-1 py-2 rounded-lg text-[10px] font-black ${adminTab === 'members' ? 'bg-blue-600' : ''}`}>USERS</button>
            </div>
            <div className="space-y-4">
              {allOrders.map(o => (
                <div key={o.id} className="bg-[#112240] p-4 rounded-2xl border border-blue-900/10">
                  <p className="text-[10px] font-black uppercase text-blue-500">{o.product}</p>
                  <p className="text-[9px] text-slate-400 mb-2">{o.plan}</p>
                  <p className="text-[10px] text-white bg-black/20 p-2 rounded-lg mb-2">{o.contact}</p>
                  {o.status === 'Pending' && <button onClick={() => updateOrderStatus(o.id, 'Completed', 'Done')} className="bg-blue-600 px-4 py-1 rounded text-[9px] font-black">DONE</button>}
                </div>
              ))}
            </div>
            <BottomNav />
          </div>
        )}

        {view === 'customer_dash' && (
          <div className="p-6 pb-40">
             <h2 className="text-xl font-black mb-8 uppercase tracking-tighter">History</h2>
             <div className="space-y-4">
               {myOrders.map(o => (
                 <div key={o.id} className="bg-[#112240] p-5 rounded-2xl border border-blue-900/20">
                   <p className="text-[11px] font-black uppercase text-white">{o.product}</p>
                   <p className="text-[9px] text-blue-500 font-bold mb-2">{o.price} Ks • {o.status}</p>
                   {o.result && <div className="p-2 bg-green-500/10 text-green-400 text-[10px] rounded-lg">{o.result}</div>}
                 </div>
               ))}
             </div>
             <BottomNav />
          </div>
        )}

        {view === 'order_success' && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in zoom-in">
            <CheckCircle2 size={80} className="text-green-500 mb-6" />
            <h2 className="text-3xl font-black mb-4 uppercase">Success!</h2>
            <p className="text-slate-400 text-sm mb-12">အော်ဒါတင်ခြင်း အောင်မြင်ပါသည်။</p>
            <button onClick={() => setView('customer_dash')} className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white">Go to History</button>
          </div>
        )}

      </div>
    </div>
  );
}
