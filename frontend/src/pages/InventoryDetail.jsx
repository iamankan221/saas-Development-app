import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { apiClient, formatINR, formatDate } from "@/lib/api";
import { ArrowLeft, Edit2, Save, X } from "lucide-react";

export default function InventoryDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  const { data: item, isLoading } = useQuery({
    queryKey: ["inventory-item", id],
    queryFn: () => apiClient.getInventoryItem(id),
    onSuccess: (data) => !form && setForm(data),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => apiClient.updateInventoryItem(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory-item", id] }); setEditing(false); },
  });

  if (isLoading) return <p className="text-center py-20 text-gray-400">Loading…</p>;
  if (!item) return <p className="text-center py-20 text-red-500">Item not found.</p>;

  const current = editing ? form : item;

  const fields = [
    { name: "name",             label: "Item Name",         type: "text" },
    { name: "sku",              label: "SKU",               type: "text" },
    { name: "category",         label: "Category",          type: "text" },
    { name: "location",         label: "Storage Location",  type: "text" },
    { name: "unit",             label: "Unit",              type: "text" },
    { name: "purchasePrice",    label: "Purchase Price (₹)",type: "number" },
    { name: "sellingPrice",     label: "Selling Price (₹)", type: "number" },
    { name: "currentQuantity",  label: "Current Stock",     type: "number" },
    { name: "totalQuantity",    label: "Total Quantity",    type: "number" },
    { name: "lowStockThreshold",label: "Low Stock Threshold",type:"number" },
    { name: "taxRate",          label: "GST Rate (%)",      type: "number" },
    { name: "unitValue",        label: "Unit Value (SKU Qty)", type: "number" },
    { name: "hsnCode",          label: "HSN Code",          type: "text" },
    { name: "expiryDate",       label: "Expiry Date",       type: "date" },
  ];

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost p-2" onClick={() => navigate("/inventory")}><ArrowLeft className="w-4 h-4" /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
          <p className="text-sm text-gray-500">{item.category || "—"} · {item.location || "—"}</p>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <button className="btn btn-outline gap-2" onClick={() => { setForm(item); setEditing(false); }}><X className="w-4 h-4" /> Cancel</button>
            <button className="btn btn-primary gap-2" onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}><Save className="w-4 h-4" /> Save</button>
          </div>
        ) : (
          <button className="btn btn-outline gap-2" onClick={() => { setForm({...item}); setEditing(true); }}><Edit2 className="w-4 h-4" /> Edit</button>
        )}
      </div>

      {/* Stock Status */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`card p-4 ${item.currentQuantity <= item.lowStockThreshold ? "border-orange-200 bg-orange-50" : ""}`}>
          <p className="text-xs text-gray-500">Current Stock</p>
          <p className={`text-2xl font-bold mt-1 ${item.currentQuantity <= item.lowStockThreshold ? "text-orange-600" : "text-gray-900"}`}>
            {item.currentQuantity} <span className="text-sm font-normal text-gray-500">{item.unit}</span>
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Stock Value</p>
          <p className="text-2xl font-bold mt-1 text-purple-600">{formatINR(item.sellingPrice * item.currentQuantity)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Margin</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">
            {item.purchasePrice > 0 ? (((item.sellingPrice - item.purchasePrice) / item.sellingPrice) * 100).toFixed(1) : "—"}%
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Item Details</h2>
        <div className="grid grid-cols-2 gap-4">
          {fields.map(f => (
            <div key={f.name}>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{f.label}</label>
              {editing ? (
                <input
                  className="input"
                  type={f.type}
                  step={f.type === "number" ? "0.01" : undefined}
                  value={form[f.name] ?? ""}
                  onChange={e => setForm(v => ({ ...v, [f.name]: e.target.value }))}
                />
              ) : (
                <p className="font-medium text-gray-900">{item[f.name] ?? "—"}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
