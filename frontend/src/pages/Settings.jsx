import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { 
  Save, CheckCircle, Store, Receipt, Palette, ShieldCheck, 
  Settings as SettingsIcon, Download, RotateCcw, Monitor, 
  Moon, Sun, Wind, Layout, BellRing, Database
} from "lucide-react";
import { toast } from "@/lib/toast";

const tabs = [
  { id: "business", label: "Business Profile", icon: Store },
  { id: "financial", label: "Financial & Tax", icon: Receipt },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "advanced", label: "Advanced", icon: SettingsIcon },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("business");
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(null);

  const { data: settings, isLoading } = useQuery({ queryKey: ["settings"], queryFn: apiClient.getSettings });

  useEffect(() => { 
    if (settings) {
      setForm(settings); 
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
        autoCollapse: false
      });
    }
  }, [settings, isLoading]);

  const updateMutation = useMutation({
    mutationFn: apiClient.updateSettings,
    onSuccess: () => { 
      setSaved(true); 
      toast.success("Settings updated successfully!");
      setTimeout(() => setSaved(false), 2500); 
    },
    onError: (err) => toast.error(err.response?.data?.error || "Update failed")
  });

  const activeIndex = tabs.findIndex(t => t.id === activeTab);
  const displayIndex = hoverIndex !== null ? hoverIndex : (activeIndex !== -1 ? activeIndex : null);

  if (isLoading || !form) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-slate-400 font-medium">Loading preferences...</p>
    </div>
  );

  const handleBackup = () => {
    toast.success("Data backup initiated! Your export will be ready shortly.");
  };

  const handleReset = () => {
    if (confirm("DANGER: This will reset all system preferences to factory defaults. Your business data will NOT be deleted. Proceed?")) {
      toast.success("System preferences reset.");
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Command Center</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Manage your business ecosystem and system preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs with Exact Main Toggle Style & Mouse Tracking */}
        <aside className="w-full md:w-64 shrink-0 relative flex flex-col">
          <div className="relative py-4 px-3" onMouseLeave={() => setHoverIndex(null)}>
            <div className="relative">
              {/* Precision Sliding Pill - Matches Main Sidebar Mouse Tracking */}
              <div 
                className="absolute left-0 right-0 h-12 bg-[#0061FF] rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-xl shadow-blue-600/20 z-0"
                style={{ 
                  opacity: displayIndex !== null ? 1 : 0,
                  transform: `translateY(${(displayIndex || 0) * 48}px)`,
                  pointerEvents: 'none'
                }}
              />

              <nav className="relative z-10 flex flex-col">
                {tabs.map((tab, idx) => (
                  <button
                    key={tab.id}
                    onMouseEnter={() => setHoverIndex(idx)}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 h-12 rounded-2xl text-sm font-bold transition-all duration-500 ${
                      (hoverIndex === idx || (activeTab === tab.id && hoverIndex === null))
                      ? "text-white" 
                      : "text-slate-500 hover:translate-x-1"
                    }`}
                  >
                    <tab.icon className={`w-5 h-5 shrink-0 transition-transform duration-500 ${(hoverIndex === idx || (activeTab === tab.id && hoverIndex === null)) ? "scale-110" : ""}`} />
                    <span className="truncate">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {activeTab === "business" && (
            <div className="card p-6 space-y-6 animate-pulse-fade">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
                <Store className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-slate-900">Store Information</h2>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Shop Logo (URL)</label>
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400">
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
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                  <input className="input" value={form.phone || ""} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Business Address</label>
                  <textarea className="input min-h-[100px] py-3" value={form.address || ""} onChange={e => setForm({...form, address: e.target.value})} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "financial" && (
            <div className="card p-6 space-y-6 animate-pulse-fade">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h2 className="font-bold text-slate-900">Billing & Tax Configuration</h2>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">GST / Tax Number</label>
                  <input className="input font-mono" placeholder="29XXXXX1234Z" value={form.gstNumber || ""} onChange={e => setForm({...form, gstNumber: e.target.value})} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Default GST Rate (%)</label>
                  <input type="number" className="input" value={form.taxRate || 18} onChange={e => setForm({...form, taxRate: e.target.value})} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Invoice Prefix</label>
                  <input className="input uppercase" placeholder="INV" value={form.invoicePrefix || "INV"} onChange={e => setForm({...form, invoicePrefix: e.target.value})} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Base Currency</label>
                  <select className="input appearance-none" value={form.currency || "INR"} onChange={e => setForm({...form, currency: e.target.value})}>
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="GBP">Pound (£)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="card p-6 space-y-6 animate-pulse-fade">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
                <Palette className="w-5 h-5 text-purple-600" />
                <h2 className="font-bold text-slate-900">Interface Customization</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Color Mode</label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: "light", label: "Light Mode", icon: Sun, color: "bg-white border-slate-200" },
                      { id: "dark", label: "Dark Mode", icon: Moon, color: "bg-slate-900 border-slate-800" },
                      { id: "auto", label: "System Sync", icon: Monitor, color: "bg-slate-100 border-slate-200" },
                    ].map(mode => (
                      <button 
                        key={mode.id}
                        className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${form.theme === mode.id ? "border-blue-600 bg-blue-50/50" : "border-slate-100 hover:border-slate-200"}`}
                        onClick={() => setForm({...form, theme: mode.id})}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${mode.color}`}>
                          <mode.icon className={`w-5 h-5 ${mode.id === "light" ? "text-orange-500" : mode.id === "dark" ? "text-blue-400" : "text-slate-500"}`} />
                        </div>
                        <span className="text-xs font-bold text-slate-900">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex gap-3 items-center">
                    <div className="p-2 bg-white rounded-lg shadow-sm"><Wind className="w-4 h-4 text-blue-600" /></div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Premium Animations</p>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">Enable liquid transitions & mesh background</p>
                    </div>
                  </div>
                  <button 
                    className={`w-12 h-6 rounded-full transition-colors relative ${form.animations ? "bg-blue-600" : "bg-slate-300"}`}
                    onClick={() => setForm({...form, animations: !form.animations})}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.animations ? "left-7" : "left-1"}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex gap-3 items-center">
                    <div className="p-2 bg-white rounded-lg shadow-sm"><Layout className="w-4 h-4 text-purple-600" /></div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Auto-Collapse Sidebar</p>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">Maximize workspace when navigating</p>
                    </div>
                  </div>
                  <button 
                    className={`w-12 h-6 rounded-full transition-colors relative ${form.autoCollapse ? "bg-blue-600" : "bg-slate-300"}`}
                    onClick={() => setForm({...form, autoCollapse: !form.autoCollapse})}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.autoCollapse ? "left-7" : "left-1"}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="card p-6 space-y-6 animate-pulse-fade">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
                <ShieldCheck className="w-5 h-5 text-red-600" />
                <h2 className="font-bold text-slate-900">Security & Privacy</h2>
              </div>
              <div className="space-y-4">
                <button className="btn btn-outline w-full justify-between">
                  <span className="flex items-center gap-2"><BellRing className="w-4 h-4" /> Notification Preferences</span>
                  <span className="text-[10px] font-bold text-blue-600 uppercase">Manage</span>
                </button>
                <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100 flex flex-col gap-3">
                  <p className="text-sm font-bold text-red-900">Administrative Actions</p>
                  <button className="btn bg-white border border-red-200 text-red-600 hover:bg-red-50 w-full text-xs font-bold uppercase tracking-wider">Change Password</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "advanced" && (
            <div className="card p-6 space-y-6 animate-pulse-fade">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
                <SettingsIcon className="w-5 h-5 text-slate-900" />
                <h2 className="font-bold text-slate-900">System Operations</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={handleBackup} className="flex flex-col items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:bg-blue-600 transition-colors">
                    <Database className="w-6 h-6 text-blue-600 group-hover:text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-900">Export Backup</p>
                    <p className="text-[10px] text-slate-500 uppercase mt-1">Download local data (CSV)</p>
                  </div>
                </button>
                <button onClick={handleReset} className="flex flex-col items-center gap-4 p-6 bg-red-50/30 rounded-2xl border border-red-100 hover:border-red-200 transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:bg-red-600 transition-colors">
                    <RotateCcw className="w-6 h-6 text-red-600 group-hover:text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-red-900">Factory Reset</p>
                    <p className="text-[10px] text-red-500 uppercase mt-1">Clear system preferences</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2">
              {saved && (
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 uppercase tracking-wider animate-pulse-fade">
                  <CheckCircle className="w-3.5 h-3.5" /> Sync Complete
                </span>
              )}
            </div>
            <button
              className="btn btn-primary min-w-[160px]"
              onClick={() => updateMutation.mutate(form)}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Syncing Workspace..." : "Save Configuration"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
