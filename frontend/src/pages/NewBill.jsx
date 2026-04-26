import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiClient, formatINR } from "@/lib/api";
import { ArrowLeft, Plus, Trash2, UserPlus, RotateCcw, X, Hash, Loader2, Search } from "lucide-react";
import { toast } from "@/lib/toast";

// Helper to generate a 6-character hex bill code
function generateRandomBillCode() {
  const bytes = new Uint8Array(3);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
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
  const debouncedPhone = useDebounce(form.phone.replace(/\D/g, ""), 300);
  const phoneRef = useRef(null);

  // Fetch suggestions when phone changes
  useEffect(() => {
    if (debouncedPhone.length >= 3) {
      setLoadingSuggestions(true);
      apiClient.searchCustomersByPhone(debouncedPhone)
        .then((results) => {
          setSuggestions(results);
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
    setShowSuggestions(false);
    onAdd({ customer, billCode, isNew: false });
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

    // Don't create via API — just pass local data
    onAdd({
      customer: {
        name: customerName,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        gstNumber: form.gstNumber.trim() || null,
      },
      billCode,
      isNew: true,
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
                  onChange={e => { setForm(v => ({ ...v, phone: e.target.value })); setShowSuggestions(true); }}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  autoComplete="off"
                />
                {loadingSuggestions && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}

              {/* Autocomplete dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 border-b">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Existing Customers</p>
                  </div>
                  {suggestions.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left"
                      onClick={() => selectExistingCustomer(c)}
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                        {c.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.phone}</p>
                      </div>
                      <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Select</span>
                    </button>
                  ))}
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
              <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
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
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
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

  // Bill form state
  const [status, setStatus] = useState("unpaid");
  const [paidAmount, setPaidAmount] = useState("");
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ inventoryItemId: "", quantity: 1, unitPrice: 0, discount: 0, taxRate: 18, itemName: "" }]);

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

  // Item handlers
  const handleItemChange = (idx, field, value) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === "inventoryItemId") {
      const inv = inventory.find(i => i.id === +value);
      if (inv) { updated[idx].unitPrice = inv.sellingPrice; updated[idx].taxRate = inv.taxRate; }
      updated[idx].itemName = inv?.name || "";
    }
    setItems(updated);
  };

  const addItem = () => setItems(v => [...v, { inventoryItemId: "", quantity: 1, unitPrice: 0, discount: 0, taxRate: 18, itemName: "" }]);
  const removeItem = (idx) => setItems(v => v.filter((_, i) => i !== idx));

  // Calculations
  const calcLine = (item) => {
    const base = item.quantity * item.unitPrice;
    const disc = base * (item.discount / 100);
    const after = base - disc;
    const tax = after * (item.taxRate / 100);
    return after + tax;
  };

  const subtotal = items.reduce((a, i) => a + i.quantity * i.unitPrice, 0);
  const discount = items.reduce((a, i) => a + i.quantity * i.unitPrice * (i.discount / 100), 0);
  const tax = items.reduce((a, i) => a + (i.quantity * i.unitPrice - i.quantity * i.unitPrice * (i.discount / 100)) * (i.taxRate / 100), 0);
  const total = subtotal - discount + tax;

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
    if (items.some(i => !i.inventoryItemId)) { toast.error("All items must have a product selected"); return; }
    
    // Ensure we have a billCode to send to the backend
    const finalBillCode = billCode || generateRandomBillCode();

    const payload = {
      billCode: finalBillCode,
      status,
      dueDate: dueDate || null,
      notes: notes || null,
      items: items.map(i => ({
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

    if (isNewCustomer) {
      // Send newCustomer object — backend creates customer in same transaction
      payload.newCustomer = {
        name: selectedCustomer.name,
        phone: selectedCustomer.phone,
        email: selectedCustomer.email,
        gstNumber: selectedCustomer.gstNumber,
      };
    } else {
      // Existing customer
      payload.customerId = selectedCustomer.id;
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
        <button className="btn-ghost p-2" onClick={() => navigate("/bills")}><ArrowLeft className="w-4 h-4" /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Bill</h1>
          <p className="text-sm text-gray-500">Bill #{nextNumber?.billNumber || "…"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Customer Section */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Customer</h2>
            {!selectedCustomer && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors shadow-sm"
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

        {/* Bill Details */}
        <div className="card p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select className="input" value={status} onChange={e => { setStatus(e.target.value); if (e.target.value !== "partial") setPaidAmount(""); }}>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial Paid</option>
              <option value="draft">Draft</option>
            </select>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input className="input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
        </div>

        {/* Items */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Items</h2>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-gray-50 p-3 rounded-lg">
                <div className="col-span-12 md:col-span-4">
                  <label className="text-xs text-gray-500">Product</label>
                  <select
                    className="input mt-1"
                    value={item.inventoryItemId}
                    onChange={e => handleItemChange(idx, "inventoryItemId", e.target.value)}
                  >
                    <option value="">— Select product —</option>
                    {inventory.map(i => (
                      <option key={i.id} value={i.id}>{i.name} (Stock: {i.currentQuantity} {i.unit})</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3 md:col-span-2">
                  <label className="text-xs text-gray-500">Qty</label>
                  <input className="input mt-1" type="number" min="1" value={item.quantity}
                    onChange={e => handleItemChange(idx, "quantity", e.target.value)} />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <label className="text-xs text-gray-500">Unit Price (₹)</label>
                  <input className="input mt-1" type="number" step="0.01" value={item.unitPrice}
                    onChange={e => handleItemChange(idx, "unitPrice", e.target.value)} />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <label className="text-xs text-gray-500">Discount %</label>
                  <input className="input mt-1" type="number" min="0" max="100" value={item.discount}
                    onChange={e => handleItemChange(idx, "discount", e.target.value)} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="text-xs text-gray-500">GST %</label>
                  <input className="input mt-1" type="number" value={item.taxRate}
                    onChange={e => handleItemChange(idx, "taxRate", e.target.value)} />
                </div>
                <div className="col-span-1 flex flex-col items-end gap-1">
                  <label className="text-xs text-gray-500">Total</label>
                  <span className="text-sm font-semibold text-gray-900 mt-1">{formatINR(calcLine(item))}</span>
                </div>
                {items.length > 1 && (
                  <div className="col-span-1 flex justify-end">
                    <button type="button" className="btn-danger p-1.5 mt-1" onClick={() => removeItem(idx)}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button type="button" className="btn-outline gap-2 text-sm" onClick={addItem}>
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>

        {/* Summary */}
        <div className="card p-5">
          <div className="flex gap-5">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea className="input h-24 resize-none" placeholder="Thank you for your business!"
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
              <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatINR(discount)}</span></div>
              <div className="flex justify-between text-gray-600"><span>GST</span><span>+{formatINR(tax)}</span></div>
              <div className="flex justify-between font-bold text-lg text-gray-900 border-t pt-2">
                <span>Total</span><span>{formatINR(total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" className="btn-outline" onClick={() => navigate("/bills")}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating…" : "Create Bill"}
          </button>
        </div>
      </form>
    </div>
  );
}
