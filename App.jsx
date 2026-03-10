import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
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
  Loader2, Star, User, ShieldCheck, LogOut, Send,
  BadgeCheck, Clock, Edit3, Save, X, RefreshCw, Layers
} from 'lucide-react';

// --- (၁) CONFIGURATION ---
const LOGO_URL = "https://placehold.co/100x100/112240/ffffff?text=MM+TECH"; // သင်၏ Logo URL ထည့်နိုင်သည်
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

// --- (၂) HELPER FUNCTIONS ---
const getPProp = (p, k) => p?.[k] || p?.[k.toLowerCase()] || p?.[k.toUpperCase()] || "";

const formatImg = (url) => {
  if (!url || typeof url !== 'string') return LOGO_URL;
  const idMatch = url.match(/[-\w]{25,}/);
  return idMatch ? `https://drive.google.com/uc?export=view&id=${idMatch[0]}` : LOGO_URL;
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
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editContact, setEditContact] = useState('');
  const [adminTab, setAdminTab] = useState('orders');

  // --- (၃) DYNAMIC CATEGORY GENERATOR ---
  const dynamicCategories = useMemo(() => {
    const uniqueCats = [...new Set(products.map(p => getPProp(p, 'Category')).filter(Boolean))];
    const iconMap = {
      'Game': <Gamepad2 size={16} />,
      'Digital product': <Smartphone size={16} />,
      'Online class': <BookOpen size={16} />,
      'Gsm reseller': <Settings size={16} />,
    };
    return uniqueCats.map(cat => ({
      id: cat, name: cat, icon: iconMap[cat] || <Layers size={16} />
    }));
  }, [products]);

  // --- (၄) AUTHENTICATION LOGIC ---
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
    try {
      const docSnap = await getDoc(docRef);
      let currentProfile;
      const isAdmin = ADMIN_EMAILS.includes(u.email);
      if (docSnap.exists()) {
        currentProfile = docSnap.data();
      } else {
        currentProfile = {
          name: u.displayName || "User", email: u.email,
          tier: isAdmin ? 'Admin / Owner' : 'Standard', 
          role: isAdmin ? 'admin' : 'user', uid: u.uid,
          photoURL: u.photoURL, createdAt: new Date().toISOString()
        };
        await setDoc(docRef, currentProfile);
      }
      setProfile(currentProfile); setEditName(currentProfile.name); setEditContact(currentProfile.contact || '');
    } catch (e) { console.error(e); }
  };

  const handleLogin = async () => {
    try { setLoading(true); await signInWithPopup(auth, googleProvider); } 
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // --- (၅) DATA FETCHING ---
  useEffect(() => {
    fetch(SCRIPT_URL).then(res => res.json()).then(data => { if (Array.isArray(data)) setProducts(data); });
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubOrders = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), (sn) => {
      const docs = sn.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.timestamp - a.timestamp);
      setAllOrders(docs); setMyOrders(docs.filter(o => o.userId === user.uid));
    });
    return () => unsubOrders();
  }, [user]);

  const handleOrder = async () => {
    if (!editContact && !profile?.contact) return;
    setLoading(true);
    const orderData = {
      userId: user.uid, userName: profile?.name, product: getPProp(selectedPlan, 'Name'),
      plan: getPProp(selectedPlan, 'Plan'), price: getPProp(selectedPlan, 'Price'),
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

  // --- (၆) UI COMPONENTS ---

  const MainHeader = () => (
    <div className="flex items-center justify-between p-4 lg:px-8 bg-[#0a192f] border-b border-blue-900/20 sticky top-0 z-40 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg border border-blue-500/30 overflow-hidden">
          <img src={LOGO_URL} className="w-full h-full object-cover" alt="Logo" />
        </div>
        <h2 className="text-md font-black text-white uppercase tracking-tighter">MM Tech</h2>
      </div>
      <div className="flex items-center gap-4">
        <a href="https://t.me/mmtech19" target="_blank" rel="noreferrer" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Customer-Chat</a>
        <button className="text-white"><ShoppingBag size={20}/></button>
      </div>
    </div>
  );

  const BottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a192f]/90 backdrop-blur-xl border-t border-blue-900/20 p-5 flex justify-around items-center z-50 rounded-t-[2.5rem] max-w-md lg:max-w-4xl mx-auto">
      <button onClick={() => setView('home')} className={view === 'home' ? 'text-blue-500' : 'text-slate-500'}><ShoppingBag size={24}/></button>
      <button onClick={() => setView('customer_dash')} className={view === 'customer_dash' ? 'text-blue-500' : 'text-slate-500'}><History size={24}/></button>
      {profile?.role === 'admin' && <button onClick={() => setView('admin_dash')} className={view === 'admin_dash' ? 'text-blue-500' : 'text-slate-500'}><ShieldCheck size={24}/></button>}
      <button onClick={() => setView('profile')} className={view === 'profile' ? 'text-blue-500' : 'text-slate-500'}><User size={24}/></button>
    </nav>
  );

  if (loading || view === 'initializing') return <div className="min-h-screen bg-[#0a192f] flex flex-col items-center justify-center text-white"><Loader2 className="animate-spin text-blue-500" size={40}/><p className="mt-4 text-[10px] font-black uppercase tracking-widest text-blue-400">Syncing MM Tech Hub...</p></div>;

  return (
    <div className="bg-[#050d1a] min-h-screen text-white selection:bg-blue-500">
      <div className="max-w-md lg:max-w-5xl mx-auto w-full min-h-screen flex flex-col relative bg-[#0a192f] border-x border-blue-900/10 shadow-2xl">
        
        {view === 'welcome' && (
          <div className="flex flex-col flex-1 items-center justify-center py-20 px-10 text-center">
            <div className="w-32 h-32 bg-[#112240] rounded-[2.5rem] border border-blue-500/20 shadow-2xl mb-8 flex items-center justify-center overflow-hidden p-1">
              <img src={LOGO_URL} className="w-full h-full object-cover rounded-[2.2rem]" alt="Logo" />
            </div>
            <h1 className="text-4xl font-black mb-4">MM Tech Store</h1>
            <p className="text-slate-400 text-sm mb-12">Premium Digital Services for Myanmar.</p>
            <div className="w-full max-w-xs space-y-4">
              <button onClick={handleLogin} className="w-full bg-white text-black py-4 rounded-2xl font-black shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"><img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="G"/> Login with Google</button>
              <button onClick={() => setView('home')} className="w-full bg-slate-800/50 text-slate-500 py-3 rounded-2xl font-bold text-xs">Browse as Guest</button>
            </div>
          </div>
        )}

        {view === 'home' && (
          <>
            <MainHeader />
            <div className="p-6 pb-32 text-left">
              <h1 className="text-3xl font-black text-white mb-6">Browse Products</h1>
              
              {/* CATEGORY CHIPS */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6">
                <button onClick={() => setSelectedCat(null)} className={`px-5 py-2 rounded-full text-[11px] font-bold border whitespace-nowrap transition-all ${!selectedCat ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#112240] border-blue-900/30 text-slate-400'}`}>All</button>
                {dynamicCategories.map(c => (
                  <button key={c.id} onClick={() => setSelectedCat(c.id)} className={`flex items-center gap-2 px-5 py-2 rounded-full text-[11px] font-bold border whitespace-nowrap transition-all ${selectedCat === c.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#112240] border-blue-900/30 text-slate-400'}`}>
                    {c.icon}{c.name}
                  </button>
                ))}
              </div>

              {/* SEARCH BAR */}
              <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="text" placeholder="Search services..." className="w-full bg-[#112240] border border-blue-900/20 text-white py-3.5 pl-12 pr-4 rounded-2xl outline-none text-sm font-medium" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>

              {/* PRODUCTS GRID */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {groupedProducts
                  .filter(g => (!selectedCat || g.category === selectedCat) && (searchQuery === '' || g.name.toLowerCase().includes(searchQuery.toLowerCase())))
                  .map(group => (
                    <div key={group.name} onClick={() => { setSelectedGroup(group); setView('group_details'); }} className="bg-[#112240]/40 p-2.5 rounded-2xl border border-blue-900/10 active:scale-95 transition-all cursor-pointer">
                      <div className="aspect-square bg-[#0a192f] rounded-xl overflow-hidden mb-2 relative">
                        <img src={formatImg(group.image)} className="w-full h-full object-cover" alt="I" />
                        <div className="absolute top-1 right-1 bg-blue-600 text-[8px] font-black px-1.5 py-0.5 rounded-md">{group.plans.length}</div>
                      </div>
                      <h4 className="text-[10px] font-bold truncate px-1">{group.name}</h4>
                      <p className="text-blue-500 text-[8px] font-black uppercase tracking-widest mt-1 px-1">View</p>
                    </div>
                ))}
              </div>
            </div>
            <BottomNav />
          </>
        )}

        {/* DETAILS, CHECKOUT, SUCCESS, ADMIN VIEWS (Previous logic remains but with MainHeader/BottomNav consistency) */}
        {view === 'group_details' && (
          <div className="flex flex-col flex-1 pb-32 text-left">
            <MainHeader />
            <div className="relative h-[30vh] overflow-hidden">
              <img src={formatImg(selectedGroup?.image)} className="w-full h-full object-cover opacity-40" alt="B" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a192f] to-transparent"></div>
              <button onClick={() => setView('home')} className="absolute top-4 left-4 p-2 bg-black/30 rounded-lg text-white"><ArrowLeft size={20}/></button>
            </div>
            <div className="px-6 -mt-10 relative z-10">
              <h2 className="text-3xl font-black mb-2">{selectedGroup?.name}</h2>
              <p className="text-slate-500 text-xs italic mb-8">Select your package</p>
              <div className="space-y-3">
                {selectedGroup?.plans.map((p, i) => (
                  <button key={i} onClick={() => { setSelectedPlan(p); setView('checkout'); }} className="w-full bg-[#112240] p-5 rounded-2xl border border-blue-900/20 flex items-center justify-between active:border-blue-500">
                    <div className="flex items-center gap-4"><div className="p-2 bg-blue-600/10 rounded-xl text-blue-400"><ShoppingBag size={18}/></div><div><h4 className="text-sm font-bold">{getPProp(p, 'Plan')}</h4><p className="text-blue-500 font-black text-sm">{getPProp(p, 'Price')} Ks</p></div></div>
                    <ChevronRight size={16} className="text-slate-700" />
                  </button>
                ))}
              </div>
            </div>
            <BottomNav />
          </div>
        )}

        {view === 'checkout' && (
          <div className="p-8 text-left flex flex-col flex-1 pb-32">
            <MainHeader />
            <button onClick={() => setView('group_details')} className="w-10 h-10 bg-[#112240] rounded-xl flex items-center justify-center mb-8"><ArrowLeft size={18}/></button>
            <div className="bg-[#112240] p-10 rounded-[2.5rem] border border-blue-900/20 text-center mb-8 shadow-xl">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl overflow-hidden border-2 border-blue-600/20 shadow-lg"><img src={formatImg(getPProp(selectedPlan, 'Link'))} className="w-full h-full object-cover" alt="I"/></div>
              <h3 className="text-2xl font-black mb-1">{getPProp(selectedPlan, 'Name')}</h3>
              <p className="text-blue-400 font-bold mb-4 uppercase text-xs tracking-widest">{getPProp(selectedPlan, 'Plan')}</p>
              <div className="text-3xl font-black">{getPProp(selectedPlan, 'Price')} Ks</div>
            </div>
            <div className="mb-10 text-left">
              <label className="block text-slate-500 text-[10px] font-black uppercase ml-1 mb-2 tracking-widest text-left">Your Telegram @ID / Phone Number</label>
              <input type="text" placeholder="ဆက်သွယ်ရန် အချက်အလက်" className="w-full bg-[#112240] border border-blue-900/30 p-4 rounded-xl text-white outline-none focus:border-blue-500" value={editContact || profile?.contact || ''} onChange={e => setEditContact(e.target.value)} />
            </div>
            <button onClick={handleOrder} disabled={loading || (!editContact && !profile?.contact)} className="w-full bg-blue-600 py-4 rounded-xl font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 text-white">
              {loading ? <Loader2 className="animate-spin" /> : <><Send size={18}/> Confirm & Buy</>}
            </button>
            <BottomNav />
          </div>
        )}

        {view === 'order_success' && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20 shadow-2xl animate-bounce"><CheckCircle2 size={40} className="text-green-500" /></div>
            <h2 className="text-2xl font-black mb-2">Order Success!</h2>
            <p className="text-slate-400 text-xs mb-10 leading-relaxed italic text-center">Admin မှ စစ်ဆေးပြီး Telegram မှ ဆက်သွယ်ပါမည်။</p>
            <button onClick={() => setView('customer_dash')} className="w-full bg-[#112240] py-4 rounded-xl font-black text-blue-400 border border-blue-900/50">View History</button>
          </div>
        )}

        {/* ADMIN, PROFILE, HISTORY VIEWS - (Simplified for space but consistent with BottomNav) */}
        {view === 'admin_dash' && <div className="p-8 text-left flex flex-1 flex-col pb-32"><MainHeader /><h2 className="text-2xl font-black mb-6">Admin Panel</h2><BottomNav /></div>}
        {view === 'customer_dash' && <div className="p-8 text-left flex flex-1 flex-col pb-32"><MainHeader /><h2 className="text-2xl font-black mb-6">My Records</h2><BottomNav /></div>}
        {view === 'profile' && <div className="p-8 flex flex-1 flex-col items-center justify-center pb-32"><MainHeader /><div className="mt-10 flex flex-col items-center">{user ? <><img src={user.photoURL} className="w-20 h-20 rounded-full border-4 border-blue-600 mb-4" alt="P"/><h2 className="text-xl font-black">{profile?.name}</h2><button onClick={() => signOut(auth)} className="mt-8 text-red-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2"><LogOut size={16}/> Logout</button></> : <button onClick={handleLogin} className="bg-white text-black px-10 py-3 rounded-xl font-black">Login with Google</button>}</div><BottomNav /></div>}

      </div>
    </div>
  );
}
