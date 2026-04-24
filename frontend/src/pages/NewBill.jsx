import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiClient, formatINR } from "@/lib/api";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

export default function NewBill() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const [customerId, setCustomerId] = useState("");
  const [status, setStatus] = useState("unpaid");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ inventoryItemId: "", quantity: 1, unitPrice: 0, discount: 0, taxRate: 18 }]);
  const [error, setError] = useState("");

  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: () => apiClient.getCustomers() });
  const { data: inventory = [] } = useQuery({ queryKey: ["inventory"], queryFn: () => apiClient.getInventory() });
  const { data: nextNumber } = useQuery({ queryKey: ["next-bill-number"], queryFn: apiClient.getNextBillNumber });

  const createMutation = useMutation({
    mutationFn: apiClient.createBill,
    onSuccess: (bill) => {
      qc.invalidateQueries({ queryKey: ["bills"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      navigate(`/bills/${bill.id}`);
    },
    onError: (e) => setError(e.response?.data?.error || "Failed to create bill"),
  });

  const handleItemChange = (idx, field, value) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === "inventoryItemId") {
      const inv = inventory.find(i => i.id === +value);
      if (inv) { updated[idx].unitPrice = inv.sellingPrice; updated[idx].taxRate = inv.taxRate; }
    }
    setItems(updated);
  };

  const addItem = () => setItems(v => [...v, { inventoryItemId: "", quantity: 1, unitPrice: 0, discount: 0, taxRate: 18 }]);
  const removeItem = (idx) => setItems(v => v.filter((_, i) => i !== idx));

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerId) { setError("Please select a customer"); return; }
    if (items.some(i => !i.inventoryItemId)) { setError("All items must have a product selected"); return; }
    setError("");
    createMutation.mutate({
      customerId: +customerId,
      status,
      dueDate: dueDate || null,
      notes: notes || null,
      items: items.map(i => ({
        inventoryItemId: +i.inventoryItemId,
        quantity: +i.quantity,
        unitPrice: +i.unitPrice,
        discount: +i.discount,
        taxRate: +i.taxRate,
      })),
    });
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <button className="btn-ghost p-2" onClick={() => navigate("/bills")}><ArrowLeft className="w-4 h-4" /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Bill</h1>
          <p className="text-sm text-gray-500">Bill #{nextNumber?.billNumber || "…"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Header */}
        <div className="card p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
            <select className="input" value={customerId} onChange={e => setCustomerId(e.target.value)}>
              <option value="">— Select customer —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="draft">Draft</option>
            </select>
          </div>
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

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}

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
