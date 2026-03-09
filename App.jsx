import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  onSnapshot, 
  updateDoc 
} from 'firebase/firestore';

import { 
  ShoppingBag, Gamepad2, Smartphone, BookOpen, Settings, 
  History, ChevronRight, ArrowLeft, CheckCircle2, Search, 
  Loader2, Star, RefreshCw, User, ShieldCheck, LogOut, Send,
  BadgeCheck, Clock, Edit3, Save, X
} from 'lucide-react';

// --- (၁) FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyCBWTPAr0xWwpN9ASinAQWK_incw8kD-v4",
  authDomain: "mm-tech-store.firebaseapp.com",
  projectId: "mm-tech-store",
  storageBucket: "mm-tech-store.firebasestorage.app",
  messagingSenderId: "719292118752",
  appId: "1:719292118752:web:5cd87e7bb4d4582884c285",
  measurementId: "G-HTJFLBCRDP"
};

// Initialize Firebase Services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const appId = "mm-tech-store"; 

// --- CONFIGURATION ---
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyC1MECq8ZNzdj-RxmBaMcFfSqVk9Ijt9uuRW-szeukWuCoNBhywDz0k7W1r5mCvjhR/exec"; 
const ADMIN_EMAILS = ["kohtet107576@gmail.com"]; 

export default function App() {
  const [view, setView] = useState('welcome');
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
  const [contactInfo, setContactInfo] = useState('');
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editContact, setEditContact] = useState('');
  const [adminTab, setAdminTab] = useState('orders');

  const categories = [
    { id: 'Game', name: 'Game', icon: <Gamepad2 size={20} /> },
    { id: 'Digital product', name: 'Digital Product', icon: <Smartphone size={20} /> },
    { id: 'Online class', name: 'Online Class', icon: <BookOpen size={20} /> },
    { id: 'Gsm reseller', name: 'GSM Reseller', icon: <Settings size={20} /> }
  ];

  // --- (၂) AUTHENTICATION & PROFILE SYNC ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currUser) => {
      if (currUser) {
        setUser(currUser);
        await syncProfile(currUser);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const syncProfile = async (u) => {
    const docRef = doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data');
    try {
      const docSnap = await getDoc(docRef);
      let currentProfile;
      if (docSnap.exists()) {
        currentProfile = docSnap.data();
      } else {
        currentProfile = {
          name: u.displayName || "User",
          email: u.email,
          tier: 'Standard', 
          role: ADMIN_EMAILS.includes(u.email) ? 'admin' : 'user',
          uid: u.uid,
          contact: '',
          photoURL: u.photoURL,
          createdAt: new Date().toISOString()
        };
        await setDoc(docRef, currentProfile);
      }

      const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'members', u.uid);
      await setDoc(memberRef, currentProfile, { merge: true });
      
      setProfile(currentProfile);
      setEditName(currentProfile.name);
      setEditContact(currentProfile.contact || '');
      setContactInfo(currentProfile.contact || '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setView('home');
    } catch (e) { console.error(e); }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    const updatedData = { ...profile, name: editName, contact: editContact };
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), updatedData);
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', user.uid), updatedData);
      setProfile(updatedData);
      setContactInfo(editContact);
      setIsEditingProfile(false);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // --- (၃) DATA FETCHING ---
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        if (Array.isArray(data)) setProducts(data);
      } catch (e) { console.error(e); }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!user) return;
    const qOrders = collection(db, 'artifacts', appId, 'public', 'data', 'orders');
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const sorted = docs.sort((a, b) => b.timestamp - a.timestamp);
      setAllOrders(sorted);
      setMyOrders(sorted.filter(o => o.userId === user.uid));
    });

    let unsubMembers = () => {};
    if (profile?.role === 'admin') {
      const qMembers = collection(db, 'artifacts', appId, 'public', 'data', 'members');
      unsubMembers = onSnapshot(qMembers, (snapshot) => {
        setAllMembers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
    return () => { unsubOrders(); unsubMembers(); };
  }, [user, profile]);

  // --- (၄) ORDER LOGIC ---
  const handleOrder = async () => {
    if (!contactInfo || !user) return;
    setLoading(true);
    const orderData = {
      userId: user.uid,
      userName: profile?.name || user.displayName,
      userEmail: user.email,
      productName: getPProp(selectedPlan, 'Name'),
      plan: getPProp(selectedPlan, 'Plan'),
      price: getPProp(selectedPlan, 'Price'),
      contact: contactInfo,
      status: 'Pending',
      timestamp: Date.now(),
      date: new Date().toLocaleString('en-GB')
    };
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderData);
      fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(orderData) }).catch(() => {});
      setView('order_success');
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id, s) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', id), { status: s });
  };

  const updateMemberTier = async (uid, newTier) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', uid), { tier: newTier });
    await updateDoc(doc(db, 'artifacts', appId, 'users', uid, 'profile', 'data'), { tier: newTier });
  };

  const getPProp = (p, k) => p?.[k] || p?.[k.toLowerCase()] || p?.[k.toUpperCase()] || "";
  const formatImg = (url) => {
    const id = url?.match(/[-\w]{25,}/);
    return id ? `https://lh3.googleusercontent.com/d/${id[0]}=s800` : "https://placehold.co/400x400/112240/ffffff?text=MM+TECH";
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

  const Nav = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a192f]/90 backdrop-blur-xl border-t border-blue-900/20 p-5 flex justify-around items-center z-50 rounded-t-[2rem] max-w-2xl mx-auto shadow-2xl">
      <button onClick={() => setView('home')} className={view === 'home' ? 'text-blue-500' : 'text-slate-500'}><ShoppingBag size={24}/></button>
      <button onClick={() => setView('customer_dash')} className={view === 'customer_dash' ? 'text-blue-500' : 'text-slate-500'}><History size={24}/></button>
      {profile?.role === 'admin' && <button onClick={() => setView('admin_dash')} className={view === 'admin_dash' ? 'text-blue-500' : 'text-slate-500'}><ShieldCheck size={24}/></button>}
      <button onClick={() => setView('profile')} className={view === 'profile' ? 'text-blue-500' : 'text-slate-500'}><User size={24}/></button>
    </nav>
  );

  if (loading && view !== 'welcome') return <div className="min-h-screen bg-[#0a192f] flex flex-col items-center justify-center gap-4"><Loader2 className="animate-spin text-blue-500" size={40}/><p className="text-blue-400 text-xs font-black uppercase tracking-widest animate-pulse">Processing...</p></div>;

  return (
    <div className="bg-[#0a192f] min-h-screen text-white font-sans select-none overflow-x-hidden">
      <div className="max-w-2xl mx-auto w-full min-h-screen flex flex-col relative border-x border-blue-900/10 shadow-2xl">
        
        {view === 'welcome' && (
          <div className="flex flex-col flex-1 items-center justify-between py-20 px-8 text-center">
            <div className="flex flex-col items-center">
                <div className="w-32 h-32 bg-[#112240] rounded-[2.5rem] border border-blue-500/20 shadow-2xl mb-8 flex items-center justify-center overflow-hidden">
                    <img src="https://placehold.co/300x300/112240/ffffff?text=MM+TECH" className="w-full h-full object-cover" alt="Logo" />
                </div>
                <h1 className="text-4xl font-black mb-3">MM Tech Store</h1>
                <p className="text-slate-400 text-sm max-w-xs italic text-center leading-relaxed">Myanmar's leading digital service platform.</p>
            </div>
            <div className="w-full max-w-xs space-y-4">
                <button onClick={handleLogin} className="w-full bg-white text-black py-5 rounded-2xl font-black shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="G"/> Google ဖြင့် Login ဝင်မည်
                </button>
                <button onClick={() => setView('home')} className="w-full bg-slate-800/50 text-slate-400 py-4 rounded-2xl font-bold text-sm">Guest အနေဖြင့် ကြည့်မည်</button>
            </div>
            <div className="text-[10px] uppercase font-bold tracking-[0.4em] text-slate-600">Verified Cloud System</div>
          </div>
        )}

        {view === 'home' && (
          <>
            <div className="bg-[#0d1b33] p-6 rounded-b-[2.5rem] shadow-xl border-b border-blue-900/30 sticky top-0 z-30">
              <div className="flex justify-between items-center mb-6 text-left">
                <div><p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">Premium Store</p><h2 className="text-2xl font-black">Welcome, {profile?.name.split(' ')[0] || 'Guest'}</h2></div>
                {user && <div className="w-10 h-10 rounded-full border-2 border-blue-600 p-0.5 shadow-lg overflow-hidden"><img src={user.photoURL} className="rounded-full w-full h-full" alt="U"/></div>}
              </div>
              <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/><input type="text" placeholder="Search products..." className="w-full bg-[#0a192f] border border-blue-900/50 text-white py-4 pl-12 pr-4 rounded-2xl outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
            </div>
            <div className="px-5 py-8 pb-32 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 mb-10">
                  {categories.map(c => (
                    <button key={c.id} onClick={() => { setSelectedCat(c.id); setView('category_view'); }} className="bg-[#112240] p-5 rounded-[2rem] flex flex-col items-center gap-3 border border-transparent active:border-blue-500 shadow-lg">
                      <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-400">{c.icon}</div>
                      <span className="text-xs font-bold">{c.name}</span>
                    </button>
                  ))}
                </div>
                <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6 ml-2 text-left">Popular Items</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {groupedProducts.filter(g => searchQuery === '' || g.name.toLowerCase().includes(searchQuery.toLowerCase())).map(group => (
                    <div key={group.name} onClick={() => { setSelectedGroup(group); setView('group_details'); }} className="bg-[#112240] p-2.5 rounded-2xl border border-blue-900/20 active:scale-95 text-center flex flex-col cursor-pointer group shadow-md">
                      <div className="aspect-square bg-[#0a192f] rounded-xl overflow-hidden border border-blue-900/30 mb-2 relative"><img src={formatImg(group.image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="I"/><div className="absolute top-1 right-1 bg-blue-600 px-1.5 py-0.5 rounded-md text-[7px] font-black">{group.plans.length} Items</div></div>
                      <h4 className="text-[10px] font-bold truncate px-1">{group.name}</h4>
                      <span className="text-blue-500 text-[8px] font-black uppercase mt-1">View Info</span>
                    </div>
                  ))}
                </div>
            </div>
            <Nav />
          </>
        )}

        {view === 'category_view' && (
          <div className="flex flex-col flex-1 pb-32">
            <header className="p-6 bg-[#112240] border-b border-blue-900/30 flex items-center gap-4 sticky top-0 z-30 shadow-lg"><button onClick={() => setView('home')} className="p-2 bg-[#0a192f] rounded-xl"><ArrowLeft size={20}/></button><h2 className="text-xl font-black">{selectedCat}</h2></header>
            <div className="p-5 grid grid-cols-3 gap-3">
              {groupedProducts.filter(g => g.category === selectedCat).map(group => (
                <div key={group.name} onClick={() => { setSelectedGroup(group); setView('group_details'); }} className="bg-[#112240] p-2 rounded-2xl border border-blue-900/20 active:scale-95 text-center flex flex-col"><div className="aspect-square bg-[#0a192f] rounded-xl overflow-hidden border border-blue-900/30 mb-2"><img src={formatImg(group.image)} className="w-full h-full object-cover" alt="I"/></div><h4 className="text-[10px] font-bold truncate px-1">{group.name}</h4><p className="text-blue-400 text-[8px] mt-1 font-bold">{group.plans.length} Types</p></div>
              ))}
            </div>
            <Nav />
          </div>
        )}

        {view === 'group_details' && (
          <div className="flex flex-col flex-1">
            <div className="relative h-[35vh] bg-[#112240]"><img src={formatImg(selectedGroup?.image)} className="w-full h-full object-cover opacity-60" alt="B"/><div className="absolute inset-0 bg-gradient-to-t from-[#0a192f] via-transparent to-transparent"></div><button onClick={() => setView('home')} className="absolute top-6 left-6 p-3 bg-black/40 backdrop-blur rounded-2xl border border-white/10 active:scale-90"><ArrowLeft size={20}/></button></div>
            <div className="px-8 -mt-16 relative z-10 flex-1 flex flex-col text-left">
                <h2 className="text-4xl font-black mb-1">{selectedGroup?.name}</h2>
                <p className="text-slate-400 text-sm mb-10 italic">Select your preferred plan</p>
                <div className="space-y-3 pb-32">
                  {selectedGroup?.plans.map((p, i) => (
                    <button key={i} onClick={() => { setSelectedPlan(p); setView('checkout'); }} className="w-full bg-[#112240] p-5 rounded-3xl border border-blue-900/30 flex items-center justify-between active:border-blue-500 shadow-lg group">
                      <div className="flex items-center gap-4 text-left"><div className="p-3 bg-blue-600/10 rounded-2xl text-blue-400 group-active:bg-blue-600 group-active:text-white transition-colors"><ShoppingBag size={18} /></div><div><h4 className="text-sm font-black">{getPProp(p, 'Plan')}</h4><p className="text-blue-500 font-black text-sm">{getPProp(p, 'Price')} Ks</p></div></div>
                      <ChevronRight size={16} className="text-slate-700" />
                    </button>
                  ))}
                </div>
            </div>
            <Nav />
          </div>
        )}

        {view === 'checkout' && (
          <div className="p-8 text-left flex flex-col flex-1 pb-32">
            <header className="flex items-center gap-4 mb-8"><button onClick={() => setView('group_details')} className="p-2 bg-[#112240] rounded-xl"><ArrowLeft size={20}/></button><h2 className="text-xl font-black">Checkout</h2></header>
            <div className="bg-[#112240] p-10 rounded-[3rem] border border-blue-900/30 mb-8 text-center shadow-2xl">
                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl overflow-hidden border-4 border-blue-600/20 shadow-xl"><img src={formatImg(getPProp(selectedPlan, 'Link'))} className="w-full h-full object-cover" alt="I"/></div>
                <h3 className="text-2xl font-black">{getPProp(selectedPlan, 'Name')}</h3>
                <p className="text-blue-400 font-bold mb-4">{getPProp(selectedPlan, 'Plan')}</p>
                <div className="text-3xl font-black">{getPProp(selectedPlan, 'Price')} Ks</div>
            </div>
            <div className="mb-10">
                <label className="block text-slate-500 text-xs font-black uppercase mb-3 ml-2">Contact Info (Profile မှ အော်တိုဖြည့်ထားပါသည်)</label>
                <input type="text" placeholder="ဆက်သွယ်ရန် အချက်အလက်" className="w-full bg-[#112240] border border-blue-900/50 p-5 rounded-2xl outline-none focus:ring-2 ring-blue-500/30" value={contactInfo} onChange={e => setContactInfo(e.target.value)} />
            </div>
            <button onClick={handleOrder} disabled={loading || !contactInfo || !user} className="w-full bg-blue-600 py-5 rounded-2xl font-black shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
              {loading ? <Loader2 className="animate-spin" /> : <><Send size={20}/> Confirm Order Now</>}
            </button>
            <Nav />
          </div>
        )}

        {view === 'customer_dash' && (
          <div className="p-8 text-left flex flex-col flex-1 pb-32 overflow-y-auto">
            <h2 className="text-3xl font-black mb-1 text-left">My Orders</h2>
            <p className="text-slate-500 text-sm mb-8 text-left">Purchase History</p>
            <div className="space-y-4">
                {myOrders.map(o => (
                  <div key={o.id} className="bg-[#112240] p-5 rounded-3xl border border-blue-900/30 flex justify-between items-center shadow-lg">
                    <div className="text-left">
                        <h4 className="font-bold text-sm text-white">{o.productName}</h4>
                        <p className="text-blue-500 font-bold text-[10px]">{o.plan} • {o.price} Ks</p>
                        <p className="text-[9px] text-slate-500 mt-1 flex items-center gap-1"><Clock size={10}/> {o.date}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${o.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{o.status}</span>
                  </div>
                ))}
                {myOrders.length === 0 && <p className="text-center py-20 text-slate-600 italic">မှတ်တမ်းမရှိသေးပါရှင်။</p>}
            </div>
            <Nav />
          </div>
        )}

        {view === 'admin_dash' && profile?.role === 'admin' && (
          <div className="p-8 text-left flex flex-col flex-1 pb-32 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-black">Admin Panel</h2>
                <div className="flex bg-[#112240] p-1 rounded-xl border border-blue-900/30">
                    <button onClick={() => setAdminTab('orders')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${adminTab === 'orders' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Orders</button>
                    <button onClick={() => setAdminTab('members')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${adminTab === 'members' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Members</button>
                </div>
            </div>
            {adminTab === 'orders' ? (
                <div className="space-y-4">
                {allOrders.map(o => (
                    <div key={o.id} className="bg-[#112240] p-5 rounded-3xl border border-blue-900/30 shadow-xl relative overflow-hidden text-left">
                    <div className="flex justify-between mb-4 items-start">
                        <div><h4 className="font-black text-slate-100">{o.productName}</h4><p className="text-xs text-blue-400 font-bold">{o.plan} - {o.price} Ks</p></div>
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${o.status === 'Completed' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>{o.status}</span>
                    </div>
                    <div className="bg-[#0a192f]/50 p-4 rounded-2xl mb-4 text-[11px] space-y-1">
                        <p className="flex justify-between"><span className="text-slate-500 uppercase">Contact:</span> <span className="text-blue-400 font-black">{o.contact}</span></p>
                        <p className="flex justify-between"><span className="text-slate-500 uppercase">User:</span> <span className="text-slate-300">{o.userName}</span></p>
                    </div>
                    {o.status === 'Pending' && <button onClick={() => updateStatus(o.id, 'Completed')} className="w-full bg-blue-600 py-3 rounded-xl font-black text-xs">Mark as Completed</button>}
                    </div>
                ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {allMembers.map(m => (
                        <div key={m.uid} className="bg-[#112240] p-5 rounded-3xl border border-blue-900/30 flex flex-col gap-4 text-left shadow-lg">
                            <div className="flex items-center gap-4">
                                <img src={m.photoURL || "https://placehold.co/100"} className="w-12 h-12 rounded-full border border-blue-600/20" alt="M"/>
                                <div className="flex-1 overflow-hidden">
                                    <h4 className="font-bold text-sm truncate">{m.name}</h4>
                                    <p className="text-[10px] text-slate-500 truncate">{m.email}</p>
                                </div>
                                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase">{m.tier}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => updateMemberTier(m.uid, 'Standard')} className="bg-slate-800 py-2 rounded-lg text-[8px] font-bold uppercase active:scale-95 transition-all">Standard</button>
                                <button onClick={() => updateMemberTier(m.uid, 'VIP')} className="bg-yellow-600/10 text-yellow-500 py-2 rounded-lg text-[8px] font-bold uppercase border border-yellow-600/20 active:scale-95 transition-all">VIP</button>
                                <button onClick={() => updateMemberTier(m.uid, 'Reseller')} className="bg-blue-600/10 text-blue-400 py-2 rounded-lg text-[8px] font-bold uppercase border border-blue-600/20 active:scale-95 transition-all">Reseller</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <Nav />
          </div>
        )}

        {view === 'profile' && (
            <div className="p-8 text-center flex flex-col flex-1 items-center justify-center pb-32">
                {user ? (
                    <div className="w-full max-w-sm flex flex-col items-center">
                        <div className="w-24 h-24 rounded-full border-4 border-blue-600 p-1 mb-6 shadow-2xl relative">
                            <img src={user.photoURL} className="rounded-full w-full h-full" alt="U"/>
                            <div className="absolute -bottom-1 -right-1 bg-blue-600 p-2 rounded-full border-4 border-[#0a192f] shadow-lg"><BadgeCheck size={18}/></div>
                        </div>
                        {isEditingProfile ? (
                            <div className="w-full space-y-4 mb-10 text-left">
                                <div><label className="block text-slate-500 text-[10px] font-black uppercase ml-2 mb-1">Display Name</label><input type="text" className="w-full bg-[#112240] border border-blue-500/30 p-4 rounded-2xl outline-none text-sm text-white" value={editName} onChange={e => setEditName(e.target.value)} /></div>
                                <div><label className="block text-slate-500 text-[10px] font-black uppercase ml-2 mb-1">Telegram / Phone</label><input type="text" className="w-full bg-[#112240] border border-blue-500/30 p-4 rounded-2xl outline-none text-sm text-white" value={editContact} onChange={e => setEditContact(e.target.value)} /></div>
                                <div className="grid grid-cols-2 gap-4"><button onClick={() => setIsEditingProfile(false)} className="bg-slate-800 py-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2"><X size={16}/> Cancel</button><button onClick={handleUpdateProfile} className="bg-blue-600 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2"><Save size={16}/> Save</button></div>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-2xl font-black mb-1">{profile?.name}</h2>
                                <p className="text-blue-400 text-sm font-bold mb-8">{user.email}</p>
                                <div className="bg-[#112240] w-full p-8 rounded-[2.5rem] border border-blue-900/30 mb-8 text-left shadow-xl">
                                    <div className="flex justify-between items-center py-4 border-b border-blue-900/20"><span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Membership</span><span className="bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase shadow-sm">{profile?.tier}</span></div>
                                    <div className="flex justify-between items-center py-4 border-b border-blue-900/20"><span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Contact</span><span className="text-white text-sm font-bold">{profile?.contact || 'Not set'}</span></div>
                                    <button onClick={() => setIsEditingProfile(true)} className="w-full mt-4 text-blue-500 text-[10px] font-black uppercase flex items-center justify-center gap-2 py-2 rounded-xl transition-all hover:bg-blue-600/10"><Edit3 size={14}/> Edit Profile Details</button>
                                </div>
                            </>
                        )}
                        <button onClick={async () => { await signOut(auth); setView('welcome'); }} className="text-red-500 font-black text-sm flex items-center gap-2 hover:bg-red-500/10 px-10 py-3 rounded-2xl transition-all border border-red-500/20"><LogOut size={18}/> Sign out</button>
                    </div>
                ) : <button onClick={handleLogin} className="bg-white text-black px-10 py-5 rounded-2xl font-black">Login with Google</button>}
                <Nav />
            </div>
        )}

        {view === 'order_success' && (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-8 border border-green-500/20 shadow-2xl animate-pulse"><CheckCircle2 size={60} className="text-green-500" /></div>
            <h2 className="text-4xl font-black mb-4 tracking-tighter uppercase">Success!</h2>
            <p className="text-slate-400 mb-10 text-sm italic">အော်ဒါတင်ခြင်း အောင်မြင်ပါတယ်ရှင်။</p>
            <button onClick={() => setView('customer_dash')} className="w-full bg-blue-600 py-5 rounded-2xl font-black shadow-xl text-lg active:scale-95 transition-all">History ကြည့်မည်</button>
          </div>
        )}

      </div>
    </div>
  );
}
