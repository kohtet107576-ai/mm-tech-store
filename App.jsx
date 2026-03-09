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
const LOGO_URL = "https://lh3.googleusercontent.com/d/1Lh-nHgyLMSr3rBVe4OGnjEvEspuMokd6=s1000";

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
const ADMIN_EMAILS = ["kohtet107576@gmail.com"]; 

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

  // --- (၂) DYNAMIC CATEGORY GENERATOR (အသစ်တိုးလျှင် auto ပေါ်စေရန်) ---
  const dynamicCategories = useMemo(() => {
    // Sheet ထဲမှ Category အမည်အားလုံးကို ဆွဲထုတ်ပြီး ပွားနေသည်များကို ဖယ်ထုတ်ခြင်း
    const uniqueCats = [...new Set(products.map(p => getPProp(p, 'Category')).filter(Boolean))];
    
    // Icon သတ်မှတ်ချက်များ (နာမည်တူလျှင် ဤ icon များကို သုံးမည်)
    const iconMap = {
      'Game': <Gamepad2 size={24} />,
      'Digital product': <Smartphone size={24} />,
      'Online class': <BookOpen size={24} />,
      'Gsm reseller': <Settings size={24} />,
      'Gift Card': <Star size={24} />,
    };

    return uniqueCats.map(cat => ({
      id: cat,
      name: cat,
      // အကယ်၍ icon သတ်မှတ်မထားသော category အသစ်ဖြစ်ပါက Layers icon ကို အလိုအလျောက် သုံးမည်
      icon: iconMap[cat] || <Layers size={24} />
    }));
  }, [products]);

  // --- (၃) AUTHENTICATION LOGIC ---
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
      const isAdmin = ADMIN_EMAILS.includes(u.email);

      if (docSnap.exists()) {
        currentProfile = docSnap.data();
        if (isAdmin && currentProfile.tier !== 'Admin / Owner') {
            currentProfile.tier = 'Admin / Owner';
            currentProfile.role = 'admin';
            await setDoc(docRef, currentProfile, { merge: true });
        }
      } else {
        currentProfile = {
          name: u.displayName || "User",
          email: u.email,
          tier: isAdmin ? 'Admin / Owner' : 'Standard', 
          role: isAdmin ? 'admin' : 'user',
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

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    const updatedData = { ...profile, name: editName, contact: editContact };
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), updatedData);
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', user.uid), updatedData);
      setProfile(updatedData);
      setIsEditingProfile(false);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // --- (၄) DATA FETCHING ---
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

  const handleOrder = async () => {
    if (!editContact && !profile?.contact || !user) return;
    setLoading(true);
    const orderData = {
      userId: user.uid,
      userName: profile?.name || user.displayName,
      userEmail: user.email,
      productName: getPProp(selectedPlan, 'Name'),
      plan: getPProp(selectedPlan, 'Plan'),
      price: getPProp(selectedPlan, 'Price'),
      contact: editContact || profile?.contact,
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
    if (!url || typeof url !== 'string') return LOGO_URL;
    const id = url?.match(/[-\w]{25,}/);
    return id ? `https://lh3.googleusercontent.com/d/${id[0]}=s800` : LOGO_URL;
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

  const BottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a192f]/95 backdrop-blur-xl border-t border-blue-900/20 p-5 flex justify-around items-center z-50 rounded-t-[2.5rem] lg:max-w-4xl mx-auto shadow-2xl shadow-black">
      <button onClick={() => setView('home')} className={`p-2 transition-all ${view === 'home' ? 'text-blue-500 scale-125' : 'text-slate-500 hover:text-blue-400'}`}><ShoppingBag size={28}/></button>
      <button onClick={() => setView('customer_dash')} className={`p-2 transition-all ${view === 'customer_dash' ? 'text-blue-500 scale-125' : 'text-slate-500 hover:text-blue-400'}`}><History size={28}/></button>
      {profile?.role === 'admin' && <button onClick={() => setAdminTab('orders') || setView('admin_dash')} className={`p-2 transition-all ${view === 'admin_dash' ? 'text-blue-500 scale-125' : 'text-slate-500 hover:text-blue-400'}`}><ShieldCheck size={28}/></button>}
      <button onClick={() => setView('profile')} className={`p-2 transition-all ${view === 'profile' ? 'text-blue-500 scale-125' : 'text-slate-500 hover:text-blue-400'}`}><User size={28}/></button>
    </nav>
  );

  if (loading) return (
    <div className="min-h-screen bg-[#0a192f] flex flex-col items-center justify-center text-white">
      <Loader2 className="animate-spin text-blue-500" size={50}/>
      <p className="mt-6 text-xs uppercase font-black tracking-[0.3em] text-blue-400 animate-pulse">Syncing MM Tech Hub</p>
    </div>
  );

  return (
    <div className="bg-[#050d1a] min-h-screen text-white font-sans overflow-x-hidden selection:bg-blue-500 selection:text-white">
      <div className="max-w-md lg:max-w-6xl mx-auto w-full min-h-screen flex flex-col relative lg:bg-[#0a192f]/50 border-x border-blue-900/10 shadow-2xl shadow-black">
        
        {/* --- VIEW: WELCOME --- */}
        {view === 'welcome' && (
          <div className="flex flex-col flex-1 items-center justify-center py-20 px-8 text-center animate-in fade-in zoom-in duration-700">
            <div className="flex flex-col items-center max-w-sm text-center">
                <div className="w-40 h-40 bg-[#112240] rounded-[3rem] border-2 border-blue-500/20 shadow-[0_0_50px_rgba(37,99,235,0.15)] mb-10 flex items-center justify-center overflow-hidden p-2 transition-transform hover:scale-105">
                    <img src={LOGO_URL} className="w-full h-full object-cover rounded-[2.8rem]" alt="MM Tech Logo" />
                </div>
                <h1 className="text-4xl lg:text-5xl font-black mb-4 tracking-tight">MM Tech Store</h1>
                <p className="text-slate-400 text-md lg:text-lg mb-12 leading-relaxed">Myanmar's Premium Destination for Digital Solutions & Services.</p>
                <div className="w-full space-y-5">
                    <button onClick={handleLogin} className="w-full bg-white text-black py-5 rounded-2xl font-black shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all text-lg hover:bg-slate-100">
                        <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="G"/> Login with Google
                    </button>
                    <button onClick={() => setView('home')} className="w-full bg-slate-800/40 text-slate-400 py-4 rounded-2xl font-bold text-sm hover:bg-slate-800/60 transition-colors">Browse as Guest</button>
                </div>
            </div>
          </div>
        )}

        {/* --- VIEW: HOME --- */}
        {view === 'home' && (
          <>
            <div className="bg-[#0d1b33]/80 backdrop-blur-md p-6 lg:p-10 rounded-b-[3rem] shadow-2xl border-b border-blue-900/30 sticky top-0 z-30">
              <div className="flex justify-between items-center mb-8">
                <div className="text-left text-white">
                  <p className="text-blue-500 text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] mb-1">Premium Platform</p>
                  <h2 className="text-2xl lg:text-3xl font-black text-left">Hi, {profile?.name.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Guest'}</h2>
                </div>
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl border-2 border-blue-600 p-1 overflow-hidden shadow-lg transform hover:rotate-6 transition-transform">
                    {user ? <img src={user.photoURL} className="w-full h-full rounded-xl" alt="U"/> : <img src={LOGO_URL} className="w-full h-full rounded-xl" alt="L"/>}
                </div>
              </div>
              <div className="relative max-w-2xl mx-auto text-left">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input type="text" placeholder="Search digital services..." className="w-full bg-[#0a192f] border border-blue-900/40 text-white py-4.5 pl-14 pr-6 rounded-[1.5rem] outline-none focus:ring-2 ring-blue-500/20 text-md transition-all font-medium" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
            </div>

            <div className="px-6 lg:px-12 py-8 pb-40 overflow-y-auto text-left">
                {/* Dynamic Category List (Excel မှ အလိုအလျောက် ပေါ်မည်) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-12">
                  {dynamicCategories.map(c => (
                    <button key={c.id} onClick={() => { setSelectedCat(c.id); setView('category_view'); }} className="bg-[#112240]/60 p-6 rounded-[2.2rem] flex flex-col items-center gap-4 border border-blue-900/10 hover:border-blue-500/30 hover:bg-[#112240] transition-all group shadow-xl">
                      <div className="p-4 bg-blue-600/10 rounded-2xl text-blue-400 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">{c.icon}</div>
                      <span className="text-[13px] font-black text-slate-200 uppercase tracking-wide">{c.name}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between mb-8 text-left">
                    <h3 className="text-slate-500 text-xs lg:text-sm font-black uppercase tracking-[0.2em] ml-2">Popular Services</h3>
                    <div className="h-[1px] flex-1 bg-blue-900/20 mx-6 hidden lg:block"></div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6 text-left">
                  {groupedProducts.filter(g => searchQuery === '' || g.name.toLowerCase().includes(searchQuery.toLowerCase())).map(group => (
                    <div key={group.name} onClick={() => { setSelectedGroup(group); setView('group_details'); }} className="bg-[#112240]/40 p-3 rounded-[1.8rem] border border-blue-900/20 hover:border-blue-500/40 active:scale-95 text-center flex flex-col cursor-pointer group shadow-lg transition-all hover:shadow-blue-500/5">
                      <div className="aspect-square bg-[#0a192f] rounded-[1.5rem] overflow-hidden mb-3 relative">
                        <img src={formatImg(group.image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" alt="I"/>
                        <div className="absolute top-2 right-2 bg-blue-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-black shadow-lg">{group.plans.length}</div>
                      </div>
                      <h4 className="text-[11px] lg:text-[13px] font-black truncate px-2 text-slate-100 mb-1 leading-tight text-left">{group.name}</h4>
                      <span className="text-blue-500 text-[9px] font-black uppercase tracking-wider mb-2 opacity-80 group-hover:opacity-100 text-left px-2">View Shop</span>
                    </div>
                  ))}
                </div>
            </div>
            <BottomNav />
          </>
        )}

        {/* --- VIEW: GROUP DETAILS --- */}
        {view === 'group_details' && (
          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden animate-in slide-in-from-right duration-500">
            <div className="relative h-[35vh] lg:h-full lg:w-1/2 flex-shrink-0 lg:border-r border-blue-900/20">
                <img src={formatImg(selectedGroup?.image)} className="w-full h-full object-cover opacity-60 lg:opacity-80" alt="B"/>
                <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#0a192f] via-transparent to-transparent"></div>
                <button onClick={() => setView('home')} className="absolute top-8 left-8 p-3 bg-black/40 backdrop-blur-md rounded-2xl active:scale-90 transition-transform text-white border border-white/10 z-20"><ArrowLeft size={22}/></button>
                <div className="absolute bottom-10 left-10 hidden lg:block max-w-md text-left">
                    <h2 className="text-5xl font-black text-white leading-tight mb-4">{selectedGroup?.name}</h2>
                    <p className="text-slate-300 text-lg italic text-left">Explore our premium plans and enjoy seamless digital access.</p>
                </div>
            </div>

            <div className="px-8 lg:px-12 -mt-12 lg:mt-0 relative z-10 flex-1 flex flex-col text-left overflow-y-auto pb-40 lg:py-20 bg-[#0a192f] lg:bg-transparent rounded-t-[3rem] lg:rounded-none">
                <div className="lg:hidden mb-10 text-left">
                    <h2 className="text-3xl font-black text-white mb-2 leading-tight">{selectedGroup?.name}</h2>
                    <p className="text-slate-400 text-sm italic text-left">Select your preferred package</p>
                </div>
                
                <h3 className="hidden lg:block text-blue-500 text-sm font-black uppercase tracking-[0.2em] mb-10 text-left">Available Packages</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                  {selectedGroup?.plans.map((p, i) => (
                    <button key={i} onClick={() => { setSelectedPlan(p); setView('checkout'); }} className="w-full bg-[#112240] p-6 rounded-[2rem] border border-blue-900/30 flex items-center justify-between active:border-blue-500 hover:border-blue-500/50 shadow-xl group transition-all">
                      <div className="flex items-center gap-5 text-left">
                        <div className="p-3.5 bg-blue-600/10 rounded-2xl text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors"><ShoppingBag size={24} /></div>
                        <div className="text-left">
                            <h4 className="text-md font-black text-white mb-1 group-hover:text-blue-300 transition-colors text-left">{getPProp(p, 'Plan')}</h4>
                            <p className="text-blue-500 font-black text-lg text-left">{getPProp(p, 'Price')} Ks</p>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full border border-blue-900/30 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white group-hover:border-transparent transition-all"><ChevronRight size={20} /></div>
                    </button>
                  ))}
                </div>
            </div>
            <BottomNav />
          </div>
        )}

        {/* --- VIEW: CATEGORY VIEW --- */}
        {view === 'category_view' && (
          <div className="flex flex-col flex-1 pb-40 text-left">
            <header className="p-8 lg:p-12 bg-[#112240]/80 backdrop-blur-md border-b border-blue-900/30 flex items-center gap-6 sticky top-0 z-30 shadow-2xl text-white text-left">
                <button onClick={() => setView('home')} className="p-3 bg-[#0a192f] border border-blue-900/50 rounded-2xl active:scale-90 transition-transform"><ArrowLeft size={24}/></button>
                <div>
                    <h2 className="text-3xl font-black tracking-tight">{selectedCat}</h2>
                    <p className="text-blue-400 text-xs font-black uppercase tracking-widest">Browse Category Items</p>
                </div>
            </header>
            <div className="p-6 lg:p-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 text-left overflow-y-auto">
              {groupedProducts.filter(g => g.category === selectedCat).map(group => (
                <div key={group.name} onClick={() => { setSelectedGroup(group); setView('group_details'); }} className="bg-[#112240]/40 p-3 rounded-[2rem] border border-blue-900/20 hover:border-blue-500/40 active:scale-95 text-center flex flex-col shadow-lg transition-all group">
                    <div className="aspect-square bg-[#0a192f] rounded-[1.6rem] overflow-hidden mb-3"><img src={formatImg(group.image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Group" /></div>
                    <h4 className="text-[12px] font-black truncate px-1 text-white mb-1">{group.name}</h4>
                    <p className="text-blue-400 text-[9px] font-bold uppercase tracking-wider">{group.plans.length} Packages</p>
                </div>
              ))}
            </div>
            <BottomNav />
          </div>
        )}

        {/* --- VIEW: CHECKOUT --- */}
        {view === 'checkout' && (
          <div className="p-8 lg:p-16 text-left flex flex-col lg:flex-row flex-1 pb-40 overflow-y-auto items-center lg:items-start gap-12">
            <div className="w-full lg:w-1/2">
                <button onClick={() => setView('group_details')} className="w-12 h-12 bg-[#112240] rounded-2xl flex items-center justify-center mb-8 active:scale-90 transition-transform border border-blue-900/20 text-white"><ArrowLeft size={24}/></button>
                <div className="bg-[#112240] p-10 lg:p-14 rounded-[3.5rem] border border-blue-900/30 text-center shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-32 h-32 mx-auto mb-8 rounded-[2.5rem] overflow-hidden border-2 border-blue-600/30 shadow-2xl transition-transform hover:scale-110 duration-500"><img src={formatImg(getPProp(selectedPlan, 'Link'))} className="w-full h-full object-cover" alt="I"/></div>
                    <h3 className="text-2xl lg:text-3xl font-black text-white mb-2">{getPProp(selectedPlan, 'Name')}</h3>
                    <p className="text-blue-400 font-black text-lg mb-8 tracking-wide uppercase">{getPProp(selectedPlan, 'Plan')}</p>
                    <div className="text-4xl font-black text-white bg-[#0a192f]/50 py-5 rounded-3xl border border-blue-900/20 shadow-inner">{getPProp(selectedPlan, 'Price')} <span className="text-sm font-bold text-slate-400 ml-1 font-sans">Ks</span></div>
                </div>
            </div>

            <div className="w-full lg:w-1/2 lg:pt-20 text-left">
                <div className="mb-10 text-left">
                    <label className="block text-slate-500 text-[11px] font-black uppercase ml-1 mb-4 tracking-[0.2em] text-left">Customer Contact Details</label>
                    <input type="text" placeholder="Telegram @ID / Phone Number" className="w-full bg-[#112240] border-2 border-blue-900/30 p-6 rounded-[1.5rem] outline-none focus:border-blue-500/50 text-white text-md transition-all shadow-inner font-bold" value={editContact || profile?.contact || ''} onChange={e => setEditContact(e.target.value)} />
                    <p className="mt-4 text-[11px] text-slate-500 italic ml-1 text-left">Admin မှ ဤအချက်အလက်မှတစ်ဆင့် ပစ္စည်းလာပို့ပေးပါမည်။</p>
                </div>
                <button onClick={handleOrder} disabled={loading || (!editContact && !profile?.contact) || !user} className="w-full bg-blue-600 hover:bg-blue-500 py-6 rounded-[1.5rem] font-black shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-4 text-xl text-white">
                {loading ? <Loader2 className="animate-spin" /> : <><Send size={24}/> Confirm Order Now</>}
                </button>
            </div>
            <BottomNav />
          </div>
        )}

        {/* --- VIEW: ADMIN DASHBOARD --- */}
        {view === 'admin_dash' && profile?.role === 'admin' && (
          <div className="p-8 lg:p-12 text-left flex flex-col flex-1 pb-40 overflow-y-auto text-white">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 text-left">
                <h2 className="text-3xl font-black text-white flex items-center gap-4 text-left"><ShieldCheck size={40} className="text-blue-500"/> Management Console</h2>
                <div className="flex bg-[#112240] p-1.5 rounded-2xl border border-blue-900/30 shadow-2xl">
                    <button onClick={() => setAdminTab('orders')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${adminTab === 'orders' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Order Queue</button>
                    <button onClick={() => setAdminTab('members')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${adminTab === 'members' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>User Directory</button>
                </div>
            </div>

            {adminTab === 'orders' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                {allOrders.map(o => (
                    <div key={o.id} className="bg-[#112240]/80 p-6 rounded-[2.5rem] border border-blue-900/30 shadow-xl relative overflow-hidden text-left hover:border-blue-500/30 transition-colors">
                    <div className="flex justify-between mb-5 items-start">
                        <div className="text-left"><h4 className="font-black text-slate-100 text-lg leading-tight mb-1 text-left">{o.productName}</h4><p className="text-sm text-blue-400 font-bold uppercase tracking-wide text-left">{o.plan} - {o.price} Ks</p></div>
                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider ${o.status === 'Completed' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 animate-pulse'}`}>{o.status}</span>
                    </div>
                    <div className="bg-[#0a192f]/50 p-5 rounded-2xl mb-6 text-xs space-y-3 border border-blue-900/10 shadow-inner text-left">
                        <p className="flex justify-between items-center text-left"><span className="text-slate-500 font-bold uppercase text-left">Customer:</span> <span className="text-slate-100 font-black text-left">{o.userName}</span></p>
                        <p className="flex justify-between items-center text-left"><span className="text-slate-500 font-bold uppercase text-left">Contact:</span> <span className="text-blue-400 font-black text-left">{o.contact}</span></p>
                    </div>
                    {o.status === 'Pending' && <button onClick={() => updateStatus(o.id, 'Completed')} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-black text-sm shadow-xl active:scale-95 transition-all text-white">Deliver Product</button>}
                    </div>
                ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                    {allMembers.map(m => (
                        <div key={m.uid} className="bg-[#112240]/60 p-6 rounded-[2.5rem] border border-blue-900/30 flex flex-col gap-6 text-left shadow-xl">
                            <div className="flex items-center gap-5 text-left">
                                <img src={m.photoURL || LOGO_URL} className="w-14 h-14 rounded-2xl border-2 border-blue-600/30 shadow-md" alt="M"/>
                                <div className="flex-1 overflow-hidden text-left">
                                    <h4 className="font-black text-md truncate text-white text-left">{m.name}</h4>
                                    <p className="text-[10px] text-slate-500 truncate font-bold text-left">{m.email}</p>
                                </div>
                                <div className="p-2 bg-blue-600/10 rounded-xl"><BadgeCheck size={20} className="text-blue-500"/></div>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-blue-900/10 text-left"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">Active Tier</span><span className="text-blue-400 font-black text-xs text-left">{m.tier}</span></div>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => updateMemberTier(m.uid, 'Standard')} className={`py-2.5 rounded-xl text-[8px] font-black uppercase active:scale-95 transition-all border ${m.tier === 'Standard' ? 'bg-blue-600 text-white border-blue-500' : 'bg-[#0a192f] text-slate-500 border-blue-900/20'}`}>Standard</button>
                                <button onClick={() => updateMemberTier(m.uid, 'VIP')} className={`py-2.5 rounded-xl text-[8px] font-black uppercase active:scale-95 transition-all border ${m.tier === 'VIP' ? 'bg-yellow-600 text-white border-yellow-500' : 'bg-[#0a192f] text-yellow-500/50 border-blue-900/20'}`}>VIP</button>
                                <button onClick={() => updateMemberTier(m.uid, 'Reseller')} className={`py-2.5 rounded-xl text-[8px] font-black uppercase active:scale-95 transition-all border ${m.tier === 'Reseller' ? 'bg-purple-600 text-white border-purple-500' : 'bg-[#0a192f] text-purple-500/50 border-blue-900/20'}`}>Reseller</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <BottomNav />
          </div>
        )}

        {/* --- VIEW: PROFILE --- */}
        {view === 'profile' && (
            <div className="p-10 lg:p-20 text-center flex flex-col flex-1 items-center justify-center pb-40 overflow-y-auto text-left">
                {user ? (
                    <div className="w-full max-w-lg flex flex-col items-center animate-in zoom-in duration-500 text-left">
                        <div className="w-32 h-32 rounded-[2.5rem] border-4 border-blue-600 p-1.5 mb-8 shadow-2xl relative">
                            <img src={user.photoURL} className="rounded-[2.2rem] w-full h-full object-cover" alt="U"/>
                            <div className="absolute -bottom-2 -right-2 bg-blue-600 p-2.5 rounded-2xl border-4 border-[#0a192f] shadow-lg"><BadgeCheck size={24} className="text-white"/></div>
                        </div>
                        {isEditingProfile ? (
                            <div className="w-full space-y-6 mb-10 text-left bg-[#112240] p-8 rounded-[3rem] border border-blue-900/30">
                                <div className="text-left"><label className="block text-slate-500 text-[10px] font-black uppercase ml-1 mb-2 tracking-widest text-left">Display Name</label><input type="text" className="w-full bg-[#0a192f] border border-blue-900/40 p-5 rounded-2xl outline-none text-md text-white font-bold" value={editName} onChange={e => setEditName(e.target.value)} /></div>
                                <div className="text-left"><label className="block text-slate-500 text-[10px] font-black uppercase ml-1 mb-2 tracking-widest text-left">Contact Info</label><input type="text" className="w-full bg-[#0a192f] border border-blue-900/40 p-5 rounded-2xl outline-none text-md text-white font-bold" value={editContact} onChange={e => setEditContact(e.target.value)} /></div>
                                <div className="grid grid-cols-2 gap-4"><button onClick={() => setIsEditingProfile(false)} className="bg-slate-800 py-4 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all text-white">Cancel</button><button onClick={handleUpdateProfile} className="bg-blue-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 shadow-lg transition-all text-white">Save Changes</button></div>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-3xl font-black mb-1 leading-tight text-white text-left">{profile?.name || user.displayName}</h2>
                                <p className="text-blue-400 text-sm font-bold mb-10 tracking-wide text-left">{user.email}</p>
                                <div className="bg-[#112240]/80 p-10 rounded-[3.5rem] border border-blue-900/30 mb-10 text-left shadow-2xl w-full">
                                    <div className="flex justify-between items-center py-5 border-b border-blue-900/20 text-left"><span className="text-slate-400 font-black text-[11px] uppercase tracking-[0.2em] text-left">Membership</span><span className={`px-4 py-1.5 rounded-full font-black text-[11px] uppercase shadow-lg ${profile?.tier === 'Admin / Owner' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-blue-400'}`}>{profile?.tier}</span></div>
                                    <div className="flex justify-between items-center py-5 border-b border-blue-900/20 text-left"><span className="text-slate-400 font-black text-[11px] uppercase tracking-[0.2em] text-left">Contact</span><span className="text-white font-black text-md text-left">{profile?.contact || 'Not set'}</span></div>
                                    <button onClick={() => setIsEditingProfile(true)} className="w-full mt-6 text-blue-500 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 py-3 rounded-2xl transition-all hover:bg-blue-600/10 border border-transparent hover:border-blue-900/30"><Edit3 size={16}/> Update Account Details</button>
                                </div>
                            </>
                        )}
                        <button onClick={async () => { await signOut(auth); setView('welcome'); }} className="text-red-500 font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:bg-red-500/10 px-12 py-4 rounded-2xl transition-all border border-red-500/20 shadow-lg"><LogOut size={22}/> Logout System</button>
                    </div>
                ) : <button onClick={handleLogin} className="bg-white text-black px-12 py-5 rounded-[2rem] font-black shadow-2xl active:scale-95 transition-all text-lg">Login with Google</button>}
                <BottomNav />
            </div>
        )}

        {/* --- VIEW: CUSTOMER DASHBOARD --- */}
        {view === 'customer_dash' && (
          <div className="p-8 lg:p-12 text-left flex flex-col flex-1 pb-40 overflow-y-auto text-white">
            <h2 className="text-3xl font-black mb-2 text-left text-white">Purchase History</h2>
            <p className="text-slate-500 text-sm mb-12 text-left italic">Your recent digital product orders</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                {myOrders.map(o => (
                  <div key={o.id} className="bg-[#112240]/60 p-6 rounded-[2.5rem] border border-blue-900/30 flex flex-col justify-between shadow-xl hover:border-blue-500/30 transition-all text-left">
                    <div className="text-left text-white mb-6">
                        <div className="flex justify-between items-start mb-4 text-left">
                            <h4 className="font-black text-md lg:text-lg text-white leading-tight flex-1 text-left">{o.productName}</h4>
                            <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase ${o.status === 'Completed' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>{o.status}</span>
                        </div>
                        <p className="text-blue-500 font-black text-md mb-4 text-left">{o.plan} • {o.price} Ks</p>
                        <div className="bg-[#0a192f]/40 p-4 rounded-xl space-y-2 border border-blue-900/10 shadow-inner text-left">
                            <p className="text-[10px] text-slate-500 flex items-center gap-2 font-bold uppercase text-left"><Clock size={12}/> Order Date</p>
                            <p className="text-[11px] text-slate-300 font-medium text-left">{o.date}</p>
                        </div>
                    </div>
                  </div>
                ))}
                {myOrders.length === 0 && <div className="col-span-full py-32 text-center flex flex-col items-center gap-4 opacity-40"><ShoppingBag size={60} className="text-slate-600"/><p className="italic text-lg">ဝယ်ယူထားသည့် မှတ်တမ်းမရှိသေးပါရှင်။</p></div>}
            </div>
            <BottomNav />
          </div>
        )}

      </div>
    </div>
  );
}
