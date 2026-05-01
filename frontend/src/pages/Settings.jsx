import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient, formatINR, normalizePhone, maskPhone } from "@/lib/api";
import { 
  Save, CheckCircle, Store, Receipt, Palette, ShieldCheck, 
  Settings as SettingsIcon, Download, RotateCcw, Monitor, 
  Moon, Sun, Wind, Layout, BellRing, Database, Trash2, Calendar, EyeOff
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useRef } from "react";
import { useTheme } from "@/context/ThemeContext";

const tabs = [
  { id: "business", label: "Business Profile", icon: Store },
  { id: "dashboard", label: "Dashboard", icon: Layout },
  { id: "financial", label: "Financial & Tax", icon: Receipt },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "advanced", label: "Advanced", icon: SettingsIcon },
];

export default function Settings() {
  const { theme: currentTheme, setTheme: setGlobalTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("business");
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const { data: settings, isLoading } = useQuery({ queryKey: ["settings"], queryFn: apiClient.getSettings });

  useEffect(() => { 
    if (settings) {
      setForm(settings); 
      if (settings.theme && settings.theme !== "auto") {
        setGlobalTheme(settings.theme);
      }
    } else if (!isLoading && !settings) {
      setForm({
        shopName: "",
        phone: "",
        email: "",
        address: "",
        gstNumber: "",
        taxRate: 18,
        invoicePrefix: "INV",
        currency: "INR",
        theme: "light",
        animations: true,
        autoCollapse: false,
        dashStartDate: "",
        dashEndDate: ""
      });
    }

    if (settings?.dashStartDate) {
      const [y, m, d] = settings.dashStartDate.split("-");
      setStartText(`${d}/${m}/${y}`);
    }
    if (settings?.dashEndDate) {
      const [y, m, d] = settings.dashEndDate.split("-");
      setEndText(`${d}/${m}/${y}`);
    }
  }, [settings, isLoading]);

  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");
  const fromRef = useRef(null);
  const toRef = useRef(null);

  const handleDateChange = (val, textSetter, dateSetter, nextRef = null) => {
    let clean = val.replace(/[^\d]/g, "");
    if (clean.length > 8) clean = clean.slice(0, 8);
    let formatted = clean;
    if (clean.length > 2) formatted = clean.slice(0, 2) + "/" + clean.slice(2);
    if (clean.length > 4) formatted = formatted.slice(0, 5) + "/" + formatted.slice(5);
    
    textSetter(formatted);

    if (formatted.length === 10) {
      const [d, m, y] = formatted.split("/");
      dateSetter(`${y}-${m}-${d}`);
      if (nextRef?.current) nextRef.current.focus();
    } else {
      dateSetter("");
    }
  };

  const updateMutation = useMutation({
    mutationFn: apiClient.updateSettings,
    onSuccess: () => { 
      setSaved(true); 
      toast.success("Settings updated successfully!");
      setTimeout(() => setSaved(false), 2500); 
    },
    onError: (err) => {
      const msg = err.response?.data?.error || "Update failed";
      const details = err.response?.data?.details;
      toast.error(details ? `${msg}: ${details}` : msg);
    }
  });

  const passwordMutation = useMutation({
    mutationFn: apiClient.changePassword,
    onSuccess: () => {
      toast.success("Password updated successfully!");
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (err) => toast.error(err.response?.data?.error || "Password update failed")
  });

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("New passwords do not match!");
    }
    if (passwordForm.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters!");
    }
    passwordMutation.mutate({ 
      currentPassword: passwordForm.currentPassword, 
      newPassword: passwordForm.newPassword 
    });
  };

  const activeIndex = tabs.findIndex(t => t.id === activeTab);
  const displayIndex = hoverIndex !== null ? hoverIndex : (activeIndex !== -1 ? activeIndex : null);

  if (isLoading || !form) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-slate-400 font-medium">Loading preferences...</p>
    </div>
  );

  const handleBackup = () => {
    const dataStr = JSON.stringify(form, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `vyapar_settings_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success("Settings backup downloaded!");
  };

  const handleReset = () => {
    if (confirm("DANGER: This will reset all system preferences to factory defaults. Proceed?")) {
      const defaultSettings = {
        shopName: "My Business",
        currency: "INR",
        invoicePrefix: "INV",
        theme: "light",
        animations: true,
        autoCollapse: false,
        dashboardRange: "30"
      };
      updateMutation.mutate(defaultSettings);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-black text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1 font-medium">Manage your business ecosystem and system preferences</p>
      </div>

      {/* Horizontal Tab Navigation */}
      <div className="relative border-b border-border pb-px">
        <div className="relative flex items-center gap-1" onMouseLeave={() => setHoverIndex(null)}>
          {/* Precision Sliding Pill - Horizontal Migration */}
          <div 
            className="absolute h-10 bg-primary rounded-xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-xl shadow-primary/20 z-0"
            style={{ 
              opacity: displayIndex !== null ? 1 : 0,
              width: displayIndex !== null ? '160px' : '0px',
              transform: `translateX(${(displayIndex || 0) * 164}px)`,
              pointerEvents: 'none'
            }}
          />

          <nav className="relative z-10 flex items-center gap-1">
            {tabs.map((tab, idx) => (
              <button
                key={tab.id}
                onMouseEnter={() => setHoverIndex(idx)}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 w-[160px] h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                  (hoverIndex === idx || (activeTab === tab.id && hoverIndex === null))
                  ? "text-primary-foreground" 
                  : "text-muted-foreground hover:bg-accent"
                }`}
              >
                <tab.icon className={`w-4 h-4 shrink-0 transition-transform duration-500 ${(hoverIndex === idx || (activeTab === tab.id && hoverIndex === null)) ? "scale-110" : ""}`} />
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-6">
          {activeTab === "business" && (
            <div className="card p-6 space-y-6 animate-pulse-fade">
              <div className="flex items-center gap-2 pb-4 border-b border-border">
                <Store className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-foreground">Store Information</h2>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Shop Logo (URL)</label>
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-2xl bg-accent border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                      {form.logoUrl ? <img src={form.logoUrl} className="w-full h-full object-cover rounded-2xl" alt="Logo" /> : <Store className="w-8 h-8" />}
                    </div>
                    <input className="input flex-1" placeholder="https://example.com/logo.png" value={form.logoUrl || ""} onChange={e => setForm({...form, logoUrl: e.target.value})} />
                  </div>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Shop Name</label>
                  <input className="input" value={form.shopName || ""} onChange={e => setForm({...form, shopName: e.target.value})} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Phone Number</label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none border-r border-border pr-2">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">IND</span>
                      <span className="text-xs font-bold text-foreground">+91</span>
                    </div>
                    <input 
                      className="input pl-[4.5rem] font-mono" 
                      placeholder="98765 43210"
                      value={form.phone || ""} 
                      onChange={e => setForm({...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10)})} 
                    />
                  </div>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">GST / Tax Number</label>
                  <input className="input font-mono" placeholder="29XXXXX1234Z" value={form.gstNumber || ""} onChange={e => setForm({...form, gstNumber: e.target.value})} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Business Email</label>
                  <input className="input" type="email" value={form.email || ""} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Business Address</label>
                  <textarea className="input min-h-[80px] py-3" value={form.address || ""} onChange={e => setForm({...form, address: e.target.value})} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "dashboard" && (
            <div className="card p-6 space-y-6 animate-pulse-fade">
              <div className="flex items-center gap-2 pb-4 border-b border-border">
                <Layout className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-foreground">Dashboard Configuration</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Default View Period</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "0", label: "Today" },
                      { id: "7", label: "1 Week" },
                      { id: "30", label: "1 Month" },
                      { id: "60", label: "2 Months" },
                      { id: "90", label: "3 Months" },
                      { id: "180", label: "6 Months" },
                      { id: "365", label: "1 Year" },
                      { id: "custom", label: "Custom Range" },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                          form.dashboardRange === opt.id 
                            ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                            : "border-border text-muted-foreground hover:border-border/80"
                        }`}
                        onClick={() => setForm({...form, dashboardRange: opt.id})}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-4 font-bold uppercase tracking-tight">Set the baseline window for growth trends and velocity analytics</p>
                </div>

                {form.dashboardRange === "custom" && (
                  <div className="p-4 bg-accent/20 rounded-2xl border border-border space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Analytics Window</span>
                       <button 
                        onClick={() => { setForm({...form, dashStartDate: "", dashEndDate: ""}); setStartText(""); setEndText(""); }}
                        className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                       >
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* START DATE */}
                      <div className="relative group">
                        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5 shadow-sm focus-within:border-primary transition-all">
                          <Calendar 
                            className="w-4 h-4 text-primary cursor-pointer hover:opacity-80 transition-opacity" 
                            onClick={() => document.getElementById('sett-start-native')?.showPicker?.() || document.getElementById('sett-start-native')?.click()}
                          />
                          <input 
                            id="sett-start-native"
                            type="date" 
                            className="absolute invisible pointer-events-none w-0 h-0 overflow-hidden"
                            tabIndex={-1}
                            value={form.dashStartDate || ""}
                            onChange={e => {
                              const v = e.target.value;
                              setForm({...form, dashStartDate: v});
                              if (v) { const [y,m,d] = v.split("-"); setStartText(`${d}/${m}/${y}`); } else setStartText("");
                            }}
                          />
                          <div className="relative flex-1 h-5">
                            {!startText && <span className="absolute inset-0 text-[11px] font-black text-muted-foreground/60 flex items-center pointer-events-none uppercase tracking-tighter">DD/MM/YYYY</span>}
                            <input 
                              ref={fromRef}
                              type="text" 
                              value={startText}
                              onChange={e => handleDateChange(e.target.value, setStartText, v => setForm({...form, dashStartDate: v}), toRef)}
                              className="absolute inset-0 bg-transparent text-[11px] font-black text-foreground focus:outline-none border-none ring-0 leading-5 uppercase tracking-tighter"
                              placeholder=""
                            />
                          </div>
                        </div>
                      </div>

                      {/* END DATE */}
                      <div className="relative group">
                        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5 shadow-sm focus-within:border-primary transition-all">
                          <Calendar 
                            className="w-4 h-4 text-primary cursor-pointer hover:opacity-80 transition-opacity" 
                            onClick={() => document.getElementById('sett-end-native')?.showPicker?.() || document.getElementById('sett-end-native')?.click()}
                          />
                          <input 
                            id="sett-end-native"
                            type="date" 
                            className="absolute invisible pointer-events-none w-0 h-0 overflow-hidden"
                            tabIndex={-1}
                            value={form.dashEndDate || ""}
                            min={form.dashStartDate}
                            onChange={e => {
                              const v = e.target.value;
                              setForm({...form, dashEndDate: v});
                              if (v) { const [y,m,d] = v.split("-"); setEndText(`${d}/${m}/${y}`); } else setEndText("");
                            }}
                          />
                          <div className="relative flex-1 h-5">
                            {!endText && <span className="absolute inset-0 text-[11px] font-black text-muted-foreground/60 flex items-center pointer-events-none uppercase tracking-tighter">DD/MM/YYYY</span>}
                            <input 
                              ref={toRef}
                              type="text" 
                              value={endText}
                              onChange={e => handleDateChange(e.target.value, setEndText, v => setForm({...form, dashEndDate: v}))}
                              className="absolute inset-0 bg-transparent text-[11px] font-black text-foreground focus:outline-none border-none ring-0 leading-5 uppercase tracking-tighter"
                              placeholder=""
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "financial" && (
            <div className="card p-6 space-y-6 animate-pulse-fade">
              <div className="flex items-center gap-2 pb-4 border-b border-border">
                <Receipt className="w-5 h-5 text-emerald-500" />
                <h2 className="font-bold text-foreground">Billing & Tax Configuration</h2>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Invoice Prefix</label>
                  <input className="input uppercase font-bold" placeholder="INV" value={form.invoicePrefix || "INV"} onChange={e => setForm({...form, invoicePrefix: e.target.value})} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Base Currency</label>
                  <div className="input bg-accent border-border text-muted-foreground font-bold flex items-center gap-2 cursor-not-allowed">
                    <span className="w-6 h-6 rounded bg-card flex items-center justify-center border border-border">₹</span>
                    Indian Rupee (INR)
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="card p-6 space-y-6 animate-pulse-fade">
              <div className="flex items-center gap-2 pb-4 border-b border-border">
                <Palette className="w-5 h-5 text-purple-500" />
                <h2 className="font-bold text-foreground">Interface Customization</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Color Mode</label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: "light", label: "Light Mode", icon: Sun, color: "bg-white border-border" },
                      { id: "dark", label: "Dark Mode", icon: Moon, color: "bg-card border-border" },
                      { id: "auto", label: "System Sync", icon: Monitor, color: "bg-accent border-border" },
                    ].map(mode => (
                      <button 
                        key={mode.id}
                        className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${form.theme === mode.id ? "border-primary bg-primary/5" : "border-border hover:border-border/80"}`}
                        onClick={() => {
                          setForm({...form, theme: mode.id});
                          if (mode.id !== "auto") setGlobalTheme(mode.id);
                        }}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${mode.color}`}>
                          <mode.icon className={`w-5 h-5 ${mode.id === "light" ? "text-orange-500" : mode.id === "dark" ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${form.theme === mode.id ? "text-primary" : "text-foreground/70"}`}>{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-accent rounded-2xl border border-border">
                  <div className="flex gap-3 items-center">
                    <div className="p-2 bg-card rounded-lg shadow-sm border border-border"><Wind className="w-4 h-4 text-primary" /></div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Premium Animations</p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tight">Enable liquid transitions & mesh background</p>
                    </div>
                  </div>
                  <button 
                    className={`w-12 h-6 rounded-full transition-colors relative ${form.animations ? "bg-primary" : "bg-muted"}`}
                    onClick={() => setForm({...form, animations: !form.animations})}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${form.animations ? "left-7" : "left-1"}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-accent rounded-2xl border border-border">
                  <div className="flex gap-3 items-center">
                    <div className="p-2 bg-card rounded-lg shadow-sm border border-border"><Layout className="w-4 h-4 text-purple-500" /></div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Auto-Collapse Sidebar</p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tight">Maximize workspace when navigating</p>
                    </div>
                  </div>
                  <button 
                    className={`w-12 h-6 rounded-full transition-colors relative ${form.autoCollapse ? "bg-primary" : "bg-muted"}`}
                    onClick={() => setForm({...form, autoCollapse: !form.autoCollapse})}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${form.autoCollapse ? "left-7" : "left-1"}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="card p-6 space-y-6 animate-pulse-fade">
              <div className="flex items-center gap-2 pb-4 border-b border-border">
                <ShieldCheck className="w-5 h-5 text-destructive" />
                <h2 className="font-bold text-foreground">Security & Privacy</h2>
              </div>
              <div className="space-y-4">
                <button className="btn btn-outline w-full justify-between">
                  <span className="flex items-center gap-2"><BellRing className="w-4 h-4" /> Notification Preferences</span>
                  <span className="text-[10px] font-bold text-primary uppercase">Manage</span>
                </button>
                
                <div className="flex items-center justify-between p-4 bg-accent/20 rounded-2xl border border-border">
                  <div className="flex gap-3 items-center">
                    <div className="p-2 bg-card rounded-lg shadow-sm border border-border"><EyeOff className="w-4 h-4 text-primary" /></div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Mask Phone Numbers</p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tight">Hide sensitive contact digits globally</p>
                    </div>
                  </div>
                  <button 
                    className={`w-12 h-6 rounded-full transition-colors relative ${form.maskPhoneNumbers ? "bg-primary" : "bg-muted"}`}
                    onClick={() => setForm({...form, maskPhoneNumbers: !form.maskPhoneNumbers})}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${form.maskPhoneNumbers ? "left-7" : "left-1"}`} />
                  </button>
                </div>

                <div className="p-4 bg-destructive/10 rounded-2xl border border-destructive/20 flex flex-col gap-3">
                  <p className="text-sm font-bold text-destructive">Administrative Actions</p>
                  <button 
                    onClick={() => setShowPasswordModal(true)}
                    className="btn bg-card border border-destructive/30 text-destructive hover:bg-destructive/10 w-full text-xs font-bold uppercase tracking-wider"
                  >
                    Change Account Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Password Modal */}
          {showPasswordModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="card w-full max-w-md p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300 border border-border">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground">Security Update</h2>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Update your account credentials</p>
                  </div>
                </div>
                
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Current Password</label>
                    <input 
                      type="password" 
                      className="input" 
                      required
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    />
                  </div>
                  <div className="h-px bg-border my-2" />
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">New Password</label>
                    <input 
                      type="password" 
                      className="input" 
                      required
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Confirm New Password</label>
                    <input 
                      type="password" 
                      className="input" 
                      required
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setShowPasswordModal(false)}
                      className="btn btn-outline flex-1"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={passwordMutation.isPending}
                      className="btn btn-primary flex-1 bg-destructive hover:bg-destructive/80 border-destructive"
                    >
                      {passwordMutation.isPending ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === "advanced" && (
            <div className="card p-6 space-y-6 animate-pulse-fade">
              <div className="flex items-center gap-2 pb-4 border-b border-border">
                <SettingsIcon className="w-5 h-5 text-foreground" />
                <h2 className="font-bold text-foreground">System Operations</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={handleBackup} className="flex flex-col items-center gap-4 p-6 bg-accent/20 rounded-2xl border border-border hover:border-primary transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center shadow-sm border border-border group-hover:bg-primary transition-colors">
                    <Database className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-foreground">Export Backup</p>
                    <p className="text-[10px] text-muted-foreground uppercase mt-1">Download local data (CSV)</p>
                  </div>
                </button>
                <button onClick={handleReset} className="flex flex-col items-center gap-4 p-6 bg-destructive/10 rounded-2xl border border-destructive/20 hover:border-destructive transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center shadow-sm border border-border group-hover:bg-destructive transition-colors">
                    <RotateCcw className="w-6 h-6 text-destructive group-hover:text-destructive-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-destructive">Factory Reset</p>
                    <p className="text-[10px] text-destructive uppercase mt-1">Clear system preferences</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-border">
            <div className="flex items-center gap-2">
              {saved && (
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 uppercase tracking-wider animate-pulse-fade">
                  <CheckCircle className="w-3.5 h-3.5" /> Sync Complete
                </span>
              )}
            </div>
            <button
              className="btn btn-primary min-w-[160px]"
              onClick={() => {
                const payload = {
                  ...form,
                  phone: normalizePhone(form.phone)
                };
                console.log("📤 Sending Settings Update:", payload);
                updateMutation.mutate(payload);
              }}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
  );
}
