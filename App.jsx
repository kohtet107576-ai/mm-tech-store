import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged,
  setPersistence, browserLocalPersistence, signOut 
} from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, updateDoc 
} from 'firebase/firestore';
import { 
  ShoppingBag, Gamepad2, Smartphone, BookOpen, Settings, History, 
  ChevronRight, ArrowLeft, CheckCircle2, Search, Loader2, User, 
  ShieldCheck, LogOut, Send, BadgeCheck, Clock, Edit3, Save, X, Layers
} from 'lucide-react';

// --- (၁) CONFIGURATION ---
const LOGO_URL = "https://drive.google.com/thumbnail?id=1Lh-nHgyLMSr3rBVe4OGnjEvEspuMokd6&sz=w1000"; 
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyC1MECq8ZNzdj-RxmBaMcFfSqVk9Ijt9uuRW-szeukWuCoNBhywDz0k7W1r5mCvjhR/exec"; 
const ADMIN_EMAILS = ["kohtet107576@gmail.com"]; 

const firebaseConfig = {
  apiKey: "AIzaSyCBWTPAr0xWwpN9ASinAQWK_incw8kD-v4",
  authDomain: "mm-tech-store.firebaseapp.com",
  projectId: "mm-tech-store",
  storageBucket: "mm-tech-store.firebasestorage.app",
  messagingSenderId: "719292118752",
  appId: "1:719292118752:web:5cd87e7bb4d4582884c285",
  measurementId: "G-HTJFLBCRDP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const appId = "mm-tech-store"; 

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
  const [searchQuery, setSearchQuery] = useState('');
  const [editContact, setEditContact] = useState('');
  const [adminTab, setAdminTab] = useState('orders');

  const dynamicCategories = useMemo(() => {
    const uniqueCats = [...new Set(products.map(p => getPProp(p, 'Category')).filter(Boolean))];
    const iconMap = { 'Game': <Gamepad2 size={16}/>, 'Digital product': <Smartphone size={16}/>, 'Online class': <BookOpen size={16}/>, 'Gsm reseller': <Settings size={16}/> };
    return uniqueCats.map(cat => ({ id: cat, name: cat, icon: iconMap[cat] || <Layers size={16}/> }));
  }, [products]);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence);
    const unsubscribe = onAuthStateChanged(auth, async (currUser) => {
      if (currUser) {
        setUser(currUser);
        await syncProfile(currUser);
        setView('home');
      } else {
        setUser(null); setProfile(null); setView('welcome');
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
      let currentProfile;
      const isAdmin = ADMIN_EMAILS.includes(u.email);
      if (docSnap.exists()) {
        currentProfile = docSnap.data();
        if (isAdmin) currentProfile.role = 'admin';
      } else {
        currentProfile = {
          name: u.displayName || "User", email: u.email, tier: isAdmin ? 'Admin' : 'Standard',
          role: isAdmin ? 'admin' : 'user', uid: u.uid, photoURL: u.photoURL, createdAt: new Date().toISOString()
        };
      }
      await setDoc(docRef, currentProfile, { merge: true });
      await setDoc(memberRef, currentProfile, { merge: true });
      setProfile(currentProfile);
    } catch (e) { console.error(e); }
  };

  const handleLogin = async () => {
    try { setLoading(true); await signInWithPopup(auth, googleProvider); } 
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetch(SCRIPT_URL).then(res => res.json()).then(data => { if (Array.isArray(data)) setProducts(data); });
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubOrders = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), (sn) => {
      const docs = sn.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.timestamp - a.timestamp);
      setAllOrders(docs); setMyOrders(docs.filter(o => o.userId === user.uid));
    });
    if (profile?.role === 'admin') {
      const unsubMembers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'members'), (sn) => {
        setAllMembers(sn.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => { unsubOrders(); unsubMembers(); };
    }
    return () => unsubOrders();
  }, [user, profile]);

  const updateTier = async (userId, newTier) => {
    try {
      const userDocRef = doc(db, 'artifacts', appId, 'users', userId, 'profile', 'data');
      const memberDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'members', userId);
      await updateDoc(userDocRef, { tier: newTier });
      await updateDoc(memberDocRef, { tier: newTier });
      alert(`User tier updated to ${newTier}`);
    } catch (e) { console.error(e); }
  };

  const getDisplayPrice = (plan) => {
    const userTier = profile?.tier || 'Standard';
    if (userTier === 'VIP') return getPProp(plan, 'Price_VIP') || getPProp(plan, 'Price');
    if (userTier === 'Reseller') return getPProp(plan, 'Price_Reseller') || getPProp(plan, 'Price');
    return getPProp(plan, 'Price');
  };

  const updateStatus = async (orderId, newStatus, resultData = "") => {
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId);
      await updateDoc(docRef, { status: newStatus, result: resultData });
      alert("Order Updated Successfully!");
    } catch (e) { console.error(e); }
  };

  const handleOrder = async () => {
    if (!editContact && !profile?.contact) return;
    setLoading(true);
    const orderData = {
      userId: user.uid, userName: profile?.name, product: getPProp(selectedPlan, 'Name'),
      plan: getPProp(selectedPlan, 'Plan'), price: getDisplayPrice(selectedPlan),
      contact: editContact || profile?.contact, status: 'Pending', timestamp: Date.now(),
      date: new Date().toLocaleString('en-GB')
    };
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderData);
      fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(orderData) });
      setView('order_success');
    } catch (e) { console.error(e); } finally { setLoading(false); }
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
    <div className="flex items-center justify-between p-4 lg:px-8 bg-[#0a192f] border-b border-blue-900/20 sticky top-0 z-40 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-lg border border-blue-500/30 overflow-hidden bg-[#112240] flex items-center justify-center">
          <img src={formatImg(LOGO_URL)} className="w-full h-full object-contain" alt="Logo" />
        </div>
        <h2 className="text-md font-black text-white uppercase tracking-tighter">MM Tech</h2>
      </div>
      <div className="flex items-center gap-4">
        <a href="https://t.me/mmtech19" target="_blank" rel="noreferrer" className="text-[10px] font-black text-slate-500 uppercase">Chat</a>
        <button className="text-white"><ShoppingBag size={20}/></button>
      </div>
    </div>
  );

  const BottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a192f]/95 backdrop-blur-xl border-t border-blue-900/20 p-5 flex justify-around items-center z-50 rounded-t-[2.5rem] max-w-md mx-auto shadow-2xl">
      <button onClick={() => setView('home')} className={view === 'home' ? 'text-blue-500' : 'text-slate-500'}><ShoppingBag size={24}/></button>
      <button onClick={() => setView('customer_dash')} className={view === 'customer_dash' ? 'text-blue-500' : 'text-slate-500'}><History size={24}/></button>
      {profile?.role === 'admin' && <button onClick={() => setView('admin_dash')} className={view === 'admin_dash' ? 'text-blue-500' : 'text-slate-500'}><ShieldCheck size={24}/></button>}
      <button onClick={() => setView('profile')} className={view === 'profile' ? 'text-blue-500' : 'text-slate-500'}><User size={24}/></button>
    </nav>
  );

  if (loading || view === 'initializing') return <div className="min-h-screen bg-[#0a192f] flex flex-col items-center justify-center text-white"><Loader2 className="animate-spin text-blue-500" size={40}/><p className="mt-4 text-[10px] font-black">Loading...</p></div>;

  return (
    <div className="bg-[#050d1a] min-h-screen text-white font-sans">
      <div className="max-w-md mx-auto w-full min-h-screen flex flex-col relative bg-[#0a192f] border-x border-blue-900/10">
        
        {view === 'welcome' && (
          <div className="flex flex-col flex-1 items-center justify-center py-20 px-10 text-center animate-in fade-in duration-500">
            <div className="w-32 h-32 bg-[#112240] rounded-[2.5rem] border border-blue-500/20 shadow-2xl mb-8 flex items-center justify-center overflow-hidden p-2">
              <img src={formatImg(LOGO_URL)} className="w-full h-full object-contain" alt="L" />
            </div>
            <h1 className="text-4xl font-black mb-4">MM Tech</h1>
            <button onClick={handleLogin} className="w-full max-w-xs bg-white text-black py-4 rounded-2xl font-black shadow-xl flex items-center justify-center gap-3"><img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="G"/> Login with Google</button>
          </div>
        )}

        {view === 'home' && (
          <>
            <MainHeader />
            <div className="p-6 pb-40 text-left">
              <h1 className="text-3xl font-black mb-6">Store</h1>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6">
                <button onClick={() => setSelectedCat(null)} className={`px-5 py-2.5 rounded-full text-[11px] font-black border ${!selectedCat ? 'bg-blue-600 border-blue-500' : 'bg-[#112240] border-blue-900/30'}`}>All</button>
                {dynamicCategories.map(c => (
                  <button key={c.id} onClick={() => setSelectedCat(c.id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-black border ${selectedCat === c.id ? 'bg-blue-600 border-blue-500' : 'bg-[#112240] border-blue-900/30'}`}>{c.icon}{c.name}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {groupedProducts.filter(g => (!selectedCat || g.category === selectedCat) && (searchQuery === '' || g.name.toLowerCase().includes(searchQuery.toLowerCase()))).map(group => (
                  <div key={group.name} onClick={() => { setSelectedGroup(group); setView('group_details'); }} className="bg-[#112240]/40 p-3 rounded-2xl border border-blue-900/10 active:scale-95 transition-all">
                    <div className="aspect-square bg-[#0a192f] rounded-xl overflow-hidden mb-3"><img src={formatImg(group.image)} className="w-full h-full object-cover" alt="I" /></div>
                    <h4 className="text-[11px] font-black truncate text-white">{group.name}</h4>
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
            <div className="p-6"><button onClick={() => setView('home')} className="p-2 bg-[#112240] rounded-xl text-white mb-4"><ArrowLeft size={20}/></button>
              <h2 className="text-2xl font-black mb-6">{selectedGroup?.name}</h2>
              <div className="space-y-3">
                {selectedGroup?.plans.map((p, i) => (
                  <button key={i} onClick={() => { setSelectedPlan(p); setView('checkout'); }} className="w-full bg-[#112240] p-5 rounded-3xl border border-blue-900/20 flex items-center justify-between">
                    <div><h4 className="text-sm font-black text-white">{getPProp(p, 'Plan')}</h4><p className="text-blue-500 font-black">{getDisplayPrice(p)} Ks</p></div>
                    <ChevronRight size={20} className="text-slate-600" />
                  </button>
                ))}
              </div>
            </div>
            <BottomNav />
          </div>
        )}

        {view === 'checkout' && (
          <div className="p-8 flex flex-col flex-1 pb-40 text-left">
            <MainHeader />
            <button onClick={() => setView('group_details')} className="w-10 h-10 bg-[#112240] rounded-xl flex items-center justify-center mb-8 text-white"><ArrowLeft size={20}/></button>
            <div className="bg-[#112240] p-10 rounded-[3rem] border border-blue-900/30 text-center mb-8 shadow-2xl">
              <img src={formatImg(getPProp(selectedPlan, 'Link'))} className="w-24 h-24 mx-auto mb-6 rounded-3xl object-cover border-4 border-blue-600/20" alt="I"/>
              <h3 className="text-2xl font-black mb-1">{getPProp(selectedPlan, 'Name')}</h3>
              <p className="text-blue-400 font-bold mb-4 uppercase text-xs">{getPProp(selectedPlan, 'Plan')}</p>
              <div className="text-3xl font-black bg-[#0a192f]/50 py-4 rounded-2xl">{getDisplayPrice(selectedPlan)} Ks</div>
            </div>
            <input type="text" placeholder="Telegram @ID / Phone" className="w-full bg-[#112240] border border-blue-900/30 p-5 rounded-2xl text-white outline-none focus:border-blue-500 mb-8" value={editContact || profile?.contact || ''} onChange={e => setEditContact(e.target.value)} />
            <button onClick={handleOrder} disabled={loading || (!editContact && !profile?.contact)} className="w-full bg-blue-600 py-5 rounded-2xl font-black shadow-xl active:scale-95 text-white flex items-center justify-center gap-3">
              {loading ? <Loader2 className="animate-spin" /> : <><Send size={20}/> Confirm Now</>}
            </button>
            <BottomNav />
          </div>
        )}

        {view === 'order_success' && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-8 border border-green-500/20"><CheckCircle2 size={50} className="text-green-500" /></div>
            <h2 className="text-3xl font-black mb-4">SUCCESS!</h2>
            <button onClick={() => setView('customer_dash')} className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white">View History</button>
          </div>
        )}

        {view === 'admin_dash' && (
          <div className="p-8 flex flex-col flex-1 pb-40 text-left">
            <MainHeader />
            <div className="flex justify-between items-center mb-10 mt-4">
              <h2 className="text-3xl font-black text-white">Admin</h2>
              <div className="flex bg-[#112240] p-1 rounded-xl">
                <button onClick={() => setAdminTab('orders')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase ${adminTab === 'orders' ? 'bg-blue-600' : 'text-slate-500'}`}>Orders</button>
                <button onClick={() => setAdminTab('members')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase ${adminTab === 'members' ? 'bg-blue-600' : 'text-slate-500'}`}>Users</button>
              </div>
            </div>
            <div className="flex-1">
              {adminTab === 'orders' ? (
                <div className="space-y-4">
                  {allOrders.map(o => (
                    <div key={o.id} className="bg-[#112240] p-6 rounded-[2rem] border border-blue-900/30 text-left">
                      <div className="flex justify-between items-start mb-4">
                        <div><h4 className="font-black text-white text-sm">{o.product}</h4><p className="text-xs text-blue-500">{o.plan} - {o.price} Ks</p></div>
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${o.status === 'Completed' ? 'text-green-500 bg-green-500/10' : 'text-yellow-500 bg-yellow-500/10'}`}>{o.status}</span>
                      </div>
                      {o.status === 'Pending' && (
                        <div className="mt-4 space-y-3">
                          <input type="text" id={`result-${o.id}`} placeholder="Enter Code/Gmail" className="w-full bg-[#0a192f] p-4 rounded-2xl text-xs text-white outline-none border border-blue-900/30" />
                          <button onClick={() => { const v = document.getElementById(`result-${o.id}`).value; if(!v) return; updateStatus(o.id, 'Completed', v); }} className="w-full bg-blue-600 py-4 rounded-2xl font-black text-xs text-white">Deliver & Done</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {allMembers.map(m => (
                    <div key={m.uid} className="bg-[#112240] p-5 rounded-3xl flex flex-col gap-4 text-left">
                      <div className="flex items-center gap-4">
                        <img src={m.photoURL || LOGO_URL} className="w-12 h-12 rounded-2xl object-cover" alt="U"/><div className="flex-1"><h4 className="font-black text-sm text-white">{m.name}</h4><p className="text-[10px] text-blue-500 uppercase">{m.tier || 'Standard'}</p></div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => updateTier(m.uid, 'Standard')} className="flex-1 bg-slate-800 py-2 rounded-xl text-[9px] font-black">Standard</button>
                        <button onClick={() => updateTier(m.uid, 'VIP')} className="flex-1 bg-yellow-600/20 py-2 rounded-xl text-[9px] font-black text-yellow-500">VIP</button>
                        <button onClick={() => updateTier(m.uid, 'Reseller')} className="flex-1 bg-blue-600/20 py-2 rounded-xl text-[9px] font-black text-blue-400">Reseller</button>
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
          <div className="p-8 flex flex-col flex-1 pb-40 text-left">
            <MainHeader />
            <h2 className="text-3xl font-black mb-6 mt-4">History</h2>
            <div className="space-y-4">
              {myOrders.map(o => (
                <div key={o.id} className="bg-[#112240] p-6 rounded-[2rem] border border-blue-900/30 shadow-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div><h4 className="font-black text-sm text-white">{o.product}</h4><p className="text-blue-500 text-[10px] font-black">{o.plan} • {o.price} Ks</p></div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${o.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{o.status}</span>
                  </div>
                  {o.status === 'Completed' && o.result && (
                    <div className="bg-blue-600/10 p-4 rounded-2xl flex items-center justify-between gap-3 mt-2">
                      <code className="text-[12px] font-mono font-bold text-white break-all">{o.result}</code>
                      <button onClick={() => { navigator.clipboard.writeText(o.result); alert("Copied!"); }} className="bg-blue-600 p-2.5 rounded-xl text-white shrink-0"><Save size={14}/></button>
                    </div>
                  )}
                </div>
              ))}
              {myOrders.length === 0 && <div className="py-20 text-center opacity-30 italic text-sm text-white">မှတ်တမ်းမရှိသေးပါ</div>}
            </div>
            <BottomNav />
          </div>
        )}

        {view === 'profile' && (
          <div className="p-10 flex flex-col flex-1 items-center justify-center pb-40 text-center">
            <MainHeader />
            {user ? (
              <div className="w-full max-w-sm flex flex-col items-center">
                <div className="relative mb-8"><img src={user.photoURL} className="w-28 h-28 rounded-[2.5rem] border-4 border-blue-600 p-1" alt="U"/></div>
                <h2 className="text-3xl font-black mb-1 text-white">{profile?.name}</h2>
                <div className="bg-[#112240] w-full p-8 rounded-[3rem] border border-blue-900/30 text-left mb-10 mt-4">
                  <div className="flex justify-between py-4 border-b border-blue-900/10 text-xs text-white"><span className="text-slate-400 uppercase font-black">Tier</span><span className="text-blue-500 font-black">{profile?.tier}</span></div>
                  <div className="flex justify-between py-4 text-xs text-white"><span className="text-slate-400 uppercase font-black">Contact</span><span className="font-bold">{profile?.contact || 'Not Set'}</span></div>
                </div>
                <button onClick={() => signOut(auth)} className="text-red-500 text-xs font-black uppercase flex items-center gap-3"><LogOut size={20}/> Sign Out</button>
              </div>
            ) : (
              <button onClick={handleLogin} className="bg-white text-black px-10 py-4 rounded-2xl font-black text-lg">Login with Google</button>
            )}
            <BottomNav />
          </div>
        )}
      </div>
    </div>
  );
}
