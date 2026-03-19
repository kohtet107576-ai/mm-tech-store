import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, setPersistence, browserLocalPersistence, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { ShoppingBag, Gamepad2, Smartphone, BookOpen, Settings, History, ChevronRight, ArrowLeft, CheckCircle2, Search, Loader2, User, ShieldCheck, LogOut, Send, BadgeCheck, Save, Layers, Image as ImageIcon } from 'lucide-react';

// --- (၁) CONFIGURATION ---
const LOGO_URL = "https://drive.google.com/thumbnail?id=1Lh-nHgyLMSr3rBVe4OGnjEvEspuMokd6&sz=w1000"; 
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyC1MECq8ZNzdj-RxmBaMcFfSqVk9Ijt9uuRW-szeukWuCoNBhywDz0k7W1r5mCvjhR/exec";
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

// --- (၂) HELPER FUNCTIONS ---
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
  // --- (၃) STATES ---
  const [view, setView] = useState('initializing');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false); // Spinner လည်စေတာ ဒီ loading ပါ
  const [products, setProducts] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]); 
  const [allMembers, setAllMembers] = useState([]); 
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [editContact, setEditContact] = useState('');
  const [adminTab, setAdminTab] = useState('orders');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [techImg, setTechImg] = useState("");
  const [payImg, setPayImg] = useState("");

  // --- (၄) ROSE AI AGENT (n8n) ---
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://mmtechmdy.app.n8n.cloud/assets/chat.js'; 
    script.onload = () => {
      if (window.createChat) {
        window.createChat({
          webhookUrl: 'https://mmtechmdy.app.n8n.cloud/webhook/2f2ed367-cb30-411b-9cd6-1deac27cefdb/webhook',
          title: 'MM Tech Support (Rose)',
          welcomeMessage: 'မင်္ဂလာပါရှင်၊ MM Tech မှ Rose ပါ။ ဘာကူညီပေးရမလဲရှင့်?',
          avatarUrl: 'https://drive.google.com/thumbnail?id=1Lh-nHgyLMSr3rBVe4OGnjEvEspuMokd6&sz=500',
          backgroundColor: '#0a192f',
          onboarding: true,
        });
      }
    };
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  // --- (၅) AUTH & DATA LOGIC ---
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
    });
    return () => unsubscribe();
  }, []);

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
      await setDoc(docRef, pData, { merge: true });
      await setDoc(memberRef, pData, { merge: true });
      setProfile(pData);
    } catch (e) { console.error("Sync Error:", e); }
  }, []);

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

  // Pricing & Status Logic
  const getDisplayPrice = (plan) => {
    const tier = profile?.tier || 'Standard';
    return getPProp(plan, `Price_${tier}`) || getPProp(plan, 'Price');
  };

  const dynamicCategories = useMemo(() => {
    const uniqueCats = [...new Set(products.map(p => getPProp(p, 'Category')).filter(Boolean))];
    return uniqueCats.map(cat => ({ id: cat, name: cat, icon: <Layers size={16}/> }));
  }, [products]);

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

  // ... (handleLogin, handleOrder, handleImageUpload etc. code blocks must be here) ...
  const handleLogin = async () => { try { await signInWithPopup(auth, googleProvider); } catch (e) { console.error(e); } };

  const handleImageUpload = async (file, type) => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData });
      const data = await res.json();
      if (type === 'tech') setTechImg(data.data.url);
      else setPayImg(data.data.url);
      alert("ပုံတင်ခြင်း အောင်မြင်ပါတယ်ဗျ!");
    } catch (e) { alert("ပုံတင်လို့ မရပါဘူး"); } finally { setLoading(false); }
  };

  const handleOrder = async () => {
    if (!editContact || !payImg) return alert("အချက်အလက်ပြည့်စုံစွာ ဖြည့်ပါ");
    setLoading(true);
    const orderData = {
      userId: user.uid, userName: profile?.name, product: getPProp(selectedPlan, 'Name'),
      plan: getPProp(selectedPlan, 'Plan'), price: getDisplayPrice(selectedPlan),
      contact: editContact, paymentMethod: selectedPayment?.name,
      techImage: techImg, payImage: payImg, status: 'Pending', timestamp: Date.now(),
      date: new Date().toLocaleString('en-GB')
    };
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderData);
      fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(orderData) });
      setEditContact(""); setPayImg(""); setTechImg("");
      setView('order_success');
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const updateStatus = async (orderId, newStatus, resultData = "") => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId), { status: newStatus, result: resultData });
    } catch (e) { console.error(e); }
  };

  // --- (၆) UI COMPONENTS ---
  const MainHeader = () => (
    <div className="flex items-center justify-between p-4 bg-[#0a192f] border-b border-blue-900/20 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <img src={LOGO_URL} className="w-8 h-8 rounded-lg" alt="L" />
        <h2 className="text-sm font-black text-white uppercase tracking-tighter">MM Tech</h2>
      </div>
      <ShoppingBag size={20} className="text-blue-500" />
    </div>
  );

  const BottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a192f]/90 border-t border-blue-900/10 p-4 flex justify-around items-center z-50 max-w-5xl mx-auto backdrop-blur-md">
      <button onClick={() => setView('home')} className={view === 'home' ? 'text-blue-500' : 'text-slate-500'}><ShoppingBag size={24}/></button>
      <button onClick={() => setView('customer_dash')} className={view === 'customer_dash' ? 'text-blue-500' : 'text-slate-500'}><History size={24}/></button>
      {profile?.role === 'admin' && <button onClick={() => setView('admin_dash')} className={view === 'admin_dash' ? 'text-blue-500' : 'text-slate-500'}><ShieldCheck size={24}/></button>}
      <button onClick={() => setView('profile')} className={view === 'profile' ? 'text-blue-500' : 'text-slate-500'}><User size={24}/></button>
    </nav>
  );

  if (view === 'initializing') return <div className="min-h-screen bg-[#0a192f] flex items-center justify-center text-white"><Loader2 className="animate-spin text-blue-500" size={40}/></div>;

  return (
    <div className="bg-[#0a192f] min-h-screen text-white font-sans flex items-center justify-center p-0">
      <div className="w-full max-w-md md:max-w-5xl lg:max-w-screen-2xl mx-auto min-h-screen flex flex-col relative bg-[#0a192f] border-x border-blue-900/10 shadow-2xl">
        
        {view === 'welcome' && (
          <div className="flex flex-col flex-1 items-center justify-center p-10 text-center">
            <img src={LOGO_URL} className="w-24 h-24 mb-6 rounded-3xl" alt="L" />
            <h1 className="text-3xl font-black mb-10">MM TECH</h1>
            <button onClick={handleLogin} className="w-full max-w-xs bg-white text-black py-4 rounded-2xl font-black">Login with Google</button>
          </div>
        )}

        {view === 'home' && (
          <>
            <MainHeader />
            <div className="p-6 pb-32">
              <h1 className="text-2xl font-black mb-6">Store</h1>
              <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
                <button onClick={() => setSelectedCat(null)} className={`px-4 py-2 rounded-full text-[11px] font-black ${!selectedCat ? 'bg-blue-600' : 'bg-[#112240]'}`}>All</button>
                {dynamicCategories.map(c => (
                  <button key={c.id} onClick={() => setSelectedCat(c.id)} className={`px-4 py-2 rounded-full text-[11px] font-black ${selectedCat === c.id ? 'bg-blue-600' : 'bg-[#112240]'}`}>{c.name}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {groupedProducts.filter(g => !selectedCat || g.category === selectedCat).map(group => (
                  <div key={group.name} onClick={() => { setSelectedGroup(group); setView('group_details'); }} className="bg-[#112240]/50 p-3 rounded-2xl border border-blue-900/10 cursor-pointer">
                    <img src={formatImg(group.image)} className="aspect-square w-full rounded-xl object-cover mb-2" alt="I" />
                    <h4 className="text-[11px] font-black truncate">{group.name}</h4>
                  </div>
                ))}
              </div>
            </div>
            <BottomNav />
          </>
        )}

        {view === 'group_details' && (
          <div className="p-6 pb-32">
            <MainHeader />
            <button onClick={() => setView('home')} className="p-2 bg-[#112240] rounded-xl mb-4"><ArrowLeft size={20}/></button>
            <h2 className="text-xl font-black mb-6">{selectedGroup?.name}</h2>
            <div className="space-y-3">
              {selectedGroup?.plans.map((p, i) => (
                <button key={i} onClick={() => { setSelectedPlan(p); setView('checkout'); }} className="w-full bg-[#112240] p-4 rounded-2xl flex justify-between items-center">
                  <span className="text-sm font-black">{getPProp(p, 'Plan')}</span>
                  <span className="text-blue-500 font-black">{getDisplayPrice(p)} Ks</span>
                </button>
              ))}
            </div>
            <BottomNav />
          </div>
        )}

        {view === 'checkout' && (
          <div className="p-6 pb-32 overflow-y-auto">
            <MainHeader />
            <button onClick={() => setView('group_details')} className="p-2 bg-[#112240] rounded-xl my-4"><ArrowLeft size={20}/></button>
            
            <div className="bg-[#112240] p-6 rounded-3xl text-center mb-6 border border-blue-900/20">
              <h3 className="text-lg font-black mb-2">{getPProp(selectedPlan, 'Name')}</h3>
              <p className="text-blue-500 text-2xl font-black">{getDisplayPrice(selectedPlan)} Ks</p>
            </div>

            <div className="bg-blue-600/5 p-4 rounded-2xl mb-6 text-sm text-slate-300">
               <p className="text-blue-500 font-black text-[10px] uppercase mb-2">Instructions:</p>
               {getPProp(selectedPlan, 'Des') || "အသေးစိတ် မရှိပါ။"}
            </div>

            <textarea 
              rows="3" 
              placeholder="ID, Password, Phone Number အကုန်ဒီမှာရေးပါ..."
              className="w-full bg-[#112240] p-4 rounded-2xl mb-6 text-sm outline-none border border-blue-900/20 focus:border-blue-500"
              value={editContact} 
              onChange={e => setEditContact(e.target.value)}
            />

            <div className="mb-6">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-3">Upload Payment Screenshot</p>
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0], 'pay')} className="w-full text-xs text-slate-400 file:bg-blue-600 file:text-white file:border-0 file:px-4 file:py-2 file:rounded-lg" />
              {payImg && <p className="text-green-500 text-[10px] mt-2 font-black">✓ Screenshot Uploaded</p>}
            </div>

            <button onClick={handleOrder} disabled={loading || !payImg} className="w-full bg-blue-600 py-4 rounded-2xl font-black disabled:opacity-50">
              {loading ? "Processing..." : "Confirm & Pay Now"}
            </button>
            <BottomNav />
          </div>
        )}

        {/* --- Success View --- */}
        {view === 'order_success' && (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <CheckCircle2 size={60} className="text-green-500 mb-4" />
            <h2 className="text-2xl font-black mb-6">Success!</h2>
            <button onClick={() => setView('customer_dash')} className="bg-blue-600 px-8 py-3 rounded-xl font-black">View History</button>
          </div>
        )}

        {/* --- Other views (admin_dash, customer_dash, profile) would follow same patterns --- */}
        {view === 'customer_dash' && (
          <div className="p-6 pb-32">
            <MainHeader />
            <h2 className="text-xl font-black mb-6 mt-4">History</h2>
            <div className="space-y-4">
              {myOrders.map(o => (
                <div key={o.id} className="bg-[#112240] p-4 rounded-2xl border border-blue-900/10">
                  <div className="flex justify-between items-start">
                    <h4 className="font-black text-sm">{o.product}</h4>
                    <span className="text-[10px] text-yellow-500 font-black">{o.status}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">{o.plan} • {o.price} Ks</p>
                  {o.result && <div className="mt-2 p-2 bg-blue-600/20 rounded-lg text-xs font-mono">{o.result}</div>}
                </div>
              ))}
            </div>
            <BottomNav />
          </div>
        )}

        {view === 'admin_dash' && (
          <div className="p-6 pb-32">
             <MainHeader />
             <h2 className="text-xl font-black mb-6">Admin Panel</h2>
             <div className="space-y-4 overflow-y-auto">
               {allOrders.map(o => (
                 <div key={o.id} className="bg-[#112240] p-4 rounded-2xl">
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="text-xs font-black">{o.product} ({o.plan})</h4>
                       <span className="text-[9px] bg-blue-600 px-2 py-1 rounded">{o.status}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-3 whitespace-pre-wrap">{o.contact}</p>
                    <div className="flex gap-2">
                       {o.payImage && <a href={o.payImage} target="_blank" rel="noreferrer" className="text-[10px] bg-green-600/20 text-green-500 p-2 rounded flex-1 text-center">Receipt</a>}
                       {o.techImage && <a href={o.techImage} target="_blank" rel="noreferrer" className="text-[10px] bg-blue-600/20 text-blue-500 p-2 rounded flex-1 text-center">Tech Pic</a>}
                    </div>
                    {o.status === 'Pending' && (
                       <div className="mt-4 flex gap-2">
                          <input type="text" id={`res-${o.id}`} placeholder="Deliver Code" className="flex-1 bg-[#0a192f] p-2 rounded text-xs outline-none" />
                          <button onClick={() => {
                             const v = document.getElementById(`res-${o.id}`).value;
                             if(v) updateStatus(o.id, 'Completed', v);
                          }} className="bg-blue-600 px-4 py-2 rounded text-[10px] font-black">Done</button>
                       </div>
                    )}
                 </div>
               ))}
             </div>
             <BottomNav />
          </div>
        )}

        {view === 'profile' && (
          <div className="p-10 flex flex-col flex-1 items-center justify-center pb-32 text-center">
            <MainHeader />
            <img src={user?.photoURL} className="w-20 h-20 rounded-2xl mb-4 border-2 border-blue-600" alt="U" />
            <h2 className="text-xl font-black mb-1">{profile?.name}</h2>
            <p className="text-blue-500 text-xs font-black mb-8">{profile?.tier}</p>
            <button onClick={() => signOut(auth)} className="flex items-center gap-2 text-red-500 font-black text-sm"><LogOut size={18}/> Sign Out</button>
            <BottomNav />
          </div>
        )}

      </div>
    </div>
  );
}
