import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiClient, formatINR, normalizePhone, maskPhone } from "@/lib/api";
import { ArrowLeft, Plus, Trash2, UserPlus, X, Loader2, Search, ChevronDown, Check, Smartphone, Users, FileText, Package, CheckCircle, CreditCard, Banknote, Landmark, Scan, AlertCircle, RotateCcw, Hash } from "lucide-react";
import { toast } from "@/lib/toast";
import BarcodeScanner from "@/components/BarcodeScanner";
import { QRCodeSVG } from "qrcode.react";
import { io } from "socket.io-client";

// ============================================================================
// SEARCHABLE ITEM SELECT
// ============================================================================

function SearchableItemSelect({ inventory, value, selectedName, onChange, onAddNew }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch search results
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["inventory-search", debouncedSearch],
    queryFn: () => apiClient.getInventory({ search: debouncedSearch, limit: 10 }),
    enabled: open && debouncedSearch.trim().length > 0,
  });

  const selected = inventory.find(i => i.id === +value);
  const itemsToShow = debouncedSearch.trim().length > 0
    ? (searchResults?.data || [])
    : inventory.slice(0, 10);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (item) => {
    onChange(item);
    setSearch("");
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  const displayLabel = selectedName || (selected ? `${selected.name} (${selected.unitValue || 1} ${selected.unit})` : null);

  return (
    <div className="relative" ref={ref}>
      {displayLabel && !open ? (
        <div
          className="input rounded-xl text-sm flex items-center justify-between gap-1 cursor-pointer bg-card border-border"
          onClick={() => { setOpen(true); setSearch(""); }}
        >
          <span className="truncate text-foreground font-medium">{displayLabel}</span>
          <button
            type="button"
            className="shrink-0 p-0.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
            onClick={handleClear}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            className="input rounded-xl text-sm pl-9 pr-7"
            type="text"
            placeholder="Search item..."
            value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            autoComplete="off"
          />
          {isLoading && (
            <div className="absolute right-8 top-1/2 -translate-y-1/2">
              <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
            </div>
          )}
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      )}

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-xl shadow-lg max-h-64 overflow-y-auto font-sans">
          <div className="p-2 border-b border-border bg-accent/30 sticky top-0 z-10">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold text-primary border border-primary/20 bg-card hover:bg-accent transition-colors shadow-sm"
              onClick={() => { onAddNew(); setOpen(false); }}
            >
              <Plus className="w-3 h-3" /> Add New Item
            </button>
          </div>

          {itemsToShow.length === 0 && !isLoading ? (
            <div className="px-3 py-4 text-center text-sm text-gray-400 font-medium italic">No items found</div>
          ) : (
            itemsToShow.map(i => (
              <button
                key={i.id}
                type="button"
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-accent transition-all group ${+value === i.id ? "bg-accent text-primary" : "text-foreground"
                  }`}
                onClick={() => handleSelect(i)}
              >
                <div className="truncate pr-4 flex-1">
                  <p className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">{i.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-tighter">SKU: {i.sku || 'N/A'}</span>
                    <div className="w-1 h-1 rounded-full bg-border" />
                    <span className={`text-[10px] font-semibold uppercase tracking-tighter ${i.currentQuantity <= (i.lowStockThreshold || 10) ? 'text-orange-500' : 'text-emerald-500'}`}>
                      Stock: {i.currentQuantity} {i.unit}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-primary tabular-nums tracking-tighter">{formatINR(i.sellingPrice)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const CATEGORIES = ["Groceries", "Dairy", "Beverages", "Personal Care", "Household", "Electronics", "Hardware", "Others"];
const UNITS = [
  { short: "pcs", label: "Piece (pcs)" }, { short: "kg", label: "Kilogram (kg)" },
  { short: "g", label: "Gram (g)" }, { short: "ltr", label: "Liter (ltr)" },
  { short: "ml", label: "Milliliter (ml)" }, { short: "box", label: "Box (box)" },
  { short: "pkt", label: "Packet (pkt)" }, { short: "dz", label: "Dozen (dz)" }
];

function QuickAddItemModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: "", category: CATEGORIES[0], unit: UNITS[0].short,
    purchasePrice: 0, sellingPrice: 0, currentQuantity: 0, totalQuantity: 0,
    lowStockThreshold: 10, taxRate: 18, unitValue: 1.0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Item name is required"); return; }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden border border-border">
        <h2 className="text-xl font-bold text-foreground mb-5">Quick Add Item</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Item Name *</label>
            <input className="input" placeholder="e.g. Fresh Milk" value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Unit *</label>
              <select className="input" value={form.unit} onChange={e => setForm(v => ({ ...v, unit: e.target.value }))}>
                {UNITS.map(u => <option key={u.short} value={u.short}>{u.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Selling Price (₹)</label>
              <input className="input" type="number" step="0.01" value={form.sellingPrice} onChange={e => setForm(v => ({ ...v, sellingPrice: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Current Stock</label>
              <input className="input" type="number" value={form.currentQuantity} onChange={e => setForm(v => ({ ...v, currentQuantity: e.target.value, totalQuantity: e.target.value }))} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">GST Rate (%)</label>
              <input className="input" type="number" value={form.taxRate} onChange={e => setForm(v => ({ ...v, taxRate: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Product</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper to generate a 6-character hex bill code
function generateRandomBillCode() {
  const bytes = new Uint8Array(3);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

// ============================================================================
// NUMBER TO WORDS (Indian Rupees)
// ============================================================================

function numberToWordsINR(num) {
  if (num === 0) return "Rupees Zero Only";
  const isNegative = num < 0;
  num = Math.abs(Math.round(num));

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function twoDigits(n) {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  }

  function threeDigits(n) {
    if (n === 0) return "";
    if (n < 100) return twoDigits(n);
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + twoDigits(n % 100) : "");
  }

  // Indian system: Crore, Lakh, Thousand, Hundred
  const parts = [];
  if (num >= 10000000) {
    parts.push(threeDigits(Math.floor(num / 10000000)) + " Crore");
    num %= 10000000;
  }
  if (num >= 100000) {
    parts.push(twoDigits(Math.floor(num / 100000)) + " Lakh");
    num %= 100000;
  }
  if (num >= 1000) {
    parts.push(twoDigits(Math.floor(num / 1000)) + " Thousand");
    num %= 1000;
  }
  if (num > 0) {
    parts.push(threeDigits(num));
  }

  const words = parts.join(" ");
  return (isNegative ? "Minus " : "") + "Rupees " + words + " Only";
}

// Debounce hook
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ============================================================================
// QUICK ADD CUSTOMER MODAL (with phone autocomplete, deferred creation)
// ============================================================================

function QuickAddCustomerModal({ onClose, onAdd }) {
  const [billCode] = useState(generateRandomBillCode);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", pincode: "", gender: "M", gstNumber: "" });
  const [errors, setErrors] = useState({});

  // Phone autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedId, setSelectedId] = useState(null); // Track if we picked an existing record
  const debouncedPhone = useDebounce(form.phone.replace(/\D/g, ""), 300);
  const phoneRef = useRef(null);

  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: apiClient.getSettings });
  const maskEnabled = settings?.maskPhoneNumbers;

  // Fetch suggestions when phone changes
  useEffect(() => {
    const rawPhone = debouncedPhone;
    if (rawPhone.length >= 1) {
      setLoadingSuggestions(true);
      apiClient.searchCustomersByPhone(rawPhone)
        .then((results) => {
          setSuggestions(results);

          // Auto-select if perfect 10-digit match
          if (rawPhone.length === 10) {
            const exactMatch = results.find(c => c.phone?.replace(/\D/g, "") === rawPhone);
            if (exactMatch && exactMatch.id !== selectedId) {
              selectExistingCustomer(exactMatch);
              setShowSuggestions(false);
              return;
            }
          }

          if (selectedId) {
            setShowSuggestions(false);
          } else {
            setShowSuggestions(results.length > 0);
          }
        })
        .catch(() => setSuggestions([]))
        .finally(() => setLoadingSuggestions(false));
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedPhone]);

  const selectExistingCustomer = (customer) => {
    const isWalkIn = customer.name?.toLowerCase().includes("walk-in");
    setForm(prev => ({
      ...prev,
      name: (prev.name.trim() && !prev.name.toLowerCase().includes("walk-in"))
        ? prev.name
        : (isWalkIn ? "" : (customer.name || "")),
      phone: customer.phone || prev.phone,
      email: customer.email || prev.email,
      address: customer.address || prev.address,
      pincode: customer.pincode || prev.pincode,
      gender: customer.gender || prev.gender || "M",
      gstNumber: customer.gstNumber || prev.gstNumber,
    }));
    setSelectedId(customer.id);
    setShowSuggestions(false);
  };

  const validate = () => {
    const e = {};
    if (form.phone.trim() && form.phone.replace(/\D/g, "").length < 10) e.phone = "Valid phone number is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const customerName = form.name.trim() || `Walk-in #${billCode}`;

    onAdd({
      customer: {
        id: selectedId,
        name: customerName,
        phone: normalizePhone(form.phone) || null,
        email: form.email.trim() || null,
        address: form.address?.trim() || null,
        pincode: form.pincode?.trim() || null,
        gender: form.gender,
        gstNumber: form.gstNumber.trim() || null,
      },
      billCode,
      isNew: !selectedId,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-base font-bold text-foreground">Add Customer</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground mb-2">Name *</label>
              <input
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                type="text"
                placeholder="Ravi Sharma"
                value={form.name}
                onChange={e => setForm(v => ({ ...v, name: e.target.value }))}
              />
            </div>

            <div className="relative">
              <label className="block text-[10px] font-semibold text-muted-foreground mb-2">Phone *</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none border-r border-border pr-2">
                  <span className="text-[10px] font-bold text-muted-foreground">IND</span>
                  <span className="text-xs font-bold text-foreground">+91</span>
                </div>
                <input
                  ref={phoneRef}
                  className={`w-full bg-card border border-border rounded-xl pl-20 pr-4 py-3 text-sm text-foreground font-mono focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all ${errors.phone ? "border-rose-500/50" : ""}`}
                  type="tel"
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setForm(v => ({ ...v, phone: val }));
                    setShowSuggestions(true);
                    setSelectedId(null);
                  }}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  autoComplete="off"
                />
                {loadingSuggestions && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 z-50 mt-2 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-2 bg-card border-b border-border">
                    <p className="text-[10px] font-bold text-primary">Match Found</p>
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {suggestions.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-primary group transition-all text-left border-b border-border last:border-none"
                        onClick={() => selectExistingCustomer(c)}
                      >
                        <div className="w-10 h-10 rounded-full bg-accent group-hover:bg-white flex items-center justify-center text-muted-foreground group-hover:text-primary font-bold text-sm shrink-0 transition-colors shadow-sm">
                          {c.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          {c.name && !c.name.toLowerCase().includes("walk-in") && (
                            <p className="text-[10px] font-semibold text-muted-foreground group-hover:text-white/70 transition-colors">{c.name}</p>
                          )}
                          <p className="text-lg font-bold text-foreground group-hover:text-white transition-colors tracking-tighter">
                            {maskPhone(c.phone, maskEnabled)}
                          </p>
                        </div>
                        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground mb-2">Email</label>
              <input
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                type="email"
                placeholder="ravi@example.com"
                value={form.email}
                onChange={e => setForm(v => ({ ...v, email: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground mb-2">Address</label>
              <input
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                type="text"
                placeholder="12, MG Road, Bengaluru"
                value={form.address}
                onChange={e => setForm(v => ({ ...v, address: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground mb-2">Pincode</label>
                <input
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground font-mono focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                  type="text"
                  placeholder="560001"
                  value={form.pincode}
                  onChange={e => setForm(v => ({ ...v, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground mb-2">Gender</label>
                <div className="flex bg-card border border-border rounded-xl p-1 h-[46px]">
                  <button
                    type="button"
                    onClick={() => setForm(v => ({ ...v, gender: "M" }))}
                    className={`flex-1 rounded-lg text-[10px] font-bold transition-all ${form.gender === "M" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-accent"}`}
                  >
                    M
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(v => ({ ...v, gender: "F" }))}
                    className={`flex-1 rounded-lg text-[10px] font-bold transition-all ${form.gender === "F" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-accent"}`}
                  >
                    F
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground mb-2">GST Number</label>
              <input
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground font-mono uppercase focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                type="text"
                placeholder="29AADCB2230M1ZP"
                value={form.gstNumber}
                onChange={e => setForm(v => ({ ...v, gstNumber: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <button type="button" className="flex-1 px-6 py-3.5 rounded-xl text-xs font-bold text-foreground border border-border hover:bg-accent transition-all" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3.5 rounded-xl text-xs font-bold text-white bg-primary hover:opacity-90 shadow-lg shadow-primary/20 transition-all"
              >
                Add Customer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// RETURN BILL MODAL
// ============================================================================

function ReturnBillModal({ onClose, onReturn }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) { toast.error("Please enter a bill code"); return; }
    setLoading(true);
    try {
      const bill = await apiClient.getBillByCode(code.trim());
      toast.success("Bill found");
      onReturn(bill);
    } catch (err) {
      toast.error(err.response?.data?.error || "Bill not found with that code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm p-6 border border-border">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">Return Bill</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-accent text-muted-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Bill Code</label>
            <input
              className="input text-center tracking-[0.3em] uppercase font-mono text-lg"
              type="text"
              maxLength={8}
              placeholder="A3F2B1"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              autoFocus
            />
            <p className="text-[10px] text-muted-foreground mt-2 font-medium uppercase tracking-tight text-center">Enter the 6-character code from the original bill</p>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Looking up...</> : "Find Bill"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// NEW BILL PAGE
// ============================================================================

export default function NewBill() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  // Customer state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [billCode, setBillCode] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showQuickAddItem, setShowQuickAddItem] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  // Auto-load return bill from URL params (when coming from Bills page)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "return" && params.get("billId")) {
      const billId = params.get("billId");
      apiClient.getBill(billId).then(bill => {
        if (bill) {
          setSelectedCustomer(bill.customer);
          setIsNewCustomer(false);
          setBillCode(bill.billCode || "");
          setStatus(bill.status || "unpaid");
          if (bill.dueDate) setDueDate(bill.dueDate.split('T')[0]);
          setNotes(`Return for Bill #${bill.billCode || bill.billNumber}`);
          if (bill.items && bill.items.length > 0) {
            setItems(bill.items.map(item => ({
              inventoryItemId: String(item.inventoryItemId),
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              discount: Number(item.discount),
              discountType: item.discountType || "percent",
              taxRate: Number(item.taxRate),
              itemName: item.itemName,
            })));
          }
        }
      }).catch(() => {
        toast.error("Could not load return bill");
      });
    }
  }, []);

  // Bill form state
  const [status, setStatus] = useState("unpaid");
  const [paidAmount, setPaidAmount] = useState("");
  const [billDate, setBillDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [billDiscount, setBillDiscount] = useState("");
  const [billDiscountType, setBillDiscountType] = useState("percent");
  const [items, setItems] = useState([{ inventoryItemId: "", quantity: "", unitPrice: "", discount: "", discountType: "percent", taxRate: "", itemName: "" }]);

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory"], queryFn: async () => {
      const response = await apiClient.getInventory();
      return response.data || response.inventory || response || [];
    }
  });
  const { data: nextNumber } = useQuery({ queryKey: ["next-bill-number"], queryFn: apiClient.getNextBillNumber });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: apiClient.getSettings });
  const maskEnabled = settings?.maskPhoneNumbers;

  const createItemMutation = useMutation({
    mutationFn: apiClient.createInventoryItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Item added to inventory");
      setShowQuickAddItem(false);
    },
    onError: () => toast.error("Failed to add item"),
  });

  const createMutation = useMutation({
    mutationFn: apiClient.createBill,
    onSuccess: (bill) => {
      qc.invalidateQueries({ queryKey: ["bills"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Bill created successfully!");
      navigate(`/bills/${bill.id}`);
    },
    onError: (e) => toast.error(e.response?.data?.error || "Failed to create bill"),
  });

  const emptyItem = () => ({ inventoryItemId: "", quantity: 0, unitPrice: 0, discount: 0, discountType: "percent", taxRate: 0, itemName: "" });

  // Item handlers
  const handleItemChange = (idx, field, value) => {
    const updated = [...items];
    let finalValue = value;

    if (field === "quantity") {
      // Force integer for quantity in bills
      finalValue = String(value).split(".")[0] || "0";

      const invItemId = updated[idx].inventoryItemId;
      if (invItemId) {
        const invItem = inventory.find(i => i.id === +invItemId);
        if (invItem) {
          const maxQty = Math.floor(invItem.currentQuantity / (invItem.unitValue || 1));
          if (Number(finalValue) > maxQty) {
            finalValue = maxQty;
            toast.error(`Max allowed quantity is ${maxQty} based on current stock`);
          }
        }
      }
    }

    if (field === "inventoryItemId") {
      const isObj = typeof value === "object" && value !== null;
      const inv = isObj ? value : inventory.find(i => i.id === +value);

      if (inv) {
        updated[idx].inventoryItemId = String(inv.id);
        updated[idx].unitPrice = Number(inv.sellingPrice) || 0;
        updated[idx].taxRate = Number(inv.taxRate) || 0;
        updated[idx].itemName = inv.name ? `${inv.name} (${inv.unitValue || 1} ${inv.unit})` : "";

        const maxQty = Math.floor(inv.currentQuantity / (inv.unitValue || 1));
        updated[idx].quantity = maxQty > 0 ? 1 : 0;

        updated[idx].discount = 0;
        updated[idx].discountType = "percent";
      } else {
        updated[idx].inventoryItemId = "";
        updated[idx].unitPrice = 0;
        updated[idx].taxRate = 0;
        updated[idx].itemName = "";
        updated[idx].quantity = 0;
      }
    } else {
      updated[idx][field] = finalValue;
    }
    // Auto-add a new empty row if this is the last row and an item was selected
    if (value && idx === updated.length - 1) {
      updated.push(emptyItem());
    }
    setItems(updated);
  };

  const removeItem = (idx) => {
    const updated = items.filter((_, i) => i !== idx);
    if (updated.length === 0) {
      setItems([emptyItem()]);
    } else {
      setItems(updated);
    }
  };

  // Calculations
  const calcDiscount = (item) => {
    const base = item.quantity * item.unitPrice;
    if (item.discountType === "amount") return Math.min(Number(item.discount) || 0, base);
    return base * ((Number(item.discount) || 0) / 100);
  };

  const calcLine = (item) => {
    const base = item.quantity * item.unitPrice;
    const disc = calcDiscount(item);
    const after = base - disc;
    const tax = after * (item.taxRate / 100);
    return after + tax;
  };

  const subtotal = items.reduce((a, i) => a + i.quantity * i.unitPrice, 0);
  const lineDiscount = items.reduce((a, i) => a + calcDiscount(i), 0);
  const tax = items.reduce((a, i) => { const base = i.quantity * i.unitPrice; const d = calcDiscount(i); return a + (base - d) * (i.taxRate / 100); }, 0);
  const afterLineDiscount = subtotal - lineDiscount + tax;
  const calcBillDiscount = () => {
    const val = Number(billDiscount) || 0;
    if (billDiscountType === "amount") return Math.min(val, afterLineDiscount);
    return afterLineDiscount * (Math.min(val, 100) / 100);
  };
  const billDiscountAmount = calcBillDiscount();
  const total = afterLineDiscount - billDiscountAmount;

  // Quick Add callback — deferred (no API call)
  const handleQuickAdd = ({ customer, billCode: code, isNew }) => {
    setSelectedCustomer(customer);
    setIsNewCustomer(isNew);
    setBillCode(code);
    setShowQuickAdd(false);
  };

  // Return callback — auto-populate from existing bill
  const handleReturn = (bill) => {
    setSelectedCustomer(bill.customer);
    setIsNewCustomer(false);
    setBillCode(bill.billCode || "");
    setStatus(bill.status || "unpaid");
    if (bill.dueDate) setDueDate(bill.dueDate.split('T')[0]);
    setNotes(`Return for Bill #${bill.billCode || bill.billNumber}`);
    // Populate items from the original bill
    if (bill.items && bill.items.length > 0) {
      setItems(bill.items.map(item => ({
        inventoryItemId: String(item.inventoryItemId),
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        discountType: item.discountType || "percent",
        taxRate: Number(item.taxRate),
        itemName: item.itemName,
      })));
    }
    setShowReturn(false);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setIsNewCustomer(false);
    setBillCode("");
  };

  // Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCustomer) { toast.error("Please add a customer first"); return; }
    // Filter out blank item rows (no product selected)
    const filledItems = items.filter(i => i.inventoryItemId);

    if (filledItems.length === 0) {
      toast.error("Please select at least one item");
      return;
    }

    const totalQty = filledItems.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
    if (totalQty <= 0) {
      toast.error("Total quantity must be greater than 0");
      return;
    }

    if (total <= 0) {
      toast.error("Total bill amount must be greater than ₹0");
      return;
    }

    // Ensure we have a billCode to send to the backend
    const finalBillCode = billCode || generateRandomBillCode();

    const payload = {
      billCode: finalBillCode,
      status,
      paymentMethod,
      dueDate: dueDate || null,
      notes: notes || null,
      items: filledItems.map(i => ({
        inventoryItemId: +i.inventoryItemId,
        quantity: +i.quantity,
        unitPrice: +i.unitPrice,
        discount: +i.discount,
        taxRate: +i.taxRate,
        itemName: i.itemName,
      })),
    };

    // If partial, validate and include paidAmount
    if (status === "partial") {
      const pAmount = Number(paidAmount);
      if (!pAmount || pAmount <= 0) {
        toast.error("Please enter a valid paid amount for partial payment");
        return;
      }
      if (pAmount > total) {
        toast.error(`Paid amount cannot exceed the total bill amount`);
        return;
      }
      if (pAmount === total) {
        payload.status = "paid";
        payload.paidAmount = total;
      } else {
        payload.paidAmount = pAmount;
      }
    } else if (status === "paid") {
      payload.paidAmount = total;
    }

    // Customer data
    if (selectedCustomer) {
      // Always send current details for potential upsert
      payload.newCustomer = {
        name: selectedCustomer.name,
        phone: selectedCustomer.phone,
        email: selectedCustomer.email,
        gstNumber: selectedCustomer.gstNumber,
      };
      // If it's an existing customer, also send the ID
      if (selectedCustomer.id) {
        payload.customerId = selectedCustomer.id;
      }
    } else {
      toast.error("Please select a customer");
      return;
    }

    createMutation.mutate(payload);
  };

  const [showScanner, setShowScanner] = useState(false);
  const [showRemoteQR, setShowRemoteQR] = useState(false);
  const [sessionId] = useState(() => "bill-" + Math.random().toString(36).substring(2, 9));

  // Handle Scan Logic
  const handleBarcodeScan = async (code) => {
    try {
      const response = await apiClient.getInventory({ search: code, limit: 1 });
      if (response.data && response.data.length > 0) {
        const product = response.data[0];
        // Check if item already in bill
        const existingIndex = items.findIndex(i => i.inventoryItemId === product.id);
        if (existingIndex !== -1) {
          const updated = [...items];
          updated[existingIndex].quantity = (Number(updated[existingIndex].quantity) || 0) + 1;
          setItems(updated);
        } else {
          // Add new item row or fill last empty row
          setItems(prev => {
            const lastRow = prev[prev.length - 1];
            if (lastRow && !lastRow.inventoryItemId) {
              const updated = [...prev];
              updated[updated.length - 1] = {
                inventoryItemId: product.id,
                itemName: product.name,
                unitPrice: product.sellingPrice,
                taxRate: product.taxRate,
                quantity: 1,
                discount: 0,
                discountType: "percent"
              };
              return updated;
            }
            return [...prev, {
              inventoryItemId: product.id,
              itemName: product.name,
              unitPrice: product.sellingPrice,
              taxRate: product.taxRate,
              quantity: 1,
              discount: 0,
              discountType: "percent"
            }];
          });
        }
        toast.success(`Scanned: ${product.name}`);
      } else {
        toast.error(`No product found for barcode: ${code}`);
      }
    } catch (err) {
      toast.error("Scanner lookup failed");
    }
  };

  // Setup Socket for Remote Scanning
  useEffect(() => {
    const socket = io(window.location.origin);
    socket.emit("join-session", sessionId);
    socket.on("barcode-received", handleBarcodeScan);
    return () => socket.disconnect();
  }, [sessionId, items]);

  const remoteScanUrl = `${window.location.protocol}//${window.location.host}/m-scan?sid=${sessionId}`;

  return (
    <div className="max-w-7xl space-y-6">
      {/* Modals */}
      {showQuickAdd && <QuickAddCustomerModal onClose={() => setShowQuickAdd(false)} onAdd={handleQuickAdd} />}
      {showQuickAddItem && <QuickAddItemModal onClose={() => setShowQuickAddItem(false)} onSave={createItemMutation.mutate} />}
      {showReturn && <ReturnBillModal onClose={() => setShowReturn(false)} onReturn={handleReturn} />}

      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Page header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" className="btn btn-ghost p-2" onClick={() => navigate("/bills")}><ArrowLeft className="w-4 h-4" /></button>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">New Bill</h1>
            <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Bill #{nextNumber?.billNumber || "…"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Scanner Controls */}
          <div className="flex items-center bg-card border border-border rounded-2xl p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:bg-accent rounded-xl transition-all font-bold text-xs uppercase tracking-wider"
            >
              <Scan className="w-4 h-4 text-primary" />
              Scan
            </button>
            <div className="w-px h-6 bg-border" />
            <button
              type="button"
              onClick={() => setShowRemoteQR(!showRemoteQR)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-xs uppercase tracking-wider ${showRemoteQR ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-accent"}`}
            >
              <Smartphone className="w-4 h-4 text-primary" />
              Remote
            </button>
          </div>
        </div>
      </div>

      {/* Remote Scanner QR Dropdown */}
      {showRemoteQR && (
        <div className="card p-6 border-2 border-primary/20 bg-primary/5 flex flex-col md:flex-row items-center gap-8 animate-in slide-in-from-top-4 duration-300">
          <div className="p-4 bg-card rounded-3xl shadow-xl border border-primary/20 shrink-0">
            <QRCodeSVG value={remoteScanUrl} size={160} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Smartphone className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-black text-foreground">Wireless Scanner Active</h3>
            </div>
            <p className="text-muted-foreground font-medium leading-relaxed max-w-md">
              Scan this QR code with your phone to link it to this bill.
              Any product you scan on your phone will appear here instantly.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Waiting for remote scan...</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowRemoteQR(false)}
            className="ml-auto p-2 hover:bg-accent rounded-full transition-colors self-start"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-2xl shadow-black/5">
        {/* Top Section: Customer + Bill Config Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Section 1: Customer */}
          <div className="p-8 space-y-6 bg-card/50">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                  <Users className="w-3 h-3" /> Step 01
                </h2>
                <p className="text-sm font-semibold text-foreground uppercase tracking-wider">Customer Intelligence</p>
              </div>
              {!selectedCustomer && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowQuickAdd(true)} className="h-8 px-4 bg-primary text-primary-foreground rounded-full text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                    + New
                  </button>
                  <button type="button" onClick={() => setShowReturn(true)} className="h-8 px-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-rose-500/20 transition-all">
                    Return
                  </button>
                </div>
              )}
            </div>

            {selectedCustomer ? (
              <div className="flex items-center gap-5 p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl animate-in slide-in-from-left-4 duration-500 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl shadow-inner">
                  {selectedCustomer.name?.charAt(0)?.toUpperCase() || "C"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-foreground truncate tracking-tight">{selectedCustomer.name}</p>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">{selectedCustomer.phone}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase">
                    #{billCode || "NEW"}
                  </span>
                  <button type="button" onClick={() => setSelectedCustomer(null)} className="text-xs font-bold text-primary hover:underline">
                    Change
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-10 border border-dashed border-border/60 rounded-2xl text-center bg-accent/20 group hover:border-primary/40 hover:bg-accent/40 transition-all cursor-pointer" onClick={() => setShowQuickAdd(true)}>
                 <div className="w-10 h-10 bg-card rounded-full flex items-center justify-center mx-auto mb-3 border border-border/60 group-hover:scale-110 group-hover:border-primary/40 transition-all">
                   <UserPlus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                 </div>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select or Search Customer</p>
              </div>
            )}
          </div>

          {/* Section 2: Bill Details */}
          <div className="p-8 space-y-6 bg-accent/5">
            <div className="space-y-1">
              <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <FileText className="w-3 h-3" /> Step 02
              </h2>
              <p className="text-sm font-semibold text-foreground uppercase tracking-wider">Invoice Configuration</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">Billing Status</label>
                <select className="input h-11 bg-background border-border shadow-sm rounded-xl" value={status} onChange={e => {
                  const newStatus = e.target.value;
                  setStatus(newStatus);
                  if (newStatus !== "partial") setPaidAmount("");
                  if (newStatus === "paid" || newStatus === "quotation") setDueDate(new Date().toISOString().split('T')[0]);
                }}>
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial Paid</option>
                  <option value="quotation">Quotation</option>
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">Issue Date</label>
                <input className="input bg-background border-border shadow-sm h-11 text-sm rounded-xl" type="date" value={billDate} onChange={e => setBillDate(e.target.value)} />
              </div>
              {(status === "unpaid" || status === "partial") && (
                <div className="col-span-2 animate-in slide-in-from-top-2">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">Due Date</label>
                  <input className="input bg-background border-border shadow-sm h-11 text-sm rounded-xl" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
              )}
            </div>
            
            {status === "partial" && (
              <div className="mt-4 animate-in slide-in-from-top-4">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">Paid Amount (₹)</label>
                <input className="input bg-background border-border shadow-sm h-11 text-sm font-medium rounded-xl" type="number" step="0.01" min="0" placeholder="0.00" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} />
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Items */}
        <div className="p-8 border-t border-border/60">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <Package className="w-3 h-3" /> Step 03
              </h2>
              <p className="text-sm font-semibold text-foreground uppercase tracking-wider">Line Items & Inventory</p>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold text-muted-foreground uppercase bg-accent/50 px-3 py-1.5 rounded-full border border-border/60">Selected: {items.filter(i => i.inventoryItemId).length}</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Header for wide screens */}
            <div className="hidden lg:grid items-center gap-6 px-6 mb-3 text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]" style={{ gridTemplateColumns: '1fr 100px 140px 160px 100px 120px 40px' }}>
              <span>Item Detail</span>
              <span className="text-center">Qty</span>
              <span className="text-center">Rate (₹)</span>
              <span className="text-center">Disc</span>
              <span className="text-center">Tax %</span>
              <span className="text-right">Total Amount</span>
              <span></span>
            </div>

            {/* Rows */}
            <div className="space-y-3">
              {items.map((item, idx) => {
                const invItem = inventory.find(i => i.id === +item.inventoryItemId);
                const maxQty = invItem ? Math.floor(invItem.currentQuantity / (invItem.unitValue || 1)) : undefined;

                return (
                  <div key={idx} className="grid items-center gap-6 bg-accent/10 border border-border/30 rounded-2xl p-3.5 transition-all hover:bg-accent/20 hover:border-border/60 group/row" style={{ gridTemplateColumns: '1fr 100px 140px 160px 100px 120px 40px' }}>
                    <SearchableItemSelect
                      inventory={inventory}
                      value={item.inventoryItemId}
                      selectedName={item.itemName}
                      onChange={val => handleItemChange(idx, "inventoryItemId", val)}
                      onAddNew={() => setShowQuickAddItem(true)}
                    />

                    <div className="flex items-center gap-2 justify-center">
                      <input className="input bg-background border-border shadow-sm h-10 text-center font-bold px-1 rounded-lg" type="number" min="0" max={maxQty} value={item.quantity} onChange={e => handleItemChange(idx, "quantity", e.target.value)} />
                      {invItem && <span className="text-[10px] text-muted-foreground font-medium uppercase shrink-0">{invItem.unit}</span>}
                    </div>

                    <div className="flex items-center justify-center">
                      <input className="input bg-background border-border shadow-sm h-10 text-center font-bold px-4 rounded-lg" type="number" step="0.01" value={item.unitPrice} onChange={e => handleItemChange(idx, "unitPrice", e.target.value)} />
                    </div>

                    <div className="flex items-center gap-1">
                      <input className="input bg-background border-border shadow-sm h-10 text-center font-bold flex-1 px-1 rounded-lg" type="number" min="0" value={item.discount} onChange={e => handleItemChange(idx, "discount", e.target.value)} />
                      <select className="input bg-background border-border shadow-sm h-10 w-12 text-center text-[10px] font-bold p-0 rounded-lg focus:border-primary" value={item.discountType} onChange={e => handleItemChange(idx, "discountType", e.target.value)}>
                        <option value="percent">%</option>
                        <option value="amount">₹</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-center">
                      <input className="input bg-background border-border shadow-sm h-10 text-center font-bold rounded-lg" type="number" step="0.01" value={item.taxRate} onChange={e => handleItemChange(idx, "taxRate", e.target.value)} />
                    </div>

                    <span className="text-sm font-semibold text-foreground text-right tabular-nums">
                      {formatINR(calcLine(item))}
                    </span>

                    <div className="flex justify-center">
                      <button type="button" className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-500 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all border border-rose-100 dark:border-rose-900/40" onClick={() => removeItem(idx)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button type="button" className="btn bg-accent/30 border border-dashed border-border/60 w-full py-4 text-[10px] font-bold uppercase tracking-widest hover:border-primary/40 hover:bg-accent/50 hover:text-primary transition-all rounded-2xl" onClick={() => setItems(v => [...v, emptyItem()])}>
              <Plus className="w-4 h-4" /> Add Next Item
            </button>
          </div>
        </div>

        {/* Section 4: Final Summary */}
        <div className="p-8 border-t border-border/60 bg-accent/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Step 04</h2>
                  <p className="text-sm font-semibold text-foreground uppercase tracking-wider">Additional Context</p>
                </div>
                
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest">Select Payment Method</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: "UPI", icon: Smartphone, label: "UPI" },
                      { id: "Cash", icon: Banknote, label: "Cash" },
                      { id: "Card", icon: CreditCard, label: "Card" },
                      { id: "Bank Transfer", icon: Landmark, label: "Bank" }
                    ].map(pm => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                          paymentMethod === pm.id 
                            ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/10" 
                            : "bg-card border-border hover:border-border/80 text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        <pm.icon className={`w-3.5 h-3.5 ${paymentMethod === pm.id ? "text-primary-foreground" : "text-muted-foreground"}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{pm.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <textarea className="w-full bg-background border border-border shadow-sm rounded-2xl p-5 h-32 resize-none text-sm placeholder:text-muted-foreground/30 transition-all" placeholder="Add terms, conditions, or internal notes..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col justify-between">
              <div className="space-y-3 pt-6">
                <div className="flex justify-between text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  <span>Gross Subtotal</span>
                  <span className="text-foreground tracking-normal">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs font-medium text-rose-500 uppercase tracking-widest">
                  <span>Discounts Applied</span>
                  <span className="tracking-normal">- {formatINR(lineDiscount)}</span>
                </div>
                <div className="flex justify-between text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  <span>Tax Amount (GST)</span>
                  <span className="text-foreground tracking-normal">+ {formatINR(tax)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 py-4 border-y border-border/60 mt-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Final Discount</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input className="w-16 h-9 bg-background border border-border rounded-lg text-center font-bold text-xs shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/5" type="number" value={billDiscount} onChange={setBillDiscount} />
                    <select className="h-9 bg-background border border-border rounded-lg px-2 text-[10px] font-bold shadow-sm focus:border-primary" value={billDiscountType} onChange={setBillDiscountType}>
                      <option value="percent">%</option>
                      <option value="amount">₹</option>
                    </select>
                    <span className="text-rose-500 font-bold ml-2 text-sm">- {formatINR(billDiscountAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t-2 border-primary/20">
                <div className="flex items-end justify-between mb-2">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-primary uppercase tracking-[0.3em]">Payable Amount</p>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-tight italic">{numberToWordsINR(total)}</p>
                  </div>
                  <span className="text-5xl font-bold tracking-tighter text-foreground drop-shadow-sm">{formatINR(total)}</span>
                </div>
                
                <button type="submit" className="w-full mt-10 py-5 bg-primary text-primary-foreground rounded-2xl text-xs font-bold uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-3" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  {createMutation.isPending ? "Generating Invoice..." : "Finalize & Save Bill"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
