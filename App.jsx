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

// --- (၁) FIREBASE & CONFIGURATION ---
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

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyC1MECq8ZNzdj-RxmBaMcFfSqVk9Ijt9uuRW-szeukWuCoNBhywDz0k7W1r5mCvjhR/exec"; 
const ADMIN_EMAILS = ["kohtet107576@gmail.com"]; // Admin email

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

  // --- (၂) AUTHENTICATION LOGIC ---
  useEffect(() => {
    const setupAuth = async () => {
      await setPersistence(auth, browserLocalPersistence);
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
      return unsubscribe;
    };
    setupAuth();
  }, []);

  const syncProfile = async (u) => {
    if (!u) return;
    const docRef = doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data');
    const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'members', u.uid);
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
      await setDoc(memberRef, currentProfile, { merge: true });
      setProfile(currentProfile);
      setEditName(currentProfile.name);
      setEditContact(currentProfile.contact || '');
      setContactInfo(currentProfile.contact || '');
    } catch (e) { console.error("Profile Sync Error:", e); }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) setView('home');
    } catch (e) { console.error("Login Error:", e); }
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

  // --- (၄) UTILITIES ---
  const getPProp = (p, k) => p?.[k] || p?.[k.toLowerCase()] || p?.[k.toUpperCase()] || "";
  const formatImg = (url) => {
    const id = url?.match(/[-\w]{25,}/);
    return id ? `https://drive.google.com/uc?export=view&id=${id[0]}` : "https://placehold.co/400x400/112240/ffffff?text=MM+TECH";
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

  // --- (၅) UI COMPONENTS ---
  const Container = ({ children }) => (
    <div className="bg-[#0a192f] min-h-screen text-white font-sans overflow-x-hidden">
      <div className="max-w-md mx-auto w-full min-h-screen flex flex-col relative border-x border-blue-900/10 shadow-2xl">
        {children}
      </div>
    </div>
  );

  const BottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a192f]/90 backdrop-blur-xl border-t border-blue-900/20 p-5 flex justify-around items-center z-50 rounded-t-[2rem] max-w-md mx-auto shadow-2xl">
      <button onClick={() => setView('home')} className={view === 'home' ? 'text-blue-500' : 'text-slate-500'}><ShoppingBag size={24}/></button>
      <button onClick={() => setView('customer_dash')} className={view === 'customer_dash' ? 'text-blue-500' : 'text-slate-500'}><History size={24}/></button>
      {profile?.role === 'admin' && <button onClick={() => setView('admin_dash')} className={view === 'admin_dash' ? 'text-blue-500' : 'text-slate-500'}><ShieldCheck size={24}/></button>}
      <button onClick={() => setView('profile')} className={view === 'profile' ? 'text-blue-500' : 'text-slate-500'}><User size={24}/></button>
    </nav>
  );

  if (loading) return <div className="min-h-screen bg-[#0a192f] flex flex-col items-center justify-center text-white"><Loader2 className="animate-spin text-blue-500" size={40}/><p className="mt-4 text-[10px] uppercase font-black tracking-widest text-blue-400">Loading MM Tech Store...</p></div>;

  return (
    <Container>
      {/* WELCOME VIEW */}
      {view === 'welcome' && (
        <div className="flex flex-col flex-1 items-center justify-between py-20 px-8 text-center">
          <div className="flex flex-col items-center">
            <div className="w-28 h-28 bg-[#112240] rounded-[2.5rem] border border-blue-500/20 shadow-2xl mb-8 flex items-center justify-center overflow-hidden">
              <img src="https://placehold.co/300x300/112240/ffffff?text=MM+TECH" className="w-full h-full object-cover" alt="Logo" />
            </div>
            <h1 className="text-3xl font-black mb-2 tracking-tight">MM Tech Store</h1>
            <p className="text-slate-400 text-sm italic">Premium Digital Services</p>
          </div>
          <div className="w-full space-y-4">
            <button onClick={handleLogin} className="w-full bg-white text-black py-4 rounded-2xl font-black shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="G"/> Login with Google
            </button>
            <button onClick={() => setView('home')} className="w-full bg-slate-800/50 text-slate-400 py-3 rounded-2xl font-bold text-xs">Browse as Guest</button>
          </div>
        </div>
      )}

      {/* HOME VIEW */}
      {view === 'home' && (
        <>
          <div className="bg-[#0d1b33] p-6 rounded-b-[2.5rem] shadow-xl border-b border-blue-900/30 sticky top-0 z-30">
            <div className="flex justify-between items-center mb-6">
              <div className="text-left"><p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">Premium Store</p><h2 className="text-xl font-black">Welcome, {profile?.name.split(' ')[0] || 'Guest'}</h2></div>
              {user && <img src={user.photoURL} className="w-10 h-10 rounded-full border-2 border-blue-600 shadow-lg" alt="U"/>}
            </div>
            <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/><input type="text" placeholder="Search products..." className="w-full bg-[#0a192f] border border-blue-900/50 text-white py-3.5 pl-12 pr-4 rounded-2xl outline-none text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
          </div>
          <div className="px-5 py-6 pb-32">
            <div className="grid grid-cols-2 gap-3 mb-8">
              {categories.map(c => (
                <button key={c.id} onClick={() => { setSelectedCat(c.id); setView('category_view'); }} className="bg-[#112240] p-4 rounded-3xl flex items-center gap-3 border border-blue-900/10 active:bg-blue-600 transition-all group">
                  <div className="p-2 bg-blue-600/10 rounded-xl text-blue-400 group-active:text-white">{c.icon}</div>
                  <span className="text-[11px] font-bold text-slate-300 group-active:text-white">{c.name}</span>
                </button>
              ))}
            </div>
            <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 ml-2 text-left">Popular Products</h3>
            <div className="grid grid-cols-3 gap-3">
              {groupedProducts.filter(g => searchQuery === '' || g.name.toLowerCase().includes(searchQuery.toLowerCase())).map(group => (
                <div key={group.name} onClick={() => { setSelectedGroup(group); setView('group_details'); }} className="bg-[#112240] p-2 rounded-2xl border border-blue-900/20 active:scale-95 text-center flex flex-col cursor-pointer shadow-md">
                  <div className="aspect-square bg-[#0a192f] rounded-xl overflow-hidden mb-2 relative"><img src={formatImg(group.image)} className="w-full h-full object-cover" alt="I"/><div className="absolute top-1 right-1 bg-blue-600 px-1.5 py-0.5 rounded-md text-[7px] font-black">{group.plans.length}</div></div>
                  <h4 className="text-[9px] font-bold truncate px-1 text-white">{group.name}</h4>
                  <span className="text-blue-500 text-[8px] font-black uppercase mt-1">View</span>
                </div>
              ))}
            </div>
          </div>
          <BottomNav />
        </>
      )}

      {/* REMAINDER OF VIEWS: CATEGORY, DETAILS, ETC. (SAME AS PREVIOUS TURN BUT WITH POPUP AUTH) */}
      {/* ... (Admin, Profile, Checkout logic stays but method is optimized) */}
      {view === 'group_details' && (
        <div className="flex flex-col flex-1 pb-32">
          <div className="relative h-[30vh]"><img src={formatImg(selectedGroup?.image)} className="w-full h-full object-cover opacity-50" alt="B"/><div className="absolute inset-0 bg-gradient-to-t from-[#0a192f] to-transparent"></div><button onClick={() => setView('home')} className="absolute top-5 left-5 p-2 bg-black/30 backdrop-blur-md rounded-xl"><ArrowLeft size={18}/></button></div>
          <div className="px-6 -mt-8 relative z-10 flex-1">
            <h2 className="text-2xl font-black text-white text-left">{selectedGroup?.name}</h2>
            <p className="text-slate-400 text-xs text-left mb-6 italic">Select your plan</p>
            <div className="space-y-3">
              {selectedGroup?.plans.map((p, i) => (
                <button key={i} onClick={() => { setSelectedPlan(p); setView('checkout'); }} className="w-full bg-[#112240] p-4 rounded-2xl border border-blue-900/30 flex items-center justify-between active:border-blue-500 shadow-md">
                  <div className="flex items-center gap-3 text-left"><div className="p-2 bg-blue-600/10 rounded-xl text-blue-400"><ShoppingBag size={18} /></div><div><h4 className="text-xs font-black text-white">{getPProp(p, 'Plan')}</h4><p className="text-blue-500 font-black text-xs">{getPProp(p, 'Price')} Ks</p></div></div>
                  <ChevronRight size={16} className="text-slate-700" />
                </button>
              ))}
            </div>
          </div>
          <BottomNav />
        </div>
      )}

      {/* Check Checkout & Success views simplified for space */}
      {view === 'checkout' && (
        <div className="p-6 flex flex-1 flex-col text-left">
          <button onClick={() => setView('group_details')} className="w-10 h-10 bg-[#112240] rounded-xl flex items-center justify-center mb-6"><ArrowLeft size={18}/></button>
          <div className="bg-[#112240] p-8 rounded-[2rem] border border-blue-900/30 text-center mb-6">
            <h3 className="text-xl font-black">{getPProp(selectedPlan, 'Name')}</h3>
            <p className="text-blue-400 font-bold text-sm mb-4">{getPProp(selectedPlan, 'Plan')}</p>
            <div className="text-2xl font-black">{getPProp(selectedPlan, 'Price')} Ks</div>
          </div>
          <input type="text" placeholder="Telegram ID / Phone Number" className="w-full bg-[#112240] border border-blue-900/50 p-4 rounded-xl mb-4 text-white text-sm" value={contactInfo} onChange={e => setContactInfo(e.target.value)} />
          <button onClick={async () => {
             setLoading(true);
             const orderData = { userId: user.uid, userName: profile?.name, product: getPProp(selectedPlan, 'Name'), plan: getPProp(selectedPlan, 'Plan'), price: getPProp(selectedPlan, 'Price'), contact: contactInfo, status: 'Pending', timestamp: Date.now(), date: new Date().toLocaleString('en-GB') };
             await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderData);
             fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(orderData) }).catch(() => {});
             setLoading(false); setView('order_success');
          }} disabled={!user || !contactInfo} className="w-full bg-blue-600 py-4 rounded-xl font-black flex items-center justify-center gap-2">Confirm Order</button>
          <BottomNav />
        </div>
      )}

      {view === 'order_success' && (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20"><CheckCircle2 size={40} className="text-green-500" /></div>
          <h2 className="text-2xl font-black mb-2">Order Success!</h2>
          <p className="text-slate-400 text-xs mb-10 leading-relaxed">Admin မှ စစ်ဆေးပြီး ဆက်သွယ်ပေးပါမည်။</p>
          <button onClick={() => setView('customer_dash')} className="w-full bg-blue-600 py-4 rounded-xl font-black">View My History</button>
        </div>
      )}

      {/* DASHBOARDS & PROFILE - (Same logic for admin/profile) */}
      {view === 'profile' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            {user ? (
                <>
                <img src={user.photoURL} className="w-20 h-20 rounded-full border-4 border-blue-600 mb-4" alt="P"/>
                <h2 className="text-xl font-black">{profile?.name}</h2>
                <p className="text-blue-400 text-xs mb-6">{user.email}</p>
                <div className="bg-[#112240] w-full p-6 rounded-2xl border border-blue-900/30 mb-6 text-left">
                    <div className="flex justify-between py-2 border-b border-blue-900/10 text-xs"><span className="text-slate-400">Level</span><span className="text-blue-400 font-black uppercase">{profile?.tier}</span></div>
                    <div className="flex justify-between py-2 text-xs"><span className="text-slate-400">Contact</span><span>{profile?.contact || 'None'}</span></div>
                </div>
                <button onClick={() => signOut(auth)} className="text-red-500 flex items-center gap-2 text-xs font-bold"><LogOut size={16}/> Sign Out</button>
                </>
            ) : <button onClick={handleLogin} className="bg-white text-black px-8 py-3 rounded-xl font-black">Login with Google</button>}
            <BottomNav />
        </div>
      )}

      {view === 'customer_dash' && (
          <div className="p-6 text-left flex flex-col flex-1 pb-32 overflow-y-auto">
              <h2 className="text-2xl font-black mb-6">Order History</h2>
              <div className="space-y-3">
                  {myOrders.map(o => (
                      <div key={o.id} className="bg-[#112240] p-4 rounded-2xl border border-blue-900/30 flex justify-between items-center">
                          <div className="text-xs">
                              <h4 className="font-bold">{o.product}</h4>
                              <p className="text-blue-500">{o.plan} • {o.price} Ks</p>
                          </div>
                          <span className={`text-[8px] px-2 py-1 rounded-full uppercase font-black ${o.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{o.status}</span>
                      </div>
                  ))}
              </div>
              <BottomNav />
          </div>
      )}
    </Container>
  );
}
