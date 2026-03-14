import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, setPersistence, browserLocalPersistence, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { ShoppingBag, Gamepad2, Smartphone, ChevronRight, ArrowLeft, CheckCircle2, Loader2, User, ShieldCheck, LogOut, Save, Layers } from 'lucide-react';

// --- CONFIGURATIONS ---
const LOGO_URL = "https://drive.google.com/thumbnail?id=1Lh-nHgyLMSr3rBVe4OGnjEvEspuMokd6&sz=w1000"; 
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyC1MECq8ZNzdj-RxmBaMcFfSqVk9Ijt9uuRW-szeukWuCoNBhywDz0k7W1r5mCvjhR/exec"; 
const ADMIN_EMAILS = ["kohtet107576@gmail.com"]; 

const firebaseConfig = {
  apiKey: "AIzaSyCBWTPAr0xWwpN9ASinAQWK_incw8kD-v4",
  authDomain: "mm-tech-store.firebaseapp.com",
  projectId: "mm-tech-store",
  storageBucket: "mm-tech-store.firebasestorage.app",
  messagingSenderId: "719292118752",
  appId: "1:719292118752:web:5cd87e7bb4d4582884c285"
};

// Initialize Firebase
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
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]); 
  const [allMembers, setAllMembers] = useState([]); 
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [editContact, setEditContact] = useState('');
  const [adminTab, setAdminTab] = useState('orders');
  const [deliveryData, setDeliveryData] = useState({}); // Admin input handling

  // Categories Mapping
  const dynamicCategories = useMemo(() => {
    const uniqueCats = [...new Set(products.map(p => getPProp(p, 'Category')).filter(Boolean))];
    const iconMap = { 'Game': <Gamepad2 size={16}/>, 'Digital product': <Smartphone size={16}/> };
    return uniqueCats.map(cat => ({ id: cat, name: cat, icon: iconMap[cat] || <Layers size={16}/> }));
  }, [products]);

  // Auth Effect
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
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const syncProfile = async (u) => {
    const docRef = doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data');
    const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'members', u.uid);
    try {
      const docSnap = await getDoc(docRef);
      let pData = docSnap.exists() ? docSnap.data() : {
        name: u.displayName || "User",
        email: u.email,
        tier: ADMIN_EMAILS.includes(u.email) ? 'Admin' : 'Standard',
        role: ADMIN_EMAILS.includes(u.email) ? 'admin' : 'user',
        uid: u.uid,
        photoURL: u.photoURL,
        createdAt: new Date().toISOString()
      };
      if (ADMIN_EMAILS.includes(u.email)) pData.role = 'admin';
      await setDoc(docRef, pData, { merge: true });
      await setDoc(memberRef, pData, { merge: true });
      setProfile(pData);
    } catch (e) { console.error("Sync Error:", e); }
  };

  const handleLogin = async () => { 
    try { await signInWithPopup(auth, googleProvider); } 
    catch (e) { console.error("Login Error:", e); alert("Login failed!"); } 
  };

  // Fetch Products from Google Sheet
  useEffect(() => {
    fetch(SCRIPT_URL)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setProducts(data); })
      .catch(e => console.error("Fetch Products Error:", e));
  }, []);

  // Real-time Orders Listener
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderBy('timestamp', 'desc'));
    const unsubOrders = onSnapshot(q, (sn) => {
      const docs = sn.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllOrders(docs);
      setMyOrders(docs.filter(o => o.userId === user.uid));
    });
    return () => unsubOrders();
  }, [user]);

  // Real-time Members (Admin Only)
  useEffect(() => {
    if (profile?.role === 'admin') {
      const unsubMembers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'members'), (sn) => {
        setAllMembers(sn.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsubMembers();
    }
  }, [profile]);

  // Admin Handlers
  const updateTier = async (userId, newTier) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'profile', 'data'), { tier: newTier });
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', userId), { tier: newTier });
      alert(`User tier updated to ${newTier}`);
    } catch (e) { console.error(e); }
  };

  const updateStatus = async (orderId, newStatus, resultData = "") => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId), { 
        status: newStatus, 
        result: resultData 
      });
      alert("Order Updated Successfully!");
    } catch (e) { console.error(e); }
  };

  // Ordering Logic
  const getDisplayPrice = (plan) => {
    const tier = profile?.tier || 'Standard';
    return getPProp(plan, `Price_${tier}`) || getPProp(plan, 'Price');
  };

  const handleOrder = async () => {
    const finalContact = editContact || profile?.contact;
    if (!finalContact) { alert("Please enter your contact info!"); return; }

    setLoading(true);
    const orderData = {
      userId: user.uid,
      userName: profile?.name,
      product: getPProp(selectedPlan, 'Name'),
      plan: getPProp(selectedPlan, 'Plan'),
      price: getDisplayPrice(selectedPlan),
      contact: finalContact,
      status: 'Pending',
      timestamp: Date.now(),
      date: new Date().toLocaleString('en-GB')
    };

    try {
      // 1. Save to Firebase
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderData);
      
      // 2. Sync to Google Sheet (Async)
      fetch(SCRIPT_URL, { 
        method: 'POST', 
        mode: 'no-cors', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData) 
      });

      setView('order_success');
    } catch (e) { 
      console.error("Order Error:", e); 
      alert("Order failed! Please try again.");
    } finally { setLoading(false); }
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

  // --- UI COMPONENTS ---
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
        {myOrders.filter(o => o.status === 'Pending').length > 0 && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </button>
    </div>
  );

  const BottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a192f]/95 backdrop-blur-md border-t border-blue-900/20 p-5 flex justify-around items-center z-50 max-w-md mx-auto rounded-t-[2rem]">
      <button onClick={() => setView('home')} className={view === 'home' ? 'text-blue-500' : 'text-slate-500'}><Gamepad2 size={24}/></button>
      <button onClick={() => setView('customer_dash')} className={view === 'customer_dash' ? 'text-blue-500' : 'text-slate-500'}><HistoryIcon /></button>
      {profile?.role === 'admin' && <button onClick={() => setView('admin_dash')} className={view === 'admin_dash' ? 'text-blue-500' : 'text-slate-500'}><ShieldCheck size={24}/></button>}
      <button onClick={() => setView('profile')} className={view === 'profile' ? 'text-blue-500' : 'text-slate-500'}><User size={24}/></button>
    </nav>
  );

  const HistoryIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
  );

  if (loading || view === 'initializing') return <div className="min-h-screen bg-[#0a192f] flex flex-col items-center justify-center text-white"><Loader2 className="animate-spin text-blue-500" size={40}/></div>;

  return (
    <div className="bg-[#050d1a] min-h-screen text-white font-sans selection:bg-blue-500/30">
      <div className="max-w-md mx-auto w-full min-h-screen flex flex-col relative bg-[#0a192f] border-x border-blue-900/10 shadow-2xl">
        
        {view === 'welcome' && (
          <div className="flex flex-col flex-1 items-center justify-center p-10 text-center bg-gradient-to-b from-[#0a192f] to-[#050d1a]">
            <div className="w-32 h-32 bg-[#112240] rounded-[2.5rem] border border-blue-500/20 mb-8 flex items-center justify-center overflow-hidden p-2 shadow-blue-500/10 shadow-2xl">
              <img src={formatImg(LOGO_URL)} className="w-full h-full object-contain" alt="L" />
            </div>
            <h1 className="text-4xl font-black mb-2 tracking-tighter">MM TECH</h1>
            <p className="text-slate-400 text-sm mb-12">Premium Digital Services & Top-ups</p>
            <button onClick={handleLogin} className="w-full bg-white text-black py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all">Login with Google</button>
          </div>
        )}

        {view === 'home' && (
          <>
            <MainHeader />
            <div className="p-6 pb-40">
              <div className="mb-8">
                <h1 className="text-3xl font-black mb-1">Store</h1>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Select Category</p>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-6 no-scrollbar">
                <button onClick={() => setSelectedCat(null)} className={`px-6 py-2.5 rounded-full text-[10px] font-black border transition-all ${!selectedCat ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-600/20' : 'bg-[#112240] border-blue-900/20 text-slate-400'}`}>ALL</button>
                {dynamicCategories.map(c => (
                  <button key={c.id} onClick={() => setSelectedCat(c.id)} className={`px-6 py-2.5 rounded-full text-[10px] font-black border transition-all whitespace-nowrap ${selectedCat === c.id ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-600/20' : 'bg-[#112240] border-blue-900/20 text-slate-400'}`}>{c.name.toUpperCase()}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {groupedProducts.filter(g => !selectedCat || g.category === selectedCat).map(group => (
                  <div key={group.name} onClick={() => { setSelectedGroup(group); setView('group_details'); }} className="bg-[#112240]/40 p-3 rounded-3xl border border-blue-900/10 hover:border-blue-500/30 transition-all active:scale-95">
                    <div className="aspect-square bg-[#0a192f] rounded-2xl overflow-hidden mb-3 border border-blue-900/20">
                      <img src={formatImg(group.image)} className="w-full h-full object-cover" alt="I" />
                    </div>
                    <h4 className="text-[11px] font-black truncate px-1 uppercase tracking-tight">{group.name}</h4>
                  </div>
                ))}
              </div>
            </div>
            <BottomNav />
          </>
        )}

        {view === 'group_details' && (
          <div className="flex flex-col flex-1 pb-40">
            <MainHeader />
            <div className="p-6">
              <button onClick={() => setView('home')} className="p-3 bg-[#112240] rounded-2xl text-white mb-6 border border-blue-900/20"><ArrowLeft size={20}/></button>
              <h2 className="text-2xl font-black mb-8 px-2 tracking-tight">{selectedGroup?.name}</h2>
              <div className="space-y-3">
                {selectedGroup?.plans.map((p, i) => (
                  <button key={i} onClick={() => { setSelectedPlan(p); setView('checkout'); }} className="w-full bg-[#112240] p-5 rounded-[2rem] border border-blue-900/20 flex items-center justify-between hover:border-blue-500/40 active:scale-[0.98] transition-all">
                    <div className="text-left">
                      <h4 className="text-[13px] font-black text-slate-200">{getPProp(p, 'Plan')}</h4>
                      <p className="text-blue-500 font-black text-md">{getDisplayPrice(p)} Ks</p>
                    </div>
                    <div className="w-10 h-10 bg-[#0a192f] rounded-full flex items-center justify-center"><ChevronRight size={18} className="text-blue-500" /></div>
                  </button>
                ))}
              </div>
            </div>
            <BottomNav />
          </div>
        )}

        {view === 'checkout' && (
          <div className="p-8 flex flex-col flex-1 pb-40">
            <MainHeader />
            <button onClick={() => setView('group_details')} className="w-12 h-12 bg-[#112240] rounded-2xl flex items-center justify-center mb-8 text-white border border-blue-900/20"><ArrowLeft size={20}/></button>
            <div className="bg-[#112240] p-10 rounded-[3.5rem] text-center mb-8 border border-blue-500/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <img src={formatImg(getPProp(selectedPlan, 'Link'))} className="w-24 h-24 mx-auto mb-6 rounded-[2rem] object-cover shadow-2xl border-2 border-blue-500/20" alt="I"/>
              <h3 className="text-2xl font-black tracking-tighter">{getPProp(selectedPlan, 'Name')}</h3>
              <p className="text-blue-400 font-black mb-4 uppercase text-[10px] tracking-widest">{getPProp(selectedPlan, 'Plan')}</p>
              <div className="text-4xl font-black text-white">{getDisplayPrice(selectedPlan)} <span className="text-sm text-slate-500">Ks</span></div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Delivery Details</label>
              <input 
                type="text" 
                placeholder="Telegram Username or Phone Number" 
                className="w-full bg-[#112240] border border-blue-900/30 p-5 rounded-2xl text-white outline-none focus:border-blue-500 transition-all shadow-inner" 
                value={editContact || profile?.contact || ''} 
                onChange={e => setEditContact(e.target.value)} 
              />
              <button onClick={handleOrder} className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-2xl font-black text-white shadow-lg shadow-blue-600/30 active:scale-95 transition-all mt-4">CONFIRM ORDER</button>
            </div>
            <BottomNav />
          </div>
        )}

        {view === 'order_success' && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-8 animate-bounce">
              <CheckCircle2 size={60} className="text-green-500" />
            </div>
            <h2 className="text-3xl font-black mb-4 tracking-tighter">ORDER PLACED!</h2>
            <p className="text-slate-400 text-sm mb-12">Admin will process your order soon. Check history for updates.</p>
            <button onClick={() => setView('customer_dash')} className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white shadow-xl">VIEW HISTORY</button>
          </div>
        )}

        {view === 'admin_dash' && (
          <div className="p-8 flex flex-col flex-1 pb-40">
            <MainHeader />
            <div className="flex justify-between items-center mb-8 mt-4">
              <h2 className="text-2xl font-black tracking-tight">Console</h2>
              <div className="flex bg-[#112240] p-1 rounded-2xl border border-blue-900/20">
                <button onClick={() => setAdminTab('orders')} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${adminTab === 'orders' ? 'bg-blue-600 shadow-lg' : 'text-slate-500'}`}>ORDERS</button>
                <button onClick={() => setAdminTab('members')} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${adminTab === 'members' ? 'bg-blue-600 shadow-lg' : 'text-slate-500'}`}>USERS</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {adminTab === 'orders' ? (
                <div className="space-y-4">
                  {allOrders.map(o => (
                    <div key={o.id} className="bg-[#112240] p-6 rounded-[2.5rem] border border-blue-900/30">
                      <div className="flex justify-between items-start mb-4">
                        <div className="max-w-[70%]">
                          <h4 className="font-black text-sm truncate">{o.product}</h4>
                          <p className="text-[10px] text-blue-500 font-bold uppercase">{o.plan} • {o.price} Ks</p>
                          <p className="text-[10px] text-slate-500 mt-1 font-medium">{o.userName} ({o.contact})</p>
                        </div>
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${o.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{o.status}</span>
                      </div>
                      {o.status === 'Pending' && (
                        <div className="mt-4 space-y-3">
                          <input 
                            type="text" 
                            placeholder="Deliver Code or Details..." 
                            className="w-full bg-[#0a192f] p-4 rounded-2xl text-xs text-white outline-none border border-blue-900/30"
                            value={deliveryData[o.id] || ''}
                            onChange={(e) => setDeliveryData({...deliveryData, [o.id]: e.target.value})}
                          />
                          <button 
                            onClick={() => { if(deliveryData[o.id]) updateStatus(o.id, 'Completed', deliveryData[o.id]); }} 
                            className="w-full bg-blue-600 py-4 rounded-2xl font-black text-xs text-white active:scale-95 transition-all"
                          >
                            DELIVER NOW
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {allMembers.map(m => (
                    <div key={m.uid} className="bg-[#112240] p-5 rounded-[2rem] flex flex-col gap-4 border border-blue-900/10">
                      <div className="flex items-center gap-4">
                        <img src={m.photoURL || LOGO_URL} className="w-12 h-12 rounded-2xl" alt="U"/>
                        <div className="flex-1">
                          <h4 className="font-black text-sm">{m.name}</h4>
                          <p className="text-[9px] text-blue-500 uppercase font-black tracking-widest">{m.tier}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {['Standard', 'VIP', 'Reseller'].map(t => (
                          <button key={t} onClick={() => updateTier(m.uid, t)} className={`flex-1 py-2.5 rounded-xl text-[8px] font-black transition-all ${m.tier === t ? 'bg-blue-600' : 'bg-[#0a192f] text-slate-500'}`}>{t.toUpperCase()}</button>
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

        {view === 'customer_dash' && (
          <div className="p-8 flex flex-col flex-1 pb-40">
            <MainHeader />
            <div className="mt-4 mb-8">
               <h2 className="text-3xl font-black mb-1">History</h2>
               <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Your Orders</p>
            </div>
            <div className="space-y-4 overflow-y-auto no-scrollbar">
              {myOrders.length === 0 ? (
                <div className="text-center py-20 text-slate-600 font-bold">No orders yet.</div>
              ) : myOrders.map(o => (
                <div key={o.id} className="bg-[#112240] p-6 rounded-[2.5rem] border border-blue-900/30 shadow-xl">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-black text-sm uppercase tracking-tight">{o.product}</h4>
                      <p className="text-blue-500 text-[10px] font-black tracking-widest">{o.plan} • {o.price} Ks</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${o.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{o.status}</span>
                  </div>
                  {o.status === 'Completed' && o.result && (
                    <div className="bg-blue-600/10 p-4 rounded-2xl flex items-center justify-between gap-3 mt-4 border border-blue-500/10">
                      <code className="text-[11px] font-bold text-blue-200 break-all">{o.result}</code>
                      <button onClick={() => { navigator.clipboard.writeText(o.result); alert("Copied to clipboard!"); }} className="bg-blue-600 p-2.5 rounded-xl text-white active:scale-90 transition-all"><Save size={14}/></button>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-[9px] text-slate-500 font-medium">{o.date}</p>
                    <p className="text-[9px] text-slate-600 font-bold">ID: {o.id.slice(-6)}</p>
                  </div>
                </div>
              ))}
            </div>
            <BottomNav />
          </div>
        )}

        {view === 'profile' && (
          <div className="p-10 flex flex-col flex-1 items-center justify-center pb-40">
            <MainHeader />
            {user ? (
              <div className="w-full flex flex-col items-center">
                <div className="relative mb-8">
                  <img src={user.photoURL} className="w-28 h-28 rounded-[3rem] border-4 border-blue-600 p-1.5 shadow-2xl shadow-blue-600/20" alt="U"/>
                  <div className="absolute -bottom-2 -right-2 bg-blue-600 p-2 rounded-2xl border-4 border-[#0a192f]">
                    <ShieldCheck size={20} className="text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-black mb-1 tracking-tighter">{profile?.name}</h2>
                <p className="text-slate-500 text-sm font-bold mb-10">{user.email}</p>
                
                <div className="bg-[#112240] w-full p-8 rounded-[3rem] border border-blue-900/30 text-left mb-10 shadow-2xl">
                  <div className="flex justify-between py-5 border-b border-blue-900/20">
                    <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Account Tier</span>
                    <span className="text-blue-500 text-xs font-black uppercase tracking-widest">{profile?.tier}</span>
                  </div>
                  <div className="flex justify-between py-5">
                    <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Contact</span>
                    <span className="text-white text-xs font-black">{profile?.contact || 'NOT SET'}</span>
                  </div>
                </div>
                
                <button onClick={() => signOut(auth)} className="w-full bg-red-500/10 text-red-500 py-4 rounded-2xl text-xs font-black flex items-center justify-center gap-3 active:scale-95 transition-all border border-red-500/20">
                  <LogOut size={18}/> SIGN OUT
                </button>
              </div>
            ) : (
              <button onClick={handleLogin} className="bg-white text-black px-12 py-4 rounded-2xl font-black shadow-xl">LOGIN</button>
            )}
            <BottomNav />
          </div>
        )}
      </div>
    </div>
  );
}
