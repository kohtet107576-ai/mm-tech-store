import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, updateDoc, query, orderBy } from 'firebase/firestore';
import { ShoppingBag, ArrowLeft, CheckCircle2, Loader2, User, ShieldCheck, LogOut, Send, Save, Image as ImageIcon, History, Plus, X, Search, ShoppingCart, LogIn, Facebook, Share2, MessageCircle, ChevronRight, Trash2, FileText } from 'lucide-react';

// --- CONFIGURATION ---
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
  const [activeMember, setActiveMember] = useState(null);

  // --- CORE LOGIC ---
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
      setAllOrders(docs); setMyOrders(docs.filter(o => o.userId === user.uid));
    });
    
    const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    onSnapshot(userRef, (doc) => { if(doc.exists()) setProfile(doc.data()); });

    if (profile?.role === 'admin') {
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'members'), (sn) => setAllMembers(sn.docs.map(d => ({ id: d.id, ...d.data() }))));
      onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), orderBy('timestamp', 'desc')), (sn) => {
        setSysLogs(sn.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
  }, [user, profile?.role]);

  const getDisplayPrice = (plan) => {
    const tier = profile?.tier || 'Standard';
    return getPProp(plan, `Price_${tier}`) || getPProp(plan, 'Price') || 0;
  };

  const handleOrder = async () => {
    if (!user) return setView('welcome');
    const isCrd = selectedPayment?.id === 'crd';
    const totalPrice = cart.reduce((s, i) => s + parseInt(getDisplayPrice(i)), 0);
    if (isCrd && profile.balance < totalPrice) return alert("❌ လက်ကျန်ငွေ မလုံလောက်ပါ။");
    
    setLoading(true);
    try {
      if (isCrd) {
        const newBal = profile.balance - totalPrice;
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), { balance: newBal });
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', user.uid), { balance: newBal });
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), { type: 'Purchase', targetUser: profile.name, targetGmail: profile.email, amount: -totalPrice, newBalance: newBal, detail: cart.map(i=>i.Name).join(","), date: new Date().toLocaleString(), timestamp: Date.now() });
      }
      const orderData = { userId: user.uid, userGmail: user.email, userName: profile?.name, product: cart.map(i => getPProp(i, 'Name')).join(", "), price: totalPrice, contact: editContact, paymentMethod: selectedPayment.name, date: new Date().toLocaleString() };
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), { ...orderData, status: 'Pending', timestamp: Date.now() });
      setCart([]); setView('order_success');
    } catch(e) { alert(e.message); } finally { setLoading(false); }
  };

  // --- RENDER PARTS ---
  const MainHeader = () => <div className="flex items-center justify-between p-4 bg-[#0a192f]/95 sticky top-0 z-40 border-b border-blue-900/20"><div className="flex items-center gap-2"><img src={LOGO_URL} className="w-8 h-8 rounded-lg" alt="L"/><h2 className="text-sm font-black text-white">MM Tech</h2></div><div className="relative cursor-pointer" onClick={() => setView('cart_view')}><ShoppingCart size={22} className="text-blue-500" />{cart.length > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{cart.length}</span>}</div></div>;
  
  const BottomNav = () => <nav className="fixed bottom-0 left-0 w-full bg-[#0a192f] p-5 flex justify-around border-t border-blue-900/10 z-50"><button onClick={() => setView('home')}><ShoppingBag size={24} className={view === 'home' ? 'text-blue-500' : 'text-slate-500'}/></button><button onClick={() => setView('customer_dash')}><History size={24} className={view === 'customer_dash' ? 'text-blue-500' : 'text-slate-500'}/></button>{profile?.role === 'admin' && <button onClick={() => setView('admin_dash')}><ShieldCheck size={24} className={view === 'admin_dash' ? 'text-blue-500' : 'text-slate-500'}/></button>}<button onClick={() => setView('profile')}><User size={24} className={view === 'profile' ? 'text-blue-500' : 'text-slate-500'}/></button></nav>;

  if (view === 'initializing') return <div className="min-h-screen bg-[#050d1a] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40}/></div>;

  return (
    <div className="bg-[#050d1a] min-h-screen text-white font-sans">
      <div className="w-full max-w-lg mx-auto bg-[#0a192f] min-h-screen relative">
        {view === 'home' && <><MainHeader /><div className="p-6">{/* PRODUCTS CONTENT HERE */}<BottomNav /></></>}
        {view === 'admin_dash' && (
          <div className="p-6 pb-40">
            <MainHeader />
            <div className="flex gap-2 my-6">
              <button onClick={() => setAdminTab('orders')} className="bg-blue-600 px-4 py-2 rounded-xl text-xs font-bold">Orders</button>
              <button onClick={() => setAdminTab('members')} className="bg-blue-600 px-4 py-2 rounded-xl text-xs font-bold">Users</button>
              <button onClick={() => setAdminTab('logs')} className="bg-blue-600 px-4 py-2 rounded-xl text-xs font-bold">Logs</button>
            </div>
            
            {adminTab === 'members' && !activeMember && (
              <div className="space-y-3">{allMembers.map(m => (
                <div key={m.uid} onClick={() => { setActiveMember(m); setAdminTab('member_history'); }} className="bg-[#112240] p-4 rounded-2xl flex justify-between items-center cursor-pointer">
                  <p className="font-bold text-sm">{m.name}</p><p className="text-xs text-blue-400">{m.balance} Ks</p>
                </div>
              ))}</div>
            )}

            {adminTab === 'member_history' && activeMember && (
              <div className="animate-in fade-in">
                <button onClick={() => { setActiveMember(null); setAdminTab('members'); }} className="mb-4 flex items-center text-blue-500 text-xs"><ArrowLeft size={16}/> Back</button>
                <h3 className="text-xl font-black">{activeMember.name}</h3>
                <p className="text-sm text-slate-400 mb-6">Balance: {activeMember.balance || 0} Ks</p>
                
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">History</h4>
                <div className="space-y-2">
                  {sysLogs.filter(l => l.targetGmail === activeMember.email).map(l => (
                    <div key={l.id} className="bg-[#112240] p-3 rounded-lg flex justify-between text-xs">
                      <span>{l.detail}</span><span className={l.amount > 0 ? 'text-green-500' : 'text-red-500'}>{l.amount} Ks</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {adminTab === 'logs' && (
              <div className="space-y-2">{sysLogs.map(l => (
                <div key={l.id} className="bg-[#112240] p-3 rounded-lg text-xs">
                  <p className="font-bold text-white">{l.targetUser}</p><p className="text-slate-400">{l.detail} - {l.amount} Ks</p>
                </div>
              ))}</div>
            )}
            <BottomNav />
          </div>
        )}
        {/* view logic များ ဆက်လက် ထည့်သွင်းရန် */}
      </div>
    </div>
  );
}
