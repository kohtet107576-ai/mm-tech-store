import React, { useState, useEffect, useMemo } from "react";
import {
  ShoppingBag,
  Gamepad2,
  Smartphone,
  BookOpen,
  Settings,
  History,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Search,
  Loader2,
  RefreshCw
} from "lucide-react";

const API_URL =
  "https://script.google.com/macros/s/AKfycbyC1MECq8ZNzdj-RxmBaMcFfSqVk9Ijt9uuRW-szeukWuCoNBhywDz0k7W1r5mCvjhR/exec";

export default function App() {
  const [view, setView] = useState("welcome");
  const [products, setProducts] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: "Game", name: "Game", icon: <Gamepad2 size={20} /> },
    { id: "Digital product", name: "Digital Product", icon: <Smartphone size={20} /> },
    { id: "Online class", name: "Online Class", icon: <BookOpen size={20} /> },
    { id: "Gsm reseller", name: "GSM Reseller", icon: <Settings size={20} /> }
  ];

  const getProp = (p, key) => {
    if (!p) return "";
    return p[key] || p[key.toLowerCase()] || "";
  };

  const formatImage = (url) => {
    if (!url) return "https://placehold.co/400x400?text=MM+Tech";
    const match = url.match(/(?:id=|\/d\/)([\w-]{25,})/);
    if (match) return `https://lh3.googleusercontent.com/d/${match[1]}`;
    return url;
  };

  useEffect(() => {
    if (view === "home" || view === "products") fetchProducts();
  }, [view]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  const groupedProducts = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      const name = getProp(p, "Name");
      if (!map[name]) {
        map[name] = {
          name,
          category: getProp(p, "Category"),
          image: getProp(p, "Link"),
          plans: []
        };
      }
      map[name].plans.push(p);
    });
    return Object.values(map);
  }, [products]);

  const orderProduct = async () => {
    setLoading(true);

    try {
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          productName: getProp(selectedPlan, "Name"),
          plan: getProp(selectedPlan, "Plan"),
          price: getProp(selectedPlan, "Price"),
          fullName: "Web Customer"
        })
      });

      setView("success");
    } catch {
      setView("success");
    }

    setLoading(false);
  };

  /* ---------------- WELCOME ---------------- */

  if (view === "welcome")
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#0a192f] text-white px-6">
        <div className="text-center space-y-6">
          <img
            src="https://placehold.co/200x200?text=MM+TECH"
            className="rounded-3xl mx-auto"
          />

          <h1 className="text-3xl font-black">MM Tech Store</h1>

          <p className="text-slate-400 text-sm">
            Digital Products များကို လွယ်ကူစွာ ဝယ်ယူနိုင်ပါပြီ
          </p>

          <button
            onClick={() => setView("home")}
            className="bg-blue-600 px-8 py-4 rounded-xl font-bold"
          >
            Start Shopping
          </button>
        </div>
      </div>
    );

  /* ---------------- HOME ---------------- */

  if (view === "home")
    return (
      <div className="min-h-screen bg-[#0a192f] text-white max-w-md mx-auto pb-24">
        <div className="p-5 space-y-5">

          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black">MM Tech</h2>

            <button onClick={fetchProducts}>
              <RefreshCw className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />

            <input
              className="w-full pl-10 py-3 rounded-xl bg-[#112240]"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCat(c.id);
                  setView("products");
                }}
                className="bg-[#112240] p-5 rounded-xl flex flex-col items-center gap-2"
              >
                {c.icon}
                <span className="text-xs">{c.name}</span>
              </button>
            ))}
          </div>

          <h3 className="text-sm text-gray-400">Popular Products</h3>

          <div className="grid grid-cols-2 gap-3">
            {groupedProducts
              .filter((g) =>
                g.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((g) => (
                <div
                  key={g.name}
                  onClick={() => {
                    setSelectedGroup(g);
                    setView("group");
                  }}
                  className="bg-[#112240] rounded-xl p-2"
                >
                  <img
                    src={formatImage(g.image)}
                    className="rounded-lg aspect-square object-cover"
                  />

                  <p className="text-xs mt-2">{g.name}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    );

  /* ---------------- CATEGORY PRODUCTS ---------------- */

  if (view === "products")
    return (
      <div className="min-h-screen bg-[#0a192f] text-white max-w-md mx-auto">
        <div className="p-5 flex items-center gap-4">
          <button onClick={() => setView("home")}>
            <ArrowLeft />
          </button>

          <h2 className="font-bold">{selectedCat}</h2>
        </div>

        <div className="p-5 grid grid-cols-2 gap-3">
          {groupedProducts
            .filter((g) => g.category === selectedCat)
            .map((g) => (
              <div
                key={g.name}
                onClick={() => {
                  setSelectedGroup(g);
                  setView("group");
                }}
                className="bg-[#112240] p-2 rounded-xl"
              >
                <img
                  src={formatImage(g.image)}
                  className="aspect-square rounded-lg object-cover"
                />

                <p className="text-xs mt-2">{g.name}</p>
              </div>
            ))}
        </div>
      </div>
    );

  /* ---------------- GROUP PLANS ---------------- */

  if (view === "group")
    return (
      <div className="min-h-screen bg-[#0a192f] text-white max-w-md mx-auto">
        <div className="p-5 flex items-center gap-4">
          <button onClick={() => setView("home")}>
            <ArrowLeft />
          </button>

          <h2>{selectedGroup.name}</h2>
        </div>

        <div className="p-5 space-y-3">
          {selectedGroup.plans.map((p, i) => (
            <button
              key={i}
              onClick={() => {
                setSelectedPlan(p);
                setView("details");
              }}
              className="bg-[#112240] w-full p-4 rounded-xl flex justify-between"
            >
              <span>{getProp(p, "Plan")}</span>

              <span className="text-blue-400">
                {getProp(p, "Price")} Ks
              </span>
            </button>
          ))}
        </div>
      </div>
    );

  /* ---------------- DETAILS ---------------- */

  if (view === "details")
    return (
      <div className="min-h-screen bg-[#0a192f] text-white max-w-md mx-auto">
        <div className="p-5 flex items-center gap-4">
          <button onClick={() => setView("group")}>
            <ArrowLeft />
          </button>

          <h2>Confirm Order</h2>
        </div>

        <div className="p-6 space-y-6">

          <img
            src={formatImage(getProp(selectedPlan, "Link"))}
            className="rounded-2xl"
          />

          <h3 className="text-xl font-bold">
            {getProp(selectedPlan, "Name")}
          </h3>

          <p>{getProp(selectedPlan, "Plan")}</p>

          <p className="text-blue-400 text-lg">
            {getProp(selectedPlan, "Price")} Ks
          </p>

          <button
            onClick={orderProduct}
            className="bg-blue-600 w-full py-4 rounded-xl"
          >
            Confirm Order
          </button>
        </div>
      </div>
    );

  /* ---------------- SUCCESS ---------------- */

  if (view === "success")
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-center bg-[#0a192f] text-white px-6">
        <CheckCircle2 size={60} className="text-green-500 mb-4" />

        <h2 className="text-2xl font-bold mb-2">Order Success</h2>

        <p className="text-gray-400 text-sm mb-6">
          Telegram မှတဆင့်ပို့ပေးပါမည်
        </p>

        <button
          onClick={() => setView("home")}
          className="bg-blue-600 px-6 py-3 rounded-xl"
        >
          Back Home
        </button>
      </div>
    );
}
