import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, updateDoc, query, orderBy } from 'firebase/firestore';
import { ShoppingBag, ArrowLeft, CheckCircle2, Loader2, User, ShieldCheck, LogOut, Send, Save, Image as ImageIcon, History, Plus, X, Search, ShoppingCart, LogIn, Facebook, Share2, MessageCircle, ChevronRight, Trash2 } from 'lucide-react';

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
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [editContact, setEditContact] = useState('');
  const [adminTab, setAdminTab] = useState('orders'); 
  const [deliveryInputs, setDeliveryInputs] = useState({});
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [payImg, setPayImg] = useState("");
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [isSocialOpen, setIsSocialOpen] = useState(false);

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
    }
  }, [user, profile?.role]);

  const handleOrder = async () => {
    if (!user) return setView('welcome');
    const isCrd = selectedPayment?.id === 'crd';
    const totalPrice = cart.reduce((s, i) => s + parseInt(getDisplayPrice(i)), 0);
    if (cart.length === 0 || !editContact.trim() || (!payImg && !isCrd) || !selectedPayment) return alert("အချက်အလက်များ ပြည့်စုံစွာ ဖြည့်ပေးပါဗျ။");
    if (isCrd && (profile?.balance || 0) < totalPrice) return alert("❌ လက်ကျန်ငွေ မလုံလောက်ပါ။");
    setLoading(true);
    try {
      if (isCrd) {
        const newBalance = (profile?.balance || 0) - totalPrice;
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), { balance: newBalance });
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', user.uid), { balance: newBalance });
      }
      const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), { userId: user.uid, userGmail: user.email, userName: profile?.name, product: cart.map(i => getPProp(i, 'Name')).join(", "), plan: cart.map(i => getPProp(i, 'Plan')).join(", "), price: totalPrice, contact: editContact, paymentMethod: selectedPayment.name, payImage: isCrd ? "" : payImg, status: 'Pending', timestamp: Date.now(), date: new Date().toLocaleString('en-GB') });
      fetch(SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify({ type: "new_order", orderId: docRef.id, userName: profile?.name, product: cart.map(i => getPProp(i, 'Name')).join(", "), price: totalPrice, contact: editContact }) });
      setCart([]); setPayImg(""); setView('order_success');
    } catch (e) { alert("Error: " + e.message); } finally { setLoading(false); }
  };

  const updateOrderStatus = async (orderId, newStatus, resultData = "") => {
    try {
      setLoading(true);
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId), { status: newStatus, result: resultData });
      if (newStatus === 'Completed') {
        fetch(SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify({ type: "update_order", orderId, resultData }) });
      }
      alert("Updated Successfully!");
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  const getDisplayPrice = (plan) => {
    const tier = profile?.tier || 'Standard';
    return getPProp(plan, `Price_${tier}`) || getPProp(plan, 'Price') || 0;
  };

  const groupedProducts = useMemo(() => {
    const groups = {};
    products.forEach(p => {
      const name = getPProp(p, 'Name');
      if (name && name.toLowerCase().includes(searchTerm.toLowerCase())) {
        if (!selectedCat || getPProp(p, 'Category') === selectedCat) {
          if (!groups[name]) groups[name] = { name, category: getPProp(p, 'Category'), image: getPProp(p, 'Link'), plans: [] };
          groups[name].plans.push(p);
        }
      }
    });
    return Object.values(groups);
  }, [products, searchTerm, selectedCat]);

  // Main Return
  return (
    <div className="bg-[#050d1a] min-h-screen text-white font-sans flex items-center justify-center">
      <div className="w-full max-w-md min-h-[100dvh] flex flex-col relative bg-[#0a192f] shadow-2xl">
        
        {/* VIEW: ADMIN DASHBOARD */}
        {view === 'admin_dash' && profile?.role === 'admin' ? (
          <div className="p-6 pb-40 flex-1">
            <div className="flex gap-2 my-8">
              {['orders', 'members'].map(t => <button key={t} onClick={()=>setAdminTab(t)} className={`px-4 py-2 rounded-xl text-[10px] font-black ${adminTab === t ? 'bg-blue-600' : 'bg-[#112240]'}`}>{t.toUpperCase()}</button>)}
            </div>
            
            {adminTab === 'orders' && allOrders.map(o => (
              <div key={o.id} className="bg-[#112240] p-6 mb-4 rounded-3xl border border-blue-900/30">
                <p className="text-[10px] text-slate-500">ID: {o.id}</p>
                <h4 className="font-black text-white">{o.product}</h4>
                <p className={`px-2 py-1 rounded text-[9px] inline-block ${o.status === 'Completed' ? 'bg-green-500/20' : o.status === 'Denied' ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>{o.status}</p>
                {o.status === 'Pending' && (
                  <div className="mt-4 flex flex-col gap-2">
                    <textarea className="bg-[#0a192f] p-2 text-xs w-full" onChange={e => setDeliveryInputs({...deliveryInputs, [o.id]: e.target.value})} />
                    <div className="flex gap-2"><button onClick={() => updateOrderStatus(o.id, 'Completed', deliveryInputs[o.id])} className="bg-blue-600 py-2 flex-1 text-xs font-black">CONFIRM</button>
                    <button onClick={async () => { const r = prompt("Reason:"); if(r) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', o.id), { status: 'Denied', result: r }); }} className="bg-red-600 py-2 flex-1 text-xs font-black">DENY</button></div>
                  </div>
                )}
              </div>
            ))}

            {adminTab === 'members' && allMembers.map(m => (
              <div key={m.uid} onClick={() => alert(`Detail:\nName: ${m.name}\nBal: ${m.balance} Ks\nUID: ${m.uid}`)} className="p-4 bg-[#112240] mb-2 rounded-2xl flex justify-between cursor-pointer">
                <span>{m.name}</span><span>{m.balance || 0} Ks</span>
              </div>
            ))}
          </div>
        ) : (
          /* ဒီနေရာမှာ အစ်ကို့ရဲ့ ပုံမှန် UI တွေကို ဆက်ရေးပါ */
          <div className="p-6 flex-1 text-center mt-20">Welcome to MM Tech Store</div>
        )}
      </div>
    </div>
  );
}
