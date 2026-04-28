import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiClient, formatINR } from "@/lib/api";
import { ArrowLeft, Plus, Trash2, UserPlus, RotateCcw, X, Hash, Loader2, Search, ChevronDown, Check } from "lucide-react";
import { toast } from "@/lib/toast";

// ============================================================================
// SEARCHABLE ITEM SELECT
// ============================================================================

function SearchableItemSelect({ inventory, value, onChange }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = inventory.find(i => i.id === +value);
  const filtered = search.trim()
    ? inventory.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : inventory;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (item) => {
    onChange(String(item.id));
    setSearch("");
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  return (
    <div className="relative" ref={ref}>
      {selected && !open ? (
        // Show selected item as a badge
        <div
          className="input text-sm flex items-center justify-between gap-1 cursor-pointer"
          onClick={() => { setOpen(true); setSearch(""); }}
        >
          <span className="truncate">{selected.name} ({selected.unitValue || 1} {selected.unit})</span>
          <button
            type="button"
            className="shrink-0 p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={handleClear}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        // Search input
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            className="input text-sm pl-8 pr-7"
            type="text"
            placeholder="Search item..."
            value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            autoComplete="off"
          />
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-3 text-center text-sm text-gray-400">No items found</div>
          ) : (
            filtered.map(i => (
              <button
                key={i.id}
                type="button"
                className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-blue-50 transition-colors ${
                  +value === i.id ? "bg-blue-50 text-blue-700" : "text-gray-700"
                }`}
                onClick={() => handleSelect(i)}
              >
                <span className="truncate font-medium">{i.name} ({i.unitValue || 1} {i.unit})</span>
                <span className="shrink-0 ml-2 text-xs text-gray-400">
                  Stock: {i.currentQuantity} {i.unit}
                </span>
              </button>
            ))
          )}
        </div>
      )}
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
  const [form, setForm] = useState({ name: "", phone: "", email: "", gstNumber: "" });
  const [errors, setErrors] = useState({});

  // Phone autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedId, setSelectedId] = useState(null); // Track if we picked an existing record
  const debouncedPhone = useDebounce(form.phone.replace(/\D/g, ""), 300);
  const phoneRef = useRef(null);

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
            if (exactMatch) {
              selectExistingCustomer(exactMatch);
              setShowSuggestions(false);
              return;
            }
          }
          
          setShowSuggestions(results.length > 0);
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
      // Only overwrite name if current is empty or a walk-in
      name: (prev.name.trim() && !prev.name.toLowerCase().includes("walk-in")) 
            ? prev.name 
            : (isWalkIn ? "" : (customer.name || "")),
      phone: customer.phone || prev.phone,
      email: customer.email || prev.email,
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
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        gstNumber: form.gstNumber.trim() || null,
      },
      billCode,
      isNew: !selectedId,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          <h2 className="text-lg font-semibold text-gray-900">Quick Add Customer</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Bill Code Badge */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
              <Hash className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">Bill Code</p>
              <p className="text-lg font-bold text-amber-600 tracking-widest">{billCode}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Full Name</label>
              <input
                className="input"
                type="text"
                placeholder="Customer or business name"
                value={form.name}
                onChange={e => setForm(v => ({ ...v, name: e.target.value }))}
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Phone</label>
              <div className="relative">
                <input
                  ref={phoneRef}
                  className={`input ${errors.phone ? "border-red-400 focus:ring-red-400" : ""}`}
                  type="tel"
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={e => { 
                    setForm(v => ({ ...v, phone: e.target.value })); 
                    setShowSuggestions(true);
                    setSelectedId(null); // Reset selection if typing manually
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
              
              {/* Focus dim overlay for the rest of the form */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="fixed inset-0 z-40 bg-white/5 backdrop-blur-[1px] pointer-events-none transition-all duration-300" />
              )}

              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}

              {/* Autocomplete dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 z-50 mt-2 bg-white/95 backdrop-blur-md border border-blue-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-2.5 bg-blue-50/50 border-b border-blue-100/50">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Match Found</p>
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {suggestions.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-blue-600 group transition-all text-left border-b border-gray-50 last:border-none"
                        onClick={() => selectExistingCustomer(c)}
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-100 group-hover:bg-blue-500 flex items-center justify-center text-blue-600 group-hover:text-white font-bold text-sm shrink-0 transition-colors shadow-sm">
                          {c.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          {c.name && !c.name.toLowerCase().includes("walk-in") && (
                            <p className="text-xs font-semibold text-gray-400 group-hover:text-blue-100 transition-colors uppercase tracking-tight">{c.name}</p>
                          )}
                          <p className="text-lg font-bold text-gray-900 group-hover:text-white transition-colors">{c.phone}</p>
                        </div>
                        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Email</label>
              <input
                className="input"
                type="email"
                placeholder="optional"
                value={form.email}
                onChange={e => setForm(v => ({ ...v, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">GST Number</label>
              <input
                className="input"
                type="text"
                placeholder="optional"
                value={form.gstNumber}
                onChange={e => setForm(v => ({ ...v, gstNumber: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-sm"
              >
                Add & Select
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Return Bill</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Bill Code</label>
            <input
              className="input text-center tracking-[0.3em] uppercase font-mono text-lg"
              type="text"
              maxLength={8}
              placeholder="A3F2B1"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1">Enter the 6-character code from the original bill</p>
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
// SELECTED CUSTOMER CARD
// ============================================================================

function SelectedCustomerCard({ customer, billCode, isNew, onClear }) {
  return (
    <div className="flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
        {customer.name?.charAt(0)?.toUpperCase() || "W"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{customer.name}</p>
        <p className="text-sm text-gray-500">{customer.phone}</p>
      </div>
      {isNew && (
        <span className="shrink-0 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold uppercase tracking-wide">
          New
        </span>
      )}
      {billCode && (
        <span className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-semibold tracking-wider">
          #{billCode}
        </span>
      )}
      <button
        type="button"
        onClick={onClear}
        className="shrink-0 text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
      >
        Change
      </button>
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
  const [showReturn, setShowReturn] = useState(false);

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
  const [billDiscount, setBillDiscount] = useState(0);
  const [billDiscountType, setBillDiscountType] = useState("percent");
  const [items, setItems] = useState([{ inventoryItemId: "", quantity: 0, unitPrice: 0, discount: 0, discountType: "percent", taxRate: 0, itemName: "" }]);

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory"], queryFn: async () => {
      const response = await apiClient.getInventory();
      return response.data || response.inventory || response || [];
    }
  });
  const { data: nextNumber } = useQuery({ queryKey: ["next-bill-number"], queryFn: apiClient.getNextBillNumber });

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
      const invItemId = updated[idx].inventoryItemId;
      if (invItemId) {
        const invItem = inventory.find(i => i.id === +invItemId);
        if (invItem) {
          const maxQty = Math.floor(invItem.currentQuantity / (invItem.unitValue || 1));
          if (Number(value) > maxQty) {
            finalValue = maxQty;
            toast.error(`Max allowed quantity is ${maxQty} based on current stock`);
          }
        }
      }
    }

    updated[idx] = { ...updated[idx], [field]: finalValue };

    if (field === "inventoryItemId") {
      const inv = inventory.find(i => i.id === +value);
      if (inv) {
        updated[idx].unitPrice = Number(inv.sellingPrice) || 0;
        updated[idx].taxRate = Number(inv.taxRate) || 0;
        updated[idx].itemName = inv.name ? `${inv.name} (${inv.unitValue || 1} ${inv.unit})` : "";
        
        // Initial quantity setting, bounded by maxQty
        const maxQty = Math.floor(inv.currentQuantity / (inv.unitValue || 1));
        updated[idx].quantity = maxQty > 0 ? 1 : 0;
        
        updated[idx].discount = 0;
        updated[idx].discountType = "percent";
      } else {
        updated[idx].unitPrice = 0;
        updated[idx].taxRate = 0;
        updated[idx].itemName = "";
        updated[idx].quantity = 0;
      }
      // Auto-add a new empty row if this is the last row and an item was selected
      if (value && idx === updated.length - 1) {
        updated.push(emptyItem());
      }
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

  return (
    <div className="max-w-4xl space-y-6">
      {/* Modals */}
      {showQuickAdd && <QuickAddCustomerModal onClose={() => setShowQuickAdd(false)} onAdd={handleQuickAdd} />}
      {showReturn && <ReturnBillModal onClose={() => setShowReturn(false)} onReturn={handleReturn} />}

      {/* Page header */}
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost p-2" onClick={() => navigate("/bills")}><ArrowLeft className="w-4 h-4" /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Bill</h1>
          <p className="text-sm text-gray-500">Bill #{nextNumber?.billNumber || "…"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Customer + Bill Details — side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Customer Section */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Customer</h2>
              {!selectedCustomer && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowQuickAdd(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" /> New
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReturn(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" /> Return
                  </button>
                </div>
              )}
            </div>

            {selectedCustomer ? (
              <SelectedCustomerCard customer={selectedCustomer} billCode={billCode} isNew={isNewCustomer} onClear={clearCustomer} />
            ) : (
              <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                Click <strong>New</strong> to add a walk-in customer or <strong>Return</strong> to load an existing bill
              </div>
            )}
          </div>

          {/* Bill Details Section */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Bill Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="input" value={status} onChange={e => {
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bill Date</label>
                <input className="input" type="date" value={billDate} onChange={e => setBillDate(e.target.value)} />
              </div>
              {(status === "unpaid" || status === "partial") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input className="input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
              )}
            </div>
            {status === "partial" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount (₹)</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  min="0"
                  max={total}
                  placeholder="0"
                  value={paidAmount}
                  onChange={e => setPaidAmount(e.target.value)}
                />
                {total > 0 && paidAmount && (
                  <p className="text-xs text-gray-500 mt-1">
                    Remaining: {formatINR(total - Number(paidAmount))}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Items</h2>

          {/* Column Headers */}
          <div className="grid items-center gap-3" style={{ gridTemplateColumns: '2.5fr 0.7fr 1fr 1.3fr 0.8fr 1fr 40px' }}>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Item</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Price (₹)</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Discount</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">GST</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Total</span>
            <span></span>
          </div>

          {/* Item Rows */}
          <div className="space-y-2">
            {items.map((item, idx) => {
              const invItem = inventory.find(i => i.id === +item.inventoryItemId);
              const maxQty = invItem ? Math.floor(invItem.currentQuantity / (invItem.unitValue || 1)) : undefined;

              return (
              <div
                key={idx}
                className="grid items-center gap-3 bg-white border border-gray-200 rounded-xl px-3 py-2.5"
                style={{ gridTemplateColumns: '2.5fr 0.7fr 1fr 1.3fr 0.8fr 1fr 40px' }}
              >
                {/* Item Search Select */}
                <SearchableItemSelect
                  inventory={inventory}
                  value={item.inventoryItemId}
                  onChange={val => handleItemChange(idx, "inventoryItemId", val)}
                />

                {/* Qty */}
                <div className="relative">
                  <input
                    className="input text-sm text-center w-full"
                    type="number"
                    min="0"
                    max={maxQty}
                    value={item.quantity}
                    onChange={e => handleItemChange(idx, "quantity", e.target.value)}
                  />
                  {maxQty !== undefined && item.quantity >= maxQty && (
                     <p className="absolute -bottom-4 left-0 w-full text-center text-[9px] font-bold text-blue-500 uppercase">Max {maxQty}</p>
                  )}
                </div>

                {/* Price */}
                <input
                  className="input text-sm"
                  type="number"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={e => handleItemChange(idx, "unitPrice", e.target.value)}
                />

                {/* Discount — input + % badge */}
                <div className="flex items-center gap-1">
                  <input
                    className="input text-sm flex-1"
                    type="number"
                    min="0"
                    max={item.discountType === "percent" ? "100" : undefined}
                    value={item.discount}
                    onChange={e => handleItemChange(idx, "discount", e.target.value)}
                  />
                  <select
                    className="appearance-none px-2 py-1.5 rounded-md bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-300"
                    value={item.discountType}
                    onChange={e => handleItemChange(idx, "discountType", e.target.value)}
                    title="Discount type"
                  >
                    <option value="percent">%</option>
                    <option value="amount">₹</option>
                  </select>
                </div>

                {/* GST */}
                <input
                  className="input text-sm text-center"
                  type="number"
                  value={item.taxRate}
                  onChange={e => handleItemChange(idx, "taxRate", e.target.value)}
                />

                {/* Total */}
                <span className="text-sm font-semibold text-gray-900 text-right whitespace-nowrap">
                  {formatINR(calcLine(item))}
                </span>

                {/* Delete */}
                <div className="flex justify-center">
                  {items.length > 1 ? (
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                      onClick={() => removeItem(idx)}
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="w-7" />
                  )}
                </div>
              </div>
              );
            })}
          </div>

          <button type="button" className="btn btn-outline gap-2 text-sm" onClick={() => setItems(v => [...v, emptyItem()])}>
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>

        {/* Summary */}
        <div className="card p-5">
          <div className="flex gap-5">
            {/* Notes */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-800 mb-1">Notes</label>
              <textarea className="input h-32 resize-none" placeholder="Optional notes for this bill..."
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            {/* Totals */}
            <div className="w-72 space-y-2.5 text-sm">
              {/* Subtotal */}
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>

              {/* Line Discount */}
              <div className="flex justify-between text-blue-600">
                <span>Line Discount</span>
                <span>- {formatINR(lineDiscount)}</span>
              </div>

              {/* GST */}
              <div className="flex justify-between text-gray-600">
                <span>GST</span>
                <span>{formatINR(tax)}</span>
              </div>

              {/* Bill Discount */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-600 shrink-0">Bill Discount</span>
                <div className="flex items-center gap-1">
                  <input
                    className="input text-sm w-20 text-center"
                    type="number"
                    min="0"
                    max={billDiscountType === "percent" ? "100" : undefined}
                    value={billDiscount}
                    onChange={e => setBillDiscount(e.target.value)}
                  />
                  <select
                    className="appearance-none px-2 py-1.5 rounded-md bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-300"
                    value={billDiscountType}
                    onChange={e => setBillDiscountType(e.target.value)}
                    title="Discount type"
                  >
                    <option value="percent">%</option>
                    <option value="amount">₹</option>
                  </select>
                </div>
                <span className="text-blue-600 shrink-0">- {formatINR(billDiscountAmount)}</span>
              </div>

              {/* Total */}
              <div className="flex justify-between font-bold text-lg text-gray-900 border-t pt-2.5 mt-1">
                <span>Total</span>
                <span className="text-blue-600">{formatINR(total)}</span>
              </div>

              {/* Create Bill Button */}
              <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all shadow-sm"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating…" : "Create Bill"}
              </button>
            </div>
          </div>

          {/* Total in words */}
          {total > 0 && (
            <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
              <p className="text-sm text-gray-700">
                <span className="font-bold text-gray-900">Total (in words) : </span>
                <span className="font-medium italic">{numberToWordsINR(total)}</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" className="btn btn-outline" onClick={() => navigate("/bills")}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
