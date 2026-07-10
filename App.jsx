import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, updateDoc, query, orderBy } from 'firebase/firestore';
import { ShoppingBag, ArrowLeft, CheckCircle2, Loader2, User, ShieldCheck, LogOut, Send, Save, Image as ImageIcon, History, Plus, X, Search, ShoppingCart, LogIn, Facebook, Share2, MessageCircle, ChevronRight, Trash2, Wallet, FileText } from 'lucide-react';

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
  const [activeMember, setActiveMember] = useState(null);
  const [deliveryInputs, setDeliveryInputs] = useState({});
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [payImg, setPayImg] = useState("");
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [isSocialOpen, setIsSocialOpen] = useState(false);

  // --- LOGIC ---
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
    onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderBy('timestamp', 'desc')), (sn) => {
      const docs = sn.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllOrders(docs); setMyOrders(docs.filter(o => o.userId === user.uid));
    });
    onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), (doc) => { if(doc.exists()) setProfile(doc.data()); });
    if (profile?.role === 'admin') {
      onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'members'), (sn) => setAllMembers(sn.docs.map(d => ({ id: d.id, ...d.data() }))));
      onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), orderBy('timestamp', 'desc')), (sn) => setSysLogs(sn.docs.map(d => ({ id: d.id, ...d.data() }))));
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
        alert(`✅ အောင်မြင်ပါသည်။ \n💸 ဖြတ်တောက်ငွေ: -${totalPrice} Ks\n💰 လက်ကျန်ငွေ: ${newBal} Ks`);
      }
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), { userId: user.uid, userGmail: user.email, userName: profile?.name, product: cart.map(i => getPProp(i, 'Name')).join(", "), plan: cart.map(i => getPProp(i, 'Plan')).join(", "), price: totalPrice, contact: editContact, paymentMethod: selectedPayment.name, payImage: isCrd ? "" : payImg, date: new Date().toLocaleString(), status: 'Pending', timestamp: Date.now() });
      setCart([]); setView('order_success');
    } catch(e) { alert(e.message); } finally { setLoading(false); }
  };

  const updateOrderStatus = async (orderId, newStatus, resultData = "") => {
    try {
      setLoading(true);
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId), { status: newStatus, result: resultData });
      alert("Updated Successfully!");
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  // --- UI START ---
  const MainHeader = () => <div className="flex items-center justify-between p-4 bg-[#0a192f] border-b border-blue-900/20"><div className="flex items-center gap-2"><img src={LOGO_URL} className="w-8 h-8 rounded-lg" alt="L"/><h2 className="text-sm font-black text-white">MM Tech</h2></div><div className="relative cursor-pointer" onClick={() => setView('cart_view')}><ShoppingCart size={22} className="text-blue-500" />{cart.length > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px]">{cart.length}</span>}</div></div>;
  const BottomNav = () => <nav className="fixed bottom-0 left-0 w-full bg-[#0a192f] p-5 flex justify-around border-t border-blue-900/10 z-50"><button onClick={() => setView('home')}><ShoppingBag size={24} className={view === 'home' ? 'text-blue-500' : 'text-slate-500'}/></button><button onClick={() => setView('customer_dash')}><History size={24} className={view === 'customer_dash' ? 'text-blue-500' : 'text-slate-500'}/></button>{profile?.role === 'admin' && <button onClick={() => setView('admin_dash')}><ShieldCheck size={24} className={view === 'admin_dash' ? 'text-blue-500' : 'text-slate-500'}/></button>}</nav>;

  if (view === 'initializing') return <div className="min-h-screen bg-[#050d1a] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40}/></div>;

  return (
    <div className="bg-[#050d1a] min-h-screen text-white font-sans max-w-lg mx-auto overflow-hidden">
        {/* မူလ Home UI နေရာဖြစ်ပါသည် */}
        {view === 'admin_dash' && (
            <div className="p-6 pb-40">
                <MainHeader />
                <div className="flex gap-2 my-6">
                    <button onClick={() => { setAdminTab('orders'); setActiveMember(null); }} className="bg-blue-600 px-3 py-1 rounded text-[10px]">Orders</button>
                    <button onClick={() => { setAdminTab('members'); setActiveMember(null); }} className="bg-blue-600 px-3 py-1 rounded text-[10px]">Users</button>
                    <button onClick={() => { setAdminTab('logs'); setActiveMember(null); }} className="bg-blue-600 px-3 py-1 rounded text-[10px]">Logs</button>
                </div>
                {adminTab === 'orders' && allOrders.map(o => (
                    <div key={o.id} className="bg-[#112240] p-4 rounded-xl mb-2 text-xs">
                        <p className="text-[10px] text-blue-400">ID: {o.id}</p>
                        <p>{o.product} - {o.price} Ks</p>
                        {o.status === 'Pending' && <div className="flex gap-2 mt-2"><button onClick={()=>updateOrderStatus(o.id,'Completed','Done')} className="bg-green-600 px-2 py-1 rounded">Confirm</button><button onClick={()=>updateOrderStatus(o.id,'Denied','ငွေဖြည့်ပေးပါ')} className="bg-red-600 px-2 py-1 rounded">Deny</button></div>}
                    </div>
                ))}
                {adminTab === 'members' && !activeMember && (
                    <div className="space-y-2">{allMembers.map(m => (
                        <div key={m.uid} onClick={() => { setActiveMember(m); setAdminTab('member_history'); }} className="bg-[#112240] p-3 rounded flex justify-between text-xs cursor-pointer">
                            <p>{m.name}</p><p>{m.balance || 0} Ks</p>
                        </div>
                    ))}</div>
                )}
                {adminTab === 'member_history' && activeMember && (
                    <div className="bg-[#112240] p-4 rounded text-xs">
                        <button onClick={() => { setActiveMember(null); setAdminTab('members'); }} className="mb-2 text-blue-400">← Back</button>
                        <p className="font-bold">{activeMember.name}</p><p className="mb-4">Balance: {activeMember.balance || 0} Ks</p>
                        <div className="space-y-1">{sysLogs.filter(l => l.targetGmail === activeMember.email).map(l => (
                            <div key={l.id} className="flex justify-between border-b border-white/10 py-1"><span>{l.detail}</span><span className={l.amount > 0 ? 'text-green-500' : 'text-red-500'}>{l.amount} Ks</span></div>
                        ))}</div>
                    </div>
                )}
                {adminTab === 'logs' && <div className="space-y-1">{sysLogs.map(l => (
                    <div key={l.id} className="bg-[#112240] p-2 rounded text-[10px] flex justify-between"><span>{l.targetUser}: {l.detail}</span><span className={l.amount > 0 ? 'text-green-500' : 'text-red-500'}>{l.amount} Ks</span></div>
                ))}</div>}
                <BottomNav />
            </div>
        )}
        {view === 'customer_dash' && (
            <div className="p-6 pb-40">
                <MainHeader />
                <h2 className="text-sm font-bold my-4">My History</h2>
                {myOrders.map(o => (<div key={o.id} className="bg-[#112240] p-3 rounded mb-2 text-xs">{o.product} - {o.status}</div>))}
                <h2 className="text-sm font-bold my-4">Balance Logs</h2>
                {sysLogs.filter(l => l.targetGmail === user?.email).map(l => (
                    <div key={l.id} className="p-2 bg-[#112240] rounded text-xs mb-1 flex justify-between"><span>{l.detail}</span><span className={l.amount > 0 ? 'text-green-500' : 'text-red-500'}>{l.amount} Ks</span></div>
                ))}
                <BottomNav />
            </div>
        )}
    </div>
  );
}
