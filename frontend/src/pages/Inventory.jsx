import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiClient, formatINR, formatDate } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Search, Plus, Trash2, Eye, Package, AlertTriangle, Clock, X, Calendar, Scan, Smartphone } from "lucide-react";
import BarcodeScanner from "@/components/BarcodeScanner";
import { QRCodeSVG } from "qrcode.react";
import { io } from "socket.io-client";

const CATEGORIES = [
  "Groceries", "Dairy", "Beverages", "Personal Care", "Household", "Electronics", "Hardware", "Others"
];

const UNITS = [
  { short: "pcs", label: "Piece (pcs)" },
  { short: "kg",  label: "Kilogram (kg)" },
  { short: "g",   label: "Gram (g)" },
  { short: "ltr", label: "Liter (ltr)" },
  { short: "ml",  label: "Milliliter (ml)" },
  { short: "box", label: "Box (box)" },
  { short: "pkt", label: "Packet (pkt)" },
  { short: "dz",  label: "Dozen (dz)" },
];

const TAX_OPTIONS = [
  "NONE", "IGST 0%", "GST 0%", "IGST 0.25%", "GST 0.25%", "IGST 3%", "GST 3%", "IGST 5%", "GST 5%", 
  "IGST 12%", "GST 12%", "IGST 18%", "GST 18%", "IGST 28%", "GST 28%", "IGST 40%", "GST 40%", "Exempt"
];

function AddItemModal({ onClose, onSave }) {
  const { data: itemsRes } = useQuery({ queryKey: ["inventory-all"], queryFn: () => apiClient.getInventory({ limit: 1000 }) });
  const existingItems = itemsRes?.data || [];

  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState({
    sku: "", barcode: "", category: CATEGORIES[0], location: "", unit: UNITS[0].short,
    purchasePrice: "", sellingPrice: "", currentQuantity: "",
    totalQuantity: "", lowStockThreshold: "10", taxRate: "GST 18%",
    hsnCode: "", expiryDate: "", supplierId: null,
    unitValue: "",
  });

  const [nameSearch, setNameSearch] = useState("");
  const [expiryText, setExpiryText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showRemoteQR, setShowRemoteQR] = useState(false);
  const [sessionId] = useState(() => "inv-" + Math.random().toString(36).substring(2, 9));
  
  // Setup Socket for Remote Scanning
  useEffect(() => {
    const socket = io(window.location.origin);

    socket.emit("join-session", sessionId);

    socket.on("barcode-received", (barcode) => {
      setForm(v => ({ ...v, barcode }));
      toast.success(`Remote Scan: ${barcode}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId]);

  const remoteScanUrl = `${window.location.protocol}//${window.location.host}/m-scan?sid=${sessionId}`;

  const nameSuggestions = nameSearch.trim()
    ? existingItems.filter(i => i.name.toLowerCase().includes(nameSearch.toLowerCase())).slice(0, 10)
    : existingItems.slice(0, 10);

  const handleDateInput = (val) => {
    let clean = val.replace(/[^\d]/g, "");
    if (clean.length > 8) clean = clean.slice(0, 8);
    let formatted = clean;
    if (clean.length > 2) formatted = clean.slice(0, 2) + "/" + clean.slice(2);
    if (clean.length > 4) formatted = formatted.slice(0, 5) + "/" + formatted.slice(5);
    
    setExpiryText(formatted);

    if (formatted.length === 10) {
      const [d, m, y] = formatted.split("/");
      setForm(v => ({ ...v, expiryDate: `${y}-${m}-${d}` }));
    } else {
      setForm(v => ({ ...v, expiryDate: "" }));
    }
  };

  const handleSelectSuggestion = (item) => {
    setSelectedItem(item);
    setNameSearch(item.name);
    setShowSuggestions(false);
    
    const expDate = item.expiryDate ? item.expiryDate.split('T')[0] : "";
    if (expDate) {
      const [y, m, d] = expDate.split("-");
      setExpiryText(`${d}/${m}/${y}`);
    } else {
      setExpiryText("");
    }

    const taxLabel = item.taxType && item.taxRate != null 
      ? (item.taxType === "NONE" ? "NONE" : item.taxType === "EXEMPT" ? "Exempt" : `${item.taxType} ${item.taxRate}%`)
      : (item.taxRate != null ? `GST ${item.taxRate}%` : "NONE");

    setForm({
      sku: item.sku || "",
      barcode: item.barcode || "",
      category: item.category || CATEGORIES[0],
      location: item.location || "",
      unit: item.unit || UNITS[0].short,
      purchasePrice: Number(item.purchasePrice) || 0,
      sellingPrice: Number(item.sellingPrice) || 0,
      currentQuantity: 0,
      totalQuantity: Number(item.currentQuantity) || 0,
      lowStockThreshold: Number(item.lowStockThreshold) || 10,
      taxRate: TAX_OPTIONS.includes(taxLabel) ? taxLabel : "GST 18%",
      hsnCode: item.hsnCode || "",
      expiryDate: expDate,
      unitValue: Number(item.unitValue) || 1.0,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nameSearch.trim() || !form.unit.trim()) {
      toast.error("Item Name and Unit are required");
      return;
    }
    const taxParts = form.taxRate.split(" ");
    const taxType = taxParts[0] === "Exempt" ? "EXEMPT" : taxParts[0];
    const taxRate = taxParts[1] ? parseFloat(taxParts[1].replace("%", "")) : 0;

    const payload = {
      ...form,
      name: nameSearch.trim(),
      purchasePrice: +form.purchasePrice, sellingPrice: +form.sellingPrice,
      currentQuantity: selectedItem ? +form.totalQuantity : +form.currentQuantity, 
      totalQuantity: +form.totalQuantity,
      lowStockThreshold: +form.lowStockThreshold, 
      taxRate,
      taxType,
      unitValue: +form.unitValue || 1.0,
      sku: form.sku || null, barcode: form.barcode || null, category: form.category || null,
      location: form.location || null, hsnCode: form.hsnCode || null,
      expiryDate: form.expiryDate || null,
    };
    if (selectedItem) payload.id = selectedItem.id;
    onSave(payload);
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "unset"; };
  }, []);

  const fields = [
    { name: "sku",              label: "SKU",                 type: "text",   placeholder: "SKU-001" },
    { name: "barcode",          label: "Barcode",             type: "text",   placeholder: "8901..." },
    { name: "category",         label: "Category",            type: "select", options: CATEGORIES },
    { name: "location",         label: "Storage Location",    type: "text",   placeholder: "Rack A-1" },
    { name: "unit",             label: "Unit *",              type: "select", options: UNITS },
    { name: "purchasePrice",    label: "Purchase Price (₹) *",type: "number", placeholder: "0" },
    { name: "sellingPrice",     label: "Selling Price (₹) *", type: "number", placeholder: "0" },
    { name: "currentQuantity",  label: "Quantity Add *",      type: "number", placeholder: "0" },
    { name: "totalQuantity",    label: "Total Qty",           type: "number", placeholder: "0" },
    { name: "lowStockThreshold",label: "Low Stock Threshold", type: "number", placeholder: "10" },
    { name: "taxRate",          label: "Tax Rate",            type: "select", options: TAX_OPTIONS },
    { name: "unitValue",        label: "Unit Value (SKU Qty) *", type: "number", placeholder: "1.0" },
    { name: "hsnCode",          label: "HSN Code",            type: "text",   placeholder: "8528720" },
    { name: "expiryDate",       label: "Expiry Date",         type: "date" },
  ];  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-card rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-border">
        {/* Fixed Header */}
        <div className="p-8 pb-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-foreground tracking-tight">Add Inventory Item</h2>
              <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">Catalog Entry v2.5</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-accent rounded-full transition-colors border border-border shadow-sm">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-8 pt-6 custom-scrollbar bg-accent/10">
          <form id="inventory-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
            {/* Custom Name Field with Suggestions */}
            <div className="col-span-2 relative">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Item Name *</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="input pl-9 pr-8"
                  placeholder="Type item name..."
                  value={nameSearch}
                  onChange={e => { setNameSearch(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  autoComplete="off"
                />
                {nameSearch && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => { setNameSearch(""); setShowSuggestions(false); }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {showSuggestions && nameSuggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-3 py-1 bg-accent/80 border-b border-border">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      {nameSearch ? "Search Results" : "Top 10 Items"}
                    </p>
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {nameSuggestions.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        className="w-full text-left px-4 py-1.5 text-sm hover:bg-blue-600 hover:text-white transition-all flex justify-between items-center group"
                        onClick={() => handleSelectSuggestion(item)}
                      >
                        <span className="font-semibold">{item.name}</span>
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                          {item.category}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {fields.map(f => (
              <div key={f.name} className={f.full ? "col-span-2" : ""}>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{f.label}</label>
                {f.type === "select" ? (
                  <select
                    className="input"
                    value={form[f.name]}
                    onChange={e => {
                      const val = e.target.value;
                      if (f.name === "unit") {
                        const isDecimalUnit = ["kg", "g", "ltr", "ml"].includes(val);
                        setForm(v => {
                          const next = { ...v, unit: val };
                          if (!isDecimalUnit) {
                            if (next.currentQuantity) next.currentQuantity = String(next.currentQuantity).split(".")[0];
                            if (next.totalQuantity) next.totalQuantity = String(next.totalQuantity).split(".")[0];
                            if (next.lowStockThreshold) next.lowStockThreshold = String(next.lowStockThreshold).split(".")[0];
                          }
                          return next;
                        });
                      } else {
                        setForm(v => ({ ...v, [f.name]: val }));
                      }
                    }}
                  >
                    {f.name === "category" || f.name === "taxRate" ? (
                      f.options.map(opt => <option key={opt} value={opt}>{opt}</option>)
                    ) : (
                      f.options.map(opt => <option key={opt.short} value={opt.short}>{opt.label}</option>)
                    )}
                  </select>
                ) : (
                  f.name === "expiryDate" ? (
                    <div className="relative flex items-center">
                      <input
                        className="input pr-10 font-black text-[11px] tracking-tighter"
                        placeholder="DD/MM/YYYY"
                        value={expiryText}
                        onChange={e => handleDateInput(e.target.value)}
                        maxLength={10}
                      />
                      <div className="absolute right-3 flex items-center">
                        <Calendar 
                          className="w-4 h-4 text-primary cursor-pointer hover:opacity-80 transition-opacity" 
                          onClick={() => {
                            const el = document.getElementById('addItem-expiry-picker');
                            if (el?.showPicker) el.showPicker(); else el?.click();
                          }}
                        />
                        <input 
                          id="addItem-expiry-picker"
                          type="date" 
                          className="absolute opacity-0 w-0 h-0 pointer-events-none"
                          value={form.expiryDate}
                          onChange={e => {
                            const val = e.target.value;
                            if (val) {
                              const [y, m, d] = val.split("-");
                              setExpiryText(`${d}/${m}/${y}`);
                              setForm(v => ({ ...v, expiryDate: val }));
                            } else {
                              setExpiryText("");
                              setForm(v => ({ ...v, expiryDate: "" }));
                            }
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="relative group">
                      <input
                        className={`input transition-all duration-300 ${
                          f.name === "sellingPrice" && form.sellingPrice > 0 && form.purchasePrice > 0
                            ? Number(form.sellingPrice) > Number(form.purchasePrice)
                              ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/30 font-bold"
                              : Number(form.sellingPrice) < Number(form.purchasePrice)
                                ? "text-destructive bg-destructive/10 border-destructive/30 font-bold"
                                : ""
                            : ""
                        } ${f.name === "barcode" ? "pr-10" : ""}`}
                        type={f.type}
                        placeholder={f.placeholder}
                        value={form[f.name]}
                        step={(() => {
                          if (f.type !== "number") return undefined;
                          const isDecimalUnit = ["kg", "g", "ltr", "ml"].includes(form.unit);
                          if (f.name === "currentQuantity" || f.name === "totalQuantity" || f.name === "lowStockThreshold") {
                            return isDecimalUnit ? "0.01" : "1";
                          }
                          return "0.01"; // Prices, GST, Unit Value
                        })()}
                        onChange={e => {
                          let val = e.target.value;
                          const isDecimalUnit = ["kg", "g", "ltr", "ml"].includes(form.unit);
                          
                          // Force integer if not a decimal unit
                          if (!isDecimalUnit && (f.name === "currentQuantity" || f.name === "totalQuantity" || f.name === "lowStockThreshold")) {
                            val = val.split(".")[0];
                          }

                          setForm(v => {
                            const next = { ...v, [f.name]: val };
                            if (f.name === "currentQuantity") {
                              if (selectedItem) {
                                next.totalQuantity = Number(selectedItem.currentQuantity || 0) + Number(val || 0);
                              } else {
                                next.totalQuantity = val;
                              }
                            }
                            return next;
                          });
                        }}
                      />
                      {f.name === "barcode" && (
                        <button 
                          type="button"
                          onClick={() => setShowScanner(true)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                          title="Open Camera Scanner"
                        >
                          <Scan className="w-5 h-5" />
                        </button>
                      )}
                      {f.name === "barcode" && (
                        <button 
                          type="button"
                          onClick={() => setShowRemoteQR(!showRemoteQR)}
                          className={`absolute right-10 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all ${showRemoteQR ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-blue-500 hover:bg-blue-50"}`}
                          title="Use Mobile as Scanner"
                        >
                          <Smartphone className="w-5 h-5" />
                        </button>
                      )}
                      {f.name === "barcode" && showRemoteQR && (
                        <div className="absolute top-full left-0 right-0 z-30 mt-2 p-4 bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col items-center animate-in zoom-in-95 duration-200">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Scan with Mobile</p>
                          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-3">
                            <QRCodeSVG value={remoteScanUrl} size={150} />
                          </div>
                          <p className="text-[9px] text-slate-500 text-center leading-relaxed font-medium">
                            Scan this QR code with your phone camera.<br/>
                            Your phone will become a wireless scanner.
                          </p>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            ))}
            {showScanner && (
              <BarcodeScanner 
                onScan={(code) => {
                  setForm(v => ({ ...v, barcode: code }));
                  setShowScanner(false);
                }}
                onClose={() => setShowScanner(false)}
              />
            )}
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="p-8 py-5 border-t border-border bg-card flex justify-end gap-3 rounded-b-[2.5rem]">
          <button type="button" className="btn btn-outline px-6" onClick={onClose}>Cancel</button>
          <button type="submit" form="inventory-form" className="btn btn-primary px-10">Save Item</button>
        </div>
      </div>
    </div>
  );
}

export default function Inventory() {
  const [location, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filterLow, setFilterLow] = useState(false);
  const [filterExpiring, setFilterExpiring] = useState(false);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    setPage(1);
  }, [search, filterLow, filterExpiring]);

  const { data: itemsRes, isLoading } = useQuery({
    queryKey: ["inventory", search, filterLow, filterExpiring, page],
    queryFn: async () => {
      const response = await apiClient.getInventory({ 
        search: search || undefined, 
        lowStock: filterLow || undefined, 
        expiringSoon: filterExpiring || undefined,
        page,
        limit: 10
      });
      return response;
    }
  });

  const items = itemsRes?.data || [];
  const pagination = itemsRes?.pagination || { page: 1, pages: 1 };
  const summary = itemsRes?.summary;

  const createMutation = useMutation({
    mutationFn: apiClient.createInventoryItem,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory"] }); setShowModal(false); },
  });
  const updateMutation = useMutation({
    mutationFn: (data) => apiClient.updateInventoryItem(data.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory"] }); setShowModal(false); },
  });
  const deleteMutation = useMutation({
    mutationFn: apiClient.deleteInventoryItem,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory"] }); },
  });

  const handleSave = (payload) => {
    if (payload.id) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const limit = new Date(); limit.setDate(limit.getDate() + 30);
  const expiryLimit = limit.toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {showModal && <AddItemModal onClose={() => setShowModal(false)} onSave={handleSave} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage product catalog and stock levels</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { 
            label: "Total Items",    
            value: summary?.totalItems ?? "—",              
            active: !filterLow && !filterExpiring,
            onClick: () => { setFilterLow(false); setFilterExpiring(false); }
          },
          { 
            label: "Stock Value",    
            value: formatINR(summary?.totalStockValue),     
            active: false,
            onClick: () => { setFilterLow(false); setFilterExpiring(false); }
          },
          { 
            label: "Low Stock",      
            value: summary?.lowStockCount ?? "—",           
            active: filterLow,
            warn: (summary?.lowStockCount ?? 0) > 0,
            onClick: () => { setFilterLow(!filterLow); setFilterExpiring(false); }
          },
          { 
            label: "Expiring Soon",  
            value: summary?.expiringSoonCount ?? "—",       
            active: filterExpiring,
            warn: (summary?.expiringSoonCount ?? 0) > 0,
            onClick: () => { setFilterExpiring(!filterExpiring); setFilterLow(false); }
          },
        ].map(c => (
          <div 
            key={c.label} 
            onClick={c.onClick}
            className={`card p-4 cursor-pointer transition-all hover:shadow-md border-2 ${
              c.active 
                ? (c.warn ? "border-orange-500 bg-orange-500/10" : "border-primary bg-primary/10") 
                : (c.warn ? "border-orange-500/20 hover:border-orange-500/40" : "border-border hover:border-border/80")
            }`}
          >
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{c.label}</p>
            <p className={`text-xl font-bold mt-1 ${c.warn ? "text-orange-500" : "text-foreground"}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {[
          { 
            label: "Low Stock", 
            active: filterLow, 
            toggle: () => { setFilterLow(!filterLow); }, 
            activeClass: "bg-orange-500/10 border-orange-500/30 text-orange-500" 
          },
          { 
            label: "Expiring Soon", 
            active: filterExpiring, 
            toggle: () => { setFilterExpiring(!filterExpiring); }, 
            activeClass: "bg-amber-500/10 border-amber-500/30 text-amber-500" 
          },
        ].map(f => (
          <button key={f.label} onClick={f.toggle} className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${f.active ? f.activeClass : "border-border bg-card text-muted-foreground hover:bg-accent"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-center py-10 text-gray-400">Loading inventory…</p>
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center py-16 gap-3">
          <Package className="w-12 h-12 text-gray-200" />
          <p className="text-gray-400">No inventory items found.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-accent/30">
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3 font-bold">Item</th>
                <th className="px-4 py-3 font-bold">Category</th>
                <th className="px-4 py-3 font-bold">Location</th>
                <th className="px-4 py-3 font-bold text-right">Unit Value</th>
                <th className="px-4 py-3 font-bold text-right">Stock</th>
                <th className="px-4 py-3 font-bold text-right">Selling Price</th>
                <th className="px-4 py-3 font-bold text-right">Stock Value</th>
                <th className="px-4 py-3 font-bold text-right">Expiry</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map(item => {
                const isLow = item.currentQuantity <= item.lowStockThreshold;
                const isExpiring = item.expiryDate && item.expiryDate >= today && item.expiryDate <= expiryLimit;
                return (
                  <tr key={item.id} className="hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => navigate(`/inventory/${item.id}`)}>
                    <td className="px-4 py-3">
                      <p className="font-bold text-foreground">{item.name}</p>
                      {item.sku && <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter mt-0.5">{item.sku}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-medium">{item.category || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground font-medium">{item.location || "—"}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground font-mono text-xs">{item.unitValue || 1}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${isLow ? "text-orange-500" : "text-foreground"}`}>
                        {item.currentQuantity} {item.unit}
                      </span>
                      {isLow && <AlertTriangle className="inline ml-1 w-3 h-3 text-orange-500" />}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">{formatINR(item.sellingPrice)}</td>
                    <td className="px-4 py-3 text-right font-black text-foreground">{formatINR(item.sellingPrice * item.currentQuantity)}</td>
                    <td className="px-4 py-3 text-right">
                      {item.expiryDate ? (
                        <span className={`font-bold ${isExpiring ? "text-orange-500" : "text-muted-foreground"}`}>
                          {formatDate(item.expiryDate)}
                          {isExpiring && <Clock className="inline ml-1 w-3 h-3" />}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button className="btn btn-ghost p-1.5" onClick={e => { e.stopPropagation(); navigate(`/inventory/${item.id}`); }}><Eye className="w-4 h-4" /></button>
                        <button className="btn btn-danger p-1.5" onClick={e => { e.stopPropagation(); if (confirm(`Delete "${item.name}"?`)) deleteMutation.mutate(item.id); }}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && pagination.pages > 1 && (
        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-border pt-8 pb-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground font-medium">
              Showing Page <span className="text-foreground font-bold">{pagination.page}</span> of <span className="text-foreground font-bold">{pagination.pages}</span>
            </p>
            <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-wider">
              Total {pagination.total} Items
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Page Number Buttons */}
            <div className="flex items-center gap-1 bg-accent p-1 rounded-xl border border-border">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pagination.pages || (p >= page - 1 && p <= page + 1))
                .map((p, i, arr) => (
                  <div key={p} className="flex items-center">
                    {i > 0 && arr[i-1] !== p - 1 && <span className="text-muted-foreground font-bold px-2">...</span>}
                    <button
                      onClick={() => { setPage(p); window.scrollTo(0, 0); }}
                      className={`w-9 h-9 rounded-lg text-sm font-bold transition-all duration-200 ${
                        page === p 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                          : "text-muted-foreground hover:bg-card hover:text-primary hover:shadow-sm"
                      }`}
                    >
                      {p}
                    </button>
                  </div>
                ))}
            </div>

            {/* Jump to Page */}
            <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-1.5 shadow-sm group focus-within:border-primary transition-colors">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Go to</span>
              <input 
                type="number" 
                min="1" 
                max={pagination.pages}
                placeholder={page}
                className="w-10 bg-transparent text-sm font-bold text-foreground focus:outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = parseInt(e.target.value);
                    if (val >= 1 && val <= pagination.pages) {
                       setPage(val);
                       window.scrollTo(0, 0);
                       e.target.value = "";
                       e.target.blur();
                    }
                  }
                }}
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
                disabled={page === 1}
                className="h-10 px-4 rounded-xl bg-card border border-border text-muted-foreground font-bold text-xs uppercase tracking-widest hover:bg-accent hover:border-border/80 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm active:scale-95"
              >
                Prev
              </button>
              <button
                onClick={() => { setPage(p => Math.min(pagination.pages, p + 1)); window.scrollTo(0, 0); }}
                disabled={page === pagination.pages}
                className="h-10 px-4 rounded-xl bg-card border border-border text-muted-foreground font-bold text-xs uppercase tracking-widest hover:bg-accent hover:border-border/80 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm active:scale-95"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
