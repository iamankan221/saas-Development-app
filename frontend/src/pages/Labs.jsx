import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FlaskConical, Sparkles, Zap, Beaker, ShieldAlert, ChevronRight, CheckCircle2, Barcode, Download, X, Search, Printer, Plus, Minus } from "lucide-react";
import BarcodeComponent from "react-barcode";
import { apiClient, formatINR } from "@/lib/api";

const EXPERIMENTS = [
  {
    id: "ai-summaries",
    title: "AI Inventory Forecast",
    desc: "Predict stock depletion using historical velocity data and local seasonality trends.",
    status: "Beta",
    icon: Sparkles,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    id: "dark-mode-plus",
    title: "Dynamic Glassmorphism",
    desc: "Enhanced blur effects and translucent card layers for a deeper visual experience.",
    status: "Experimental",
    icon: Zap,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    id: "offline-sync",
    title: "Offline Invoice Sync",
    desc: "Generate bills without internet. Data syncs automatically when you're back online.",
    status: "Alpha",
    icon: Beaker,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    id: "barcode-gen",
    title: "Universal Barcode Gen",
    desc: "Generate professional barcodes (EAN-13, Code 128) for your product stock instantly.",
    status: "New",
    icon: Barcode,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
];

export default function Labs() {
  const [enabledFeatures, setEnabledFeatures] = useState(new Set());
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState("");
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = async (val) => {
    setProductName(val);
    if (val.length > 1) {
      const res = await apiClient.getInventory({ search: val, limit: 5 });
      setSearchResults(res.data || []);
      setShowSearch(true);
    } else {
      setSearchResults([]);
      setShowSearch(false);
    }
  };

  const selectItem = (item) => {
    setProductName(item.name);
    setBarcodeValue(item.barcode || item.id.toString());
    setSelectedItem(item);
    setShowSearch(false);
  };

  const [selectedItem, setSelectedItem] = useState(null);
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: apiClient.getSettings });
  const brandName = settings?.shopName || "VyaparBook";

  const toggleFeature = (id) => {
    if (id === "barcode-gen") {
      setShowBarcodeModal(true);
      return;
    }
    setEnabledFeatures(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-foreground tracking-tight">Lab</h1>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">Experimental</span>
          </div>
          <p className="text-xs text-muted-foreground font-medium">Test drive upcoming features and system innovations before they go mainstream.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EXPERIMENTS.map((exp) => {
          const Icon = exp.icon;
          const isEnabled = enabledFeatures.has(exp.id);
          
          return (
            <div 
              key={exp.id} 
              className={`group relative overflow-hidden card p-6 transition-all duration-500 hover:scale-[1.02] border border-border/50 hover:border-primary/30 ${isEnabled ? "ring-2 ring-primary/20" : ""}`}
            >
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl ${exp.bg} flex items-center justify-center transition-transform duration-500 group-hover:scale-110`}>
                    <Icon className={`w-6 h-6 ${exp.color}`} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-lg ${
                    exp.status === 'Beta' ? 'bg-emerald-500/10 text-emerald-500' : 
                    exp.status === 'Experimental' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {exp.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{exp.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">{exp.desc}</p>

                <button 
                  onClick={() => toggleFeature(exp.id)}
                  className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                    isEnabled 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                      : "bg-accent text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border"
                  }`}
                >
                  {isEnabled ? <><CheckCircle2 className="w-4 h-4" /> Enabled</> : "Activate Experiment"}
                </button>
              </div>

              {/* Decorative Background Glow */}
              <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-1000 ${exp.bg}`} />
            </div>
          );
        })}
      </div>

      {/* Barcode Generator Modal */}
      {showBarcodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-card rounded-[2.5rem] border border-border shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-8 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Barcode className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Barcode Generator</h2>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Lab Experiment #04</p>
                </div>
              </div>
              <button onClick={() => setShowBarcodeModal(false)} className="p-2 rounded-xl hover:bg-accent text-muted-foreground transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Search Product</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                    <input 
                      type="text" 
                      value={productName} 
                      onChange={e => handleSearch(e.target.value)}
                      className="w-full bg-accent/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-primary transition-all"
                      placeholder="Type name..."
                    />
                  </div>
                  {showSearch && searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 z-50 mt-1 bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      {searchResults.map(item => (
                        <button 
                          key={item.id} 
                          onClick={() => selectItem(item)}
                          className="w-full text-left px-4 py-3 hover:bg-primary hover:text-white transition-colors border-b border-border last:border-none flex items-center justify-between"
                        >
                          <span className="text-xs font-bold">{item.name}</span>
                          <span className="text-[10px] font-mono opacity-50">{item.barcode || `#${item.id}`}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Print Quantity</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-accent text-muted-foreground">
                      <Minus className="w-4 h-4" />
                    </button>
                    <input 
                      type="number" 
                      value={quantity} 
                      onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                      className="flex-1 bg-accent/50 border border-border rounded-xl px-4 py-2.5 text-center text-sm font-black text-foreground focus:outline-none"
                    />
                    <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-accent text-muted-foreground">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">Barcode Manual Input</label>
                <input 
                  type="text" 
                  value={barcodeValue} 
                  onChange={e => setBarcodeValue(e.target.value)}
                  className="w-full bg-accent/50 border border-border rounded-xl px-4 py-3 text-sm font-mono text-foreground focus:outline-none focus:border-emerald-500/50 transition-all"
                  placeholder="E.g. 890123456789"
                />
              </div>

              {/* Preview Grid */}
              <div className="bg-white rounded-2xl p-8 shadow-inner max-h-[400px] overflow-y-auto print:max-h-none print:overflow-visible custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
                  {Array.from({ length: quantity }).map((_, i) => (
                    <div key={i} className="flex flex-col p-5 border border-slate-200 rounded-xl bg-white shadow-sm min-h-[180px] relative overflow-hidden">
                      {/* Brand Name */}
                      <div className="text-center mb-2">
                        <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">{brandName}</p>
                      </div>

                      {/* Barcode Section */}
                      <div className="flex-1 flex flex-col items-center justify-center py-2">
                        {barcodeValue ? (
                          <BarcodeComponent 
                            value={barcodeValue} 
                            format="CODE128" 
                            width={1.6} 
                            height={50} 
                            fontSize={12}
                            margin={0}
                            background="#ffffff"
                          />
                        ) : (
                          <div className="h-12 flex items-center text-[10px] text-slate-300 italic">No code</div>
                        )}
                      </div>

                      {/* Bottom Info Row */}
                      <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3">
                        <div className="flex-1">
                          <p className="text-[11px] font-bold text-slate-900 leading-tight truncate">{productName || "Product Name"}</p>
                          <p className="text-[8px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                            {selectedItem?.category || "General"} • {selectedItem?.unit || "Unit"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-slate-900 tracking-tighter">
                            {formatINR(selectedItem?.sellingPrice || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 pt-0 flex gap-3">
               <button 
                onClick={() => window.print()} 
                disabled={!barcodeValue}
                className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
               >
                 <Printer className="w-4 h-4" /> Print Bulk Labels ({quantity})
               </button>
            </div>
          </div>
        </div>
      )}

      <div className="card p-6 bg-amber-500/5 border-amber-500/20">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-500 uppercase tracking-tight mb-1">Safety Disclaimer</h4>
            <p className="text-xs text-amber-500/70 font-medium leading-relaxed">
              Lab features are experimental and may be unstable. While we ensure data integrity, these features might change or be removed at any time. Use them at your own discretion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
